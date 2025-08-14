use serde::Serialize;
use tauri::{AppHandle, Listener, Manager};

use crate::event::send;

#[derive(Serialize, Debug, Clone)]
struct NoticePayload {
    title: String,
    body: String,
}

pub fn notice(app: AppHandle) -> tauri::Result<()> {
    let handle = app.clone();
    app.listen("app://notice", move |_| {
        let h = handle.clone();
        println!("called notice from app");
        let _ = send::notify_frontend(h);
    });
    Ok(())
}
