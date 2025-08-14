mod event;
mod system;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            system::spawn_metrics_broadcaster(handle);
            event::register_event(&app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, system::read_once])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
