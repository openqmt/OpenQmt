mod auth;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .manage(auth::AuthState::new())
        .invoke_handler(tauri::generate_handler![
            auth::auth_register,
            auth::auth_login,
            auth::auth_logout,
            auth::auth_get_current_user,
            auth::auth_restore_session,
            auth::github_start_device_flow,
            auth::github_poll_token,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}