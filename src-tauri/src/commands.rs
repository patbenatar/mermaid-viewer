use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::State;

pub struct WatchDir(pub PathBuf);
pub struct DirName(pub String);

#[derive(Debug, Clone, Serialize)]
pub struct MmdFile {
    pub filename: String,
    pub content: String,
}

#[tauri::command]
pub fn get_initial_files(watch_dir: State<'_, WatchDir>) -> Vec<MmdFile> {
    let files: Vec<MmdFile> = crate::watcher::get_initial_files(&watch_dir.0)
        .into_iter()
        .map(|(filename, content)| MmdFile { filename, content })
        .collect();
    eprintln!("[commands] get_initial_files returning {} files: {:?}", files.len(), files.iter().map(|f| &f.filename).collect::<Vec<_>>());
    files
}

#[tauri::command]
pub fn get_dir_name(dir_name: State<'_, DirName>) -> String {
    dir_name.0.clone()
}

#[tauri::command]
pub fn delete_file(filename: String, watch_dir: State<'_, WatchDir>) -> Result<(), String> {
    let path = watch_dir.0.join(&filename);
    fs::remove_file(&path).map_err(|e| format!("Failed to delete {}: {}", filename, e))
}

#[tauri::command]
pub fn read_file_contents(
    filename: String,
    watch_dir: State<'_, WatchDir>,
) -> Result<String, String> {
    let path = watch_dir.0.join(&filename);
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", filename, e))
}
