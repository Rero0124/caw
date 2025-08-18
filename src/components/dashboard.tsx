"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { useLanguage } from "./language-provider"
import { Activity, Server, Users, HardDrive, Cpu, MemoryStick, Wifi, X } from "lucide-react"
import { listen } from "@tauri-apps/api/event"
import { invoke } from "@tauri-apps/api/core"
import { truncate } from "../lib/utils"

type Snapshot = {
  cpu: { global: number; per_core: number[]; freq_ghz: number; cores: number; temp_c?: number | null; top: { name: string; cpu: number; mem: number }[] };
  mem: { total: number; used: number; available: number; cached?: number | null; buffers?: number | null; swap_total: number; swap_used: number };
  disk: { total: number, used: number, parts: { name: string; mount: string; fs: string; total: number; used: number }[]; read_bps?: number | null; write_bps?: number | null };
  net: { name: string; ipv4: string[]; subnet: string[], mac: string[]; speed_mbps?: number | null; rx_bps: number; tx_bps: number; rx_packets: number; tx_packets: number }[];
};

export function Dashboard() {
  const { t } = useLanguage()

  const [snap, setSnap] = useState<Snapshot | null>(null);

  const [systemResources, setSystemResources] = useState({
    cpu: { usage: 45, cores: 8, temperature: 65, frequency: 3.2 },
    memory: { used: 8.2, total: 16, cached: 2.1, buffers: 0.8, swap: 1.2 },
    disk: { used: 256, total: 512, readSpeed: 120, writeSpeed: 85 },
    network: { download: 12.5, upload: 3.2, packetsReceived: 1250, packetsSent: 890 },
  })

  const [detailData, setDetailData] = useState({
    cpu: {
      processes: [
        { name: "Chrome", usage: 15.2, memory: 512 },
        { name: "VS Code", usage: 8.7, memory: 256 },
        { name: "Node.js", usage: 6.3, memory: 128 },
        { name: "System", usage: 4.1, memory: 64 },
      ],
      coreUsage: [45, 38, 52, 41, 33, 47, 39, 44],
    },
    memory: {
      breakdown: [
        { type: t("used"), value: 8.2, color: "bg-blue-500" },
        { type: t("cached"), value: 2.1, color: "bg-green-500" },
        { type: t("buffers"), value: 0.8, color: "bg-yellow-500" },
        { type: t("swap"), value: 1.2, color: "bg-red-500" },
        { type: t("available"), value: 3.7, color: "bg-gray-300" },
      ],
    },
    disk: {
      partitions: [
        { name: "/", used: 180, total: 250, fileSystem: "ext4", mountPoint: "/" },
        { name: "/home", used: 76, total: 262, fileSystem: "ext4", mountPoint: "/home" },
      ],
    },
    network: {
      interfaces: [
        {
          name: "eth0",
          ip: "192.168.1.100",
          mac: "00:1B:44:11:3A:B7",
          speed: "1000 Mbps",
          subnetMask: "255.255.255.0",
        },
        {
          name: "wlan0",
          ip: "192.168.1.101",
          mac: "00:1B:44:11:3A:B8",
          speed: "300 Mbps",
          subnetMask: "255.255.255.0",
        },
      ],
    },
  })

  const [serviceStats, setServiceStats] = useState({
    totalServices: 4,
    activeServices: 2,
    totalConnections: 8,
    dataTransfer: 156,
  })

  const [runningServices, setRunningServices] = useState([
    {
      name: t("sftpService"),
      status: "running",
      port: 22,
      connections: 3,
      uptime: 7200,
      dataTransfer: 45.2,
    },
    {
      name: t("smbService"),
      status: "running",
      port: 445,
      connections: 5,
      uptime: 5400,
      dataTransfer: 23.8,
    },
    {
      name: "Web Dashboard",
      status: "running",
      port: 3000,
      connections: 1,
      uptime: 3600,
      dataTransfer: 2.1,
    },
    {
      name: "API Server",
      status: "stopped",
      port: 8080,
      connections: 0,
      uptime: 0,
      dataTransfer: 0,
    },
  ])

  const [serviceSessions, setServiceSessions] = useState({
    [t("sftpService")]: [
      { id: "sftp-1", clientIP: "192.168.1.50", username: "user1", duration: 1800, dataTransfer: 45.2 },
      { id: "sftp-2", clientIP: "192.168.1.51", username: "user2", duration: 3600, dataTransfer: 23.1 },
      { id: "sftp-3", clientIP: "192.168.1.52", username: "admin", duration: 900, dataTransfer: 12.5 },
    ],
    [t("smbService")]: [
      { id: "smb-1", clientIP: "192.168.1.60", username: "user3", duration: 2400, dataTransfer: 67.8 },
      { id: "smb-2", clientIP: "192.168.1.61", username: "user4", duration: 1200, dataTransfer: 34.2 },
      { id: "smb-3", clientIP: "192.168.1.62", username: "user5", duration: 600, dataTransfer: 15.6 },
      { id: "smb-4", clientIP: "192.168.1.63", username: "guest", duration: 300, dataTransfer: 8.9 },
      { id: "smb-5", clientIP: "192.168.1.64", username: "user6", duration: 1800, dataTransfer: 28.4 },
    ],
    "Web Dashboard": [{ id: "web-1", clientIP: "192.168.1.70", username: "admin", duration: 7200, dataTransfer: 2.1 }],
    "API Server": [],
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemResources((prev) => ({
        cpu: {
          ...prev.cpu,
          usage: Math.floor(Math.random() * 80) + 10,
          temperature: Math.floor(Math.random() * 20) + 55,
          frequency: Math.random() * 1 + 2.8,
        },
        memory: {
          ...prev.memory,
          used: Math.random() * 4 + 6,
          cached: Math.random() * 1 + 1.5,
          buffers: Math.random() * 0.5 + 0.5,
          swap: Math.random() * 0.8 + 0.8,
        },
        disk: {
          ...prev.disk,
          used: prev.disk.used + Math.random() * 0.1,
          readSpeed: Math.floor(Math.random() * 100) + 80,
          writeSpeed: Math.floor(Math.random() * 80) + 60,
        },
        network: {
          download: Math.random() * 50 + 5,
          upload: Math.random() * 20 + 1,
          packetsReceived: Math.floor(Math.random() * 500) + 1000,
          packetsSent: Math.floor(Math.random() * 400) + 700,
        },
      }))

      setDetailData((prev) => ({
        ...prev,
        cpu: {
          ...prev.cpu,
          coreUsage: prev.cpu.coreUsage.map(() => Math.floor(Math.random() * 80) + 10),
          processes: prev.cpu.processes.map((p) => ({
            ...p,
            usage: Math.random() * 20 + 5,
            memory: Math.floor(Math.random() * 200) + 100,
          })),
        },
      }))

      setServiceStats((prev) => ({
        ...prev,
        totalConnections: Math.floor(Math.random() * 20) + 5,
        dataTransfer: Math.floor(Math.random() * 200) + 50,
      }))

      setRunningServices((prev) =>
        prev.map((service) => ({
          ...service,
          connections: service.status === "running" ? Math.floor(Math.random() * 10) + 1 : 0,
          dataTransfer: service.status === "running" ? Math.random() * 50 + 10 : 0,
          uptime: service.status === "running" ? service.uptime + 5 : 0,
        })),
      )
    }, 5000)

    let unlisten: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      // 1) 먼저 구독을 건다 (이벤트 놓치지 않도록)
      unlisten = await listen<Snapshot>("metrics://tick", (e) => {
        if (!cancelled) setSnap(e.payload);
      });

      // 2) 초기 1회 스냅샷(화면 빈칸 방지)
      try {
        const initial = await invoke<Snapshot>("read_once");
        if (!cancelled) setSnap(initial);
      } catch (e) {
        console.error("read_once failed:", e);
      }
    })();

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
      clearInterval(interval)
    }
  }, [])

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}${t("hours")} ${minutes}${t("minutes")}`
    } else if (minutes > 0) {
      return `${minutes}${t("minutes")} ${secs}${t("seconds")}`
    } else {
      return `${secs}${t("seconds")}`
    }
  }

  const renderResourceDetails = (resource: string) => {
    if(snap) {
switch (resource) {
      case "cpu":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">{t("coreUsage")}</h4>
                <div className="space-y-2">
                  {snap.cpu.per_core.map((usage, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm w-12">
                        {t("core")} {index + 1}
                      </span>
                      <Progress value={usage} className="flex-1 transition-all duration-1000 ease-out" />
                      <span className="text-sm w-12">{usage.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">{t("processes")}</h4>
                <div className="space-y-2">
                  {snap.cpu.top.map((process, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{truncate(process.name, 20)}</span>
                      <span>{(process.cpu * 100).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{snap.cpu.temp_c ? `${snap.cpu.temp_c.toFixed(2)}°C` : "N/A"}</div>
                <div className="text-sm text-muted-foreground">{t("temperature")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{snap.cpu.freq_ghz.toFixed(2)} GHz</div>
                <div className="text-sm text-muted-foreground">{t("frequency")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{snap.cpu.per_core.length}</div>
                <div className="text-sm text-muted-foreground">{t("cores")}</div>
              </div>
            </div>
          </div>
        )
      case "memory":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span>{t("used")}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{(snap.mem.used / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                  <div className="text-sm text-muted-foreground">
                    {((snap.mem.used / snap.mem.total) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>{t("cached")}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{((snap.mem.cached ?? 0) / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                  <div className="text-sm text-muted-foreground">
                    {((snap.mem.cached ?? 0 / snap.mem.total) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span>{t("buffers")}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{((snap.mem.buffers ?? 0) / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                  <div className="text-sm text-muted-foreground">
                    {((snap.mem.buffers ?? 0 / snap.mem.total) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span>{t("swap")}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{(snap.mem.swap_used / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                  <div className="text-sm text-muted-foreground">
                    {((snap.mem.swap_used / snap.mem.total) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-gray-300"></div>
                  <span>{t("available")}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{(snap.mem.available / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                  <div className="text-sm text-muted-foreground">
                    {((snap.mem.available / snap.mem.total) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case "disk":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {snap.disk.parts.map((partition, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{partition.name}</span>
                    <span className="text-sm text-muted-foreground">{partition.fs}</span>
                  </div>
                  <Progress value={(partition.used / partition.total) * 100} className="mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {(partition.used / 1024 / 1024 / 1024).toFixed(2)} GB / {(partition.total / 1024 / 1024 / 1024).toFixed(2)} GB
                    </span>
                    <span>{partition.mount}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{snap.disk.read_bps} MB/s</div>
                <div className="text-sm text-muted-foreground">{t("readSpeed")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{snap.disk.write_bps} MB/s</div>
                <div className="text-sm text-muted-foreground">{t("writeSpeed")}</div>
              </div>
            </div>
          </div>
        )
      case "network":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">{t("networkInterfaces")}</h4>
              {snap.net.map((iface, index) => {
                if(iface.ipv4.length === 0)  {
                  return <></>
                } else {
                  return (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{iface.name}</span>
                      <Badge variant={index < 2 ? "default" : "secondary"}>{index < 2 ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>IP: {iface.ipv4}</div>
                      <div>MAC: {iface.mac}</div>
                      <div>
                        {t("subnetMask")}: {iface.subnet}
                      </div>
                      <div>Speed: {iface.speed_mbps}</div>
                    </div>
                    {index < 2 && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-xs">
                          <span>↓ {t("download")}</span>
                          <span>{(Math.random() * 50 + 10).toFixed(1)} MB/s</span>
                        </div>
                        <Progress value={Math.random() * 80 + 10} className="h-2" />
                        <div className="flex justify-between text-xs">
                          <span>↑ {t("upload")}</span>
                          <span>{(Math.random() * 20 + 5).toFixed(1)} MB/s</span>
                        </div>
                        <Progress value={Math.random() * 60 + 5} className="h-2" />
                      </div>
                    )}
                  </div>
                  )
                }
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{systemResources.network.packetsReceived}</div>
                <div className="text-sm text-muted-foreground">{t("packetsReceived")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemResources.network.packetsSent}</div>
                <div className="text-sm text-muted-foreground">{t("packetsSent")}</div>
              </div>
            </div>
          </div>
        )
      default:
        return null
      }
    } else {
      return null;
    }
    
  }

  const renderServiceSessions = (serviceName: string) => {
    const sessions = serviceSessions[serviceName] || []

    if (sessions.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">{t("noActiveSessions")}</div>
    }

    return (
      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{session.username}</span>
                <span className="text-sm text-muted-foreground">{session.clientIP}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>
                  {t("sessionDuration")}: {formatUptime(session.duration)}
                </span>
                <span>
                  {t("dataTransfer")}: {session.dataTransfer.toFixed(1)} MB/s
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnectSession(serviceName, session.id)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              {t("disconnectSession")}
            </Button>
          </div>
        ))}
      </div>
    )
  }

  const disconnectSession = (serviceName: string, sessionId: string) => {
    setServiceSessions((prev) => ({
      ...prev,
      [serviceName]: prev[serviceName].filter((session) => session.id !== sessionId),
    }))

    setRunningServices((prev) =>
      prev.map((service) =>
        service.name === serviceName ? { ...service, connections: Math.max(0, service.connections - 1) } : service,
      ),
    )
  }

  if(snap) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-3xl font-bold">{t("dashboard")}</h2>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">{t("systemResources")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("cpu")}</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{snap.cpu.global.toFixed(2)}%</div>
                    <Progress value={snap.cpu.global} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {snap.cpu.per_core.length} {t("cores")}
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5" />
                    <span>
                      {t("cpu")} - {t("systemResourceDetails")}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                {renderResourceDetails("cpu")}
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("memory")}</CardTitle>
                    <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(snap.mem.used / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                    <Progress
                      value={(snap.mem.used / snap.mem.total) * 100}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("of")} {(snap.mem.total / 1024 / 1024 / 1024).toFixed(0)} GB
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <MemoryStick className="h-5 w-5" />
                    <span>
                      {t("memory")} - {t("systemResourceDetails")}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                {renderResourceDetails("memory")}
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("disk")}</CardTitle>
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(snap.disk.used / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                    <Progress value={(snap.disk.used / snap.disk.total) * 100} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("of")} {(snap.disk.total / 1024 / 1024 / 1024).toFixed(2)} GB
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <HardDrive className="h-5 w-5" />
                    <span>
                      {t("disk")} - {t("systemResourceDetails")}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                {renderResourceDetails("disk")}
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("network")}</CardTitle>
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemResources.network.download.toFixed(1)} MB/s</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ↓ {systemResources.network.download.toFixed(1)} MB/s ↑ {systemResources.network.upload.toFixed(1)}{" "}
                      MB/s
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Wifi className="h-5 w-5" />
                    <span>
                      {t("network")} - {t("systemResourceDetails")}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                {renderResourceDetails("network")}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">{t("services")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalServices")}</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{serviceStats.totalServices}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {serviceStats.activeServices} {t("activeServices").toLowerCase()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("activeConnections")}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{serviceStats.totalConnections}</div>
                <Progress value={(serviceStats.totalConnections / 50) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("dataTransfer")}</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{serviceStats.dataTransfer} MB/s</div>
                <Progress value={(serviceStats.dataTransfer / 500) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("serviceStatus")}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {serviceStats.activeServices}/{serviceStats.totalServices}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t("running").toLowerCase()}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("services")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {runningServices.map((service, index) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            service.status === "running" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          }`}
                        >
                          <Server className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{service.name}</p>
                            <Badge variant={service.status === "running" ? "default" : "secondary"}>
                              {t(service.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("port")}: {service.port} | {t("connections")}: {service.connections}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{service.dataTransfer.toFixed(1)} MB/s</p>
                        <p className="text-xs text-muted-foreground">
                          {t("uptime")}: {formatUptime(service.uptime)}
                        </p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Server className="h-5 w-5" />
                        <span>
                          {service.name} - {t("activeSessions")}
                        </span>
                      </DialogTitle>
                    </DialogHeader>
                    {renderServiceSessions(service.name)}
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } else {
    return null;
  }
}
