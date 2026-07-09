mod utils;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| utils::init::setup_window_state(app))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
