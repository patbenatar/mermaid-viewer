mod commands;
mod watcher;

use commands::{DirName, WatchDir};
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_initial_files,
            commands::get_dir_name,
            commands::read_file_contents,
            commands::delete_file,
        ])
        .setup(|app| {
            // In dev mode, Tauri runs `cargo run` from src-tauri/, so CWD
            // is wrong. Use MERMAID_WATCH_CWD env var if set, else CWD.
            let cwd = std::env::var("MERMAID_WATCH_CWD")
                .map(std::path::PathBuf::from)
                .unwrap_or_else(|_| std::env::current_dir().expect("Failed to get current directory"));
            let watch_dir = cwd.join(".mermaid-visuals");

            let dir_name = cwd
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            app.manage(WatchDir(watch_dir.clone()));
            app.manage(DirName(dir_name));

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                watcher::start_watcher(handle, watch_dir).await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
