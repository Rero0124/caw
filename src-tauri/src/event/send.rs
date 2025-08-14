use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Debug, Clone)]
struct NoticePayload {
    title: String,
    body: String,
}

#[tauri::command]
pub fn notify_frontend(app: AppHandle) -> tauri::Result<()> {
    let payload = NoticePayload {
        title: "알림".into(),
        body: "Rust → React 이벤트 전송!".into(),
    };
    let _ = app.emit("job://notice", payload);
    println!("sended notice from rust");
    Ok(())
}
