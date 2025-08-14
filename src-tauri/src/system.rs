use cfg_if::cfg_if;
use mac_address::mac_address_by_name;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    thread,
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter};

use sysinfo::{Components, CpuRefreshKind, Disks, Networks, Process, RefreshKind, System};

#[derive(serde::Serialize, Clone)]
pub struct CpuProcess {
    pub name: String,
    pub cpu: f32, // %
    pub mem: u64, // bytes
}

#[derive(serde::Serialize, Clone)]
pub struct CpuStats {
    pub global: f32,
    pub per_core: Vec<f32>,
    pub freq_ghz: f32,
    pub cores: usize,
    pub temp_c: Option<f32>,
    pub top: Vec<CpuProcess>,
}

#[derive(serde::Serialize, Clone)]
pub struct MemStats {
    pub total: u64,
    pub used: u64,
    pub available: u64,
    pub cached: Option<u64>,
    pub buffers: Option<u64>,
    pub swap_total: u64,
    pub swap_used: u64,
}

#[derive(serde::Serialize, Clone)]
pub struct DiskPart {
    pub name: String,
    pub mount: String,
    pub fs: String,
    pub total: u64,
    pub used: u64,
}

#[derive(serde::Serialize, Clone)]
pub struct DiskStats {
    pub parts: Vec<DiskPart>,
    pub read_bps: Option<u64>, // Δ 계산 결과(없으면 None)
    pub write_bps: Option<u64>,
}

#[derive(serde::Serialize, Clone)]
pub struct NicStats {
    pub name: String,
    pub ipv4: Vec<String>,
    pub mac: Vec<String>,
    pub speed_mbps: Option<u64>,
    pub rx_bps: u64,
    pub tx_bps: u64,
    pub rx_packets: u64,
    pub tx_packets: u64,
}

#[derive(serde::Serialize, Clone)]
pub struct Snapshot {
    pub cpu: CpuStats,
    pub mem: MemStats,
    pub disk: DiskStats,
    pub net: Vec<NicStats>,
}

#[tauri::command]
pub fn read_once() -> Snapshot {
    build_snapshot(None)
}

const TICK_MS: u64 = 30;
const EMIT_MS: u64 = 1500;
const ALPHA: f32 = 0.3; // EMA 스무딩 정도 (낮을수록 더 부드러움)
const TOP_N: usize = 10;

pub fn spawn_metrics_broadcaster(app: AppHandle) {
    let handle = app.clone();

    // 최신 스냅샷을 공유할 캐시
    let cache: Arc<Mutex<Option<Snapshot>>> = Arc::new(Mutex::new(None));

    // ── 1) 100ms 샘플링 스레드: prev 갱신 + 캐시에 저장
    {
        let cache_upd = Arc::clone(&cache);
        thread::spawn(move || {
            let mut prev: Option<(Instant, PreCounters)> = None;
            loop {
                let snap = build_snapshot(prev.as_ref());
                prev = Some((Instant::now(), PreCounters::from(&snap)));
                *cache_upd.lock().unwrap() = Some(snap);
                thread::sleep(Duration::from_millis(30));
            }
        });
    }

    // ── 2) 1초마다 emit 스레드: 캐시에서 읽어 전송
    thread::spawn(move || loop {
        let tick = Duration::from_millis(TICK_MS);
        let interval = Duration::from_millis(EMIT_MS);
        let mut last_emit = Instant::now();

        // 누적용 상태
        let mut count: u64 = 0;
        let mut cpu_global_sum: f64 = 0.0;
        let mut cpu_per_core_sum: Vec<f64> = Vec::new();
        let mut mem_used_sum: u128 = 0;
        let mut mem_avail_sum: u128 = 0;
        let mut disk_read_sum: u128 = 0;
        let mut disk_write_sum: u128 = 0;
        let mut have_disk_io = false;

        // 인터페이스별 누적 속도
        let mut net_sum: HashMap<String, (u128, u128)> = HashMap::new(); // name -> (rx_bps_sum, tx_bps_sum)

        // 프로세스 EMA
        let mut proc_ema: HashMap<String, f32> = HashMap::new(); // name(또는 pid) -> ema_cpu

        // 마지막 스냅샷(구조/파티션 목록 등 보존용)
        let mut last_snap: Option<Snapshot> = None;

        loop {
            // 30ms 대기
            thread::sleep(tick);

            // 최신 샘플 읽기
            if let Some(snap) = cache.lock().unwrap().clone() {
                // 누적(평균용)
                count += 1;
                cpu_global_sum += snap.cpu.global as f64;

                // per-core 길이 변화 대응
                if cpu_per_core_sum.len() != snap.cpu.per_core.len() {
                    cpu_per_core_sum = vec![0.0; snap.cpu.per_core.len()];
                }
                for (i, v) in snap.cpu.per_core.iter().enumerate() {
                    cpu_per_core_sum[i] += *v as f64;
                }

                mem_used_sum += snap.mem.used as u128;
                mem_avail_sum += snap.mem.available as u128;

                if let (Some(r), Some(w)) = (snap.disk.read_bps, snap.disk.write_bps) {
                    disk_read_sum += r as u128;
                    disk_write_sum += w as u128;
                    have_disk_io = true;
                }

                for n in &snap.net {
                    let e = net_sum.entry(n.name.clone()).or_insert((0, 0));
                    e.0 += n.rx_bps as u128;
                    e.1 += n.tx_bps as u128;
                }

                // 프로세스 EMA (pid 기준이 더 정확하지만 이름으로도 기본 안정)
                for p in &snap.cpu.top {
                    let ent = proc_ema.entry(p.name.clone()).or_insert(p.cpu);
                    *ent = ALPHA * p.cpu + (1.0 - ALPHA) * *ent;
                }

                last_snap = Some(snap);
            }

            // 1.5초마다 전송
            if last_emit.elapsed() >= interval {
                if let Some(mut base) = last_snap.clone() {
                    if count > 0 {
                        // 평균 반영
                        base.cpu.global = (cpu_global_sum / count as f64) as f32;
                        for (i, sum) in cpu_per_core_sum.iter().enumerate() {
                            base.cpu.per_core[i] = (sum / count as f64) as f32;
                        }
                        base.mem.used = (mem_used_sum / count as u128) as u64;
                        base.mem.available = (mem_avail_sum / count as u128) as u64;

                        if have_disk_io {
                            base.disk.read_bps = Some((disk_read_sum / count as u128) as u64);
                            base.disk.write_bps = Some((disk_write_sum / count as u128) as u64);
                        }

                        // NIC별 평균 속도
                        for n in base.net.iter_mut() {
                            if let Some((rx_sum, tx_sum)) = net_sum.get(&n.name) {
                                n.rx_bps = (rx_sum / count as u128) as u64;
                                n.tx_bps = (tx_sum / count as u128) as u64;
                            }
                        }

                        // 프로세스 TOP: EMA 기준 재구성
                        let mut top: Vec<CpuProcess> = base
                            .cpu
                            .top
                            .iter()
                            .map(|p| {
                                let ema = *proc_ema.get(&p.name).unwrap_or(&p.cpu);
                                CpuProcess {
                                    name: p.name.clone(),
                                    cpu: ema,
                                    mem: p.mem,
                                }
                            })
                            .collect();
                        top.sort_by(|a, b| b.cpu.total_cmp(&a.cpu));
                        top.truncate(TOP_N);
                        base.cpu.top = top;
                    }

                    let _ = handle.emit("metrics://tick", &base);
                }

                // 누적 초기화
                count = 0;
                cpu_global_sum = 0.0;
                cpu_per_core_sum.fill(0.0);
                mem_used_sum = 0;
                mem_avail_sum = 0;
                disk_read_sum = 0;
                disk_write_sum = 0;
                have_disk_io = false;
                net_sum.clear();

                last_emit = Instant::now();
            }
        }
    });
}

// ── Δ 계산을 위한 이전 누적치
#[derive(Clone)]
struct PreCounters {
    nic_bytes: HashMap<String, (u64, u64)>, // name -> (rx, tx)
    disk_bytes: Option<(u64, u64)>,         // (read, write) 전체합 (지원 OS에서만)
}
impl PreCounters {
    fn from(s: &Snapshot) -> Self {
        Self {
            nic_bytes: s
                .net
                .iter()
                .map(|n| (n.name.clone(), (n.rx_packets, n.tx_packets)))
                .collect(), // 자리만 잡아둠(아래에서 실제 누적치로 대체)
            disk_bytes: None,
        }
    }
}

fn build_snapshot(prev: Option<&(Instant, PreCounters)>) -> Snapshot {
    // ── System: 필요한 리프레시만 켬
    let mut sys = System::new_with_specifics(RefreshKind::everything());
    sys.refresh_cpu_all();
    sys.refresh_memory();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    // ── CPU
    let per_core: Vec<f32> = sys.cpus().iter().map(|c| c.cpu_usage()).collect();
    let global = sys.global_cpu_usage();
    let freq_ghz = if !sys.cpus().is_empty() {
        let avg_mhz: f32 =
            sys.cpus().iter().map(|c| c.frequency() as f32).sum::<f32>() / sys.cpus().len() as f32;
        avg_mhz / 1000.0
    } else {
        0.0
    };
    // 온도 센서
    let mut max_temp: Option<f32> = None;
    let mut components = Components::new_with_refreshed_list();
    for c in &mut components {
        c.refresh(); // 최신값
        if let Some(t) = c.temperature() {
            max_temp = Some(max_temp.map_or(t, |m| m.max(t)));
        }
    }
    // 상위 프로세스
    let mut top: Vec<CpuProcess> = sys
        .processes()
        .values()
        .map(|p| CpuProcess {
            name: p.name().to_str().unwrap_or("N/A").into(),
            cpu: p.cpu_usage(),
            mem: p.memory(),
        })
        .collect();
    top.sort_by(|a, b| b.cpu.partial_cmp(&a.cpu).unwrap());
    top.truncate(per_core.len());

    let cpu = CpuStats {
        global,
        per_core,
        freq_ghz,
        cores: sys.cpus().len(),
        temp_c: max_temp,
        top,
    };

    // ── 메모리
    let mut mem = MemStats {
        total: sys.total_memory(),
        used: sys.used_memory(),
        available: sys.available_memory(),
        cached: None,
        buffers: None,
        swap_total: sys.total_swap(),
        swap_used: sys.used_swap(),
    };
    cfg_if! {
      if #[cfg(target_os = "linux")] {
        if let Ok(text) = std::fs::read_to_string("/proc/meminfo") {
          for line in text.lines() {
            if line.starts_with("Cached:") {
              mem.cached = line.split_whitespace().nth(1).and_then(|kib| kib.parse::<u64>().ok()).map(|kib| kib*1024);
            } else if line.starts_with("Buffers:") {
              mem.buffers = line.split_whitespace().nth(1).and_then(|kib| kib.parse::<u64>().ok()).map(|kib| kib*1024);
            }
          }
        }
      }
    }

    // ── 디스크 파티션
    let disks = Disks::new_with_refreshed_list();
    let parts = disks
        .iter()
        .map(|d| {
            let total = d.total_space();
            let used = total.saturating_sub(d.available_space());
            DiskPart {
                name: d.name().to_string_lossy().to_string(),
                mount: d.mount_point().to_string_lossy().to_string(),
                fs: d.file_system().to_str().unwrap_or("N/A").to_string(),
                total,
                used,
            }
        })
        .collect::<Vec<_>>();

    // 디스크 IO B/s (Linux 우선)
    let mut read_bps: Option<u64> = None;
    let mut write_bps: Option<u64> = None;
    cfg_if! {
      if #[cfg(target_os = "linux")] {
        if let Ok(stat) = systemstat::Platform::new() {
          if let Ok(io) = stat.block_device_statistics() {
            let read = io.values().map(|v| v.read_bytes).sum::<u64>();
            let write = io.values().map(|v| v.write_bytes).sum::<u64>();
            if let Some((t0, prevc)) = prev {
              if let Some((pr, pw)) = prevc.disk_bytes {
                let dt = Instant::now().duration_since(*t0).as_secs_f64().max(0.001);
                read_bps  = Some(((read.saturating_sub(pr)) as f64 / dt) as u64);
                write_bps = Some(((write.saturating_sub(pw)) as f64 / dt) as u64);
              }
            }
          }
        }
      }
    }

    // ── 네트워크 Δ
    let mut networks = Networks::new_with_refreshed_list();
    networks.refresh(true); // 최신 카운터
    let mut nic_delta_map: HashMap<String, (u64, u64, u64, u64)> = HashMap::new();
    for (name, n) in &networks {
        nic_delta_map.insert(
            name.to_string(),
            (
                n.total_received(),
                n.total_transmitted(),
                n.packets_received(),
                n.packets_transmitted(),
            ),
        );
    }

    // IP/MAC/링크속도
    let addrs = get_if_addrs::get_if_addrs().ok();
    let mut net = Vec::new();
    for (name, (rx_tot, tx_tot, rxp, txp)) in nic_delta_map {
        // Δ → B/s
        let (mut rx_bps, mut tx_bps) = (0u64, 0u64);
        if let Some((t0, prevc)) = prev {
            if let Some((prx, ptx)) = prevc.nic_bytes.get(&name) {
                let dt = Instant::now().duration_since(*t0).as_secs_f64().max(0.001);
                rx_bps = ((rx_tot.saturating_sub(*prx)) as f64 / dt) as u64;
                tx_bps = ((tx_tot.saturating_sub(*ptx)) as f64 / dt) as u64;
            }
        }

        // 기본 정보
        let mut ipv4 = Vec::new();
        let mut mac = Vec::new();
        if let Some(aslist) = addrs.as_ref() {
            for a in aslist.iter().filter(|a| a.name == name) {
                if let get_if_addrs::IfAddr::V4(v4) = &a.addr {
                    ipv4.push(v4.ip.to_string());
                }

                mac.push(
                    mac_address_by_name(&a.name)
                        .ok()
                        .flatten()
                        .map(|m| m.to_string().to_uppercase().replace('-', ":"))
                        .unwrap_or("N/A".into()),
                );
            }
        }

        // 링크 속도(가능한 OS에서만)
        let mut speed_mbps = None;
        cfg_if! {
          if #[cfg(target_os = "linux")] {
            if let Ok(s) = std::fs::read_to_string(format!("/sys/class/net/{}/speed", name)) {
              if let Ok(v) = s.trim().parse::<i64>() { if v > 0 { speed_mbps = Some(v as u64); } }
            }
          }
        }

        net.push(NicStats {
            name,
            ipv4,
            mac,
            speed_mbps,
            rx_bps,
            tx_bps,
            rx_packets: rxp,
            tx_packets: txp,
        });
    }

    Snapshot {
        cpu,
        mem,
        disk: DiskStats {
            parts,
            read_bps,
            write_bps,
        },
        net,
    }
}
