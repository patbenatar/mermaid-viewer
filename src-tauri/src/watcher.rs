use notify_debouncer_mini::{new_debouncer, DebounceEventResult};
use serde::Serialize;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind")]
pub enum FileEvent {
    FileChanged { filename: String, content: String },
    FileRemoved { filename: String },
}

fn scan_mmd_files(dir: &PathBuf) -> Vec<(String, String)> {
    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("mmd") {
                if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                    if let Ok(content) = fs::read_to_string(&path) {
                        files.push((filename.to_string(), content));
                    }
                }
            }
        }
    }
    files.sort_by(|a, b| a.0.cmp(&b.0));
    files
}

pub fn get_initial_files(watch_dir: &PathBuf) -> Vec<(String, String)> {
    scan_mmd_files(watch_dir)
}

pub async fn start_watcher(app: AppHandle, watch_dir: PathBuf) {
    eprintln!("[watcher] Watching directory: {}", watch_dir.display());

    // Create directory if it doesn't exist
    if !watch_dir.exists() {
        let _ = fs::create_dir_all(&watch_dir);
        eprintln!("[watcher] Created directory");
    }

    // Emit initial files
    let initial_files = scan_mmd_files(&watch_dir);
    for (filename, content) in &initial_files {
        let _ = app.emit(
            "file-event",
            FileEvent::FileChanged {
                filename: filename.clone(),
                content: content.clone(),
            },
        );
    }

    let mut known_files: HashSet<String> = initial_files.into_iter().map(|(f, _)| f).collect();

    // Set up channel to bridge sync notify callback → async
    let (tx, mut rx) = mpsc::channel::<()>(16);

    let mut debouncer = match new_debouncer(Duration::from_millis(500), move |result: DebounceEventResult| {
        if let Ok(_events) = result {
            // Any event in the watched directory triggers a re-scan.
            // The re-scan itself filters for .mmd files.
            let _ = tx.blocking_send(());
        }
    }) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("Failed to create file watcher: {e}");
            return;
        }
    };

    if let Err(e) = debouncer
        .watcher()
        .watch(&watch_dir, notify::RecursiveMode::NonRecursive)
    {
        eprintln!("Failed to watch directory: {e}");
        return;
    }

    // Keep debouncer alive — dropping it stops the watcher
    let _debouncer = debouncer;

    // Event loop: on each notification, re-scan and diff
    while rx.recv().await.is_some() {
        let current_files = scan_mmd_files(&watch_dir);
        let current_names: HashSet<String> = current_files.iter().map(|(f, _)| f.clone()).collect();

        // New or modified files
        for (filename, content) in &current_files {
            let _ = app.emit(
                "file-event",
                FileEvent::FileChanged {
                    filename: filename.clone(),
                    content: content.clone(),
                },
            );
        }

        // Deleted files
        for removed in known_files.difference(&current_names) {
            let _ = app.emit(
                "file-event",
                FileEvent::FileRemoved {
                    filename: removed.clone(),
                },
            );
        }

        known_files = current_names;
    }
}
