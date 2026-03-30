use base64::{engine::general_purpose::STANDARD, Engine};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub countdown_duration: u8,
    pub default_filter: String,
    pub save_directory: String,
    pub strip_count: u8,
    pub mirror: bool,
    pub sound_enabled: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            countdown_duration: 3,
            default_filter: String::from("none"),
            save_directory: String::new(),
            strip_count: 4,
            mirror: true,
            sound_enabled: true,
        }
    }
}

fn get_settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;

    Ok(app_data_dir.join("settings.json"))
}

#[tauri::command]
async fn get_settings(app: AppHandle) -> Result<Settings, String> {
    let settings_path = get_settings_path(&app)?;

    if !settings_path.exists() {
        return Ok(Settings::default());
    }

    let contents =
        fs::read_to_string(&settings_path).map_err(|e| format!("Failed to read settings: {}", e))?;

    serde_json::from_str(&contents).map_err(|e| format!("Failed to parse settings: {}", e))
}

#[tauri::command]
async fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    let settings_path = get_settings_path(&app)?;

    let contents =
        serde_json::to_string_pretty(&settings).map_err(|e| format!("Failed to serialize: {}", e))?;

    fs::write(&settings_path, contents).map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn save_photo(data: String, file_path: String) -> Result<String, String> {
    let bytes = STANDARD
        .decode(&data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    let path = PathBuf::from(&file_path);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    fs::write(&path, bytes).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(file_path)
}

#[tauri::command]
async fn print_photo(app: AppHandle, data: String) -> Result<(), String> {
    let bytes = STANDARD
        .decode(&data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Create temp file for printing
    let temp_dir = app
        .path()
        .temp_dir()
        .map_err(|e| format!("Failed to get temp dir: {}", e))?;

    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temp dir: {}", e))?;

    let temp_file = temp_dir.join("photobooth_print.jpg");
    fs::write(&temp_file, bytes).map_err(|e| format!("Failed to write temp file: {}", e))?;

    // Platform-specific print command
    #[cfg(target_os = "macos")]
    {
        Command::new("lpr")
            .arg("-o")
            .arg("fit-to-page")
            .arg(&temp_file)
            .output()
            .map_err(|e| format!("Failed to print: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("print")
            .arg(&temp_file)
            .output()
            .map_err(|e| format!("Failed to print: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("lpr")
            .arg(&temp_file)
            .output()
            .map_err(|e| format!("Failed to print: {}", e))?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![get_settings, save_settings, save_photo, print_photo])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
