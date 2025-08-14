use tauri::{AppHandle, Manager};

mod receive;
mod send;

pub fn register_event(app: &AppHandle) -> tauri::Result<()> {
    let _ = receive::notice(app.clone());
    Ok(())
}
