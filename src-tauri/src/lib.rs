use crate::adb_commands::{
    DeviceInfo, FileInfo, get_android_home, get_connected_device, get_device_info,
    get_installed_packages, get_logcat_output, launch_avd, list_avds, list_files, pull_file,
    connect_tcp_device, reconnect_device,
};
use std::net::IpAddr;

mod adb_commands;

#[tauri::command]
fn device_info() -> Result<DeviceInfo, ()> {
    get_connected_device()
        .and_then(|mut device| get_device_info(&mut device).ok())
        .ok_or(())
}

#[tauri::command]
fn get_android_sdk_path() -> Option<String> {
    get_android_home().map(|path| path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_available_avds() -> Vec<String> {
    list_avds()
}

#[tauri::command]
fn start_avd(avd_name: String) -> Result<(), String> {
    launch_avd(&avd_name)
}

#[tauri::command]
fn browse_files(path: String) -> Result<Vec<FileInfo>, String> {
    get_connected_device()
        .ok_or_else(|| "No device connected".to_string())
        .and_then(|mut device| list_files(&mut device, &path))
}

#[tauri::command]
fn browse_files_for_device(device_serial: String, path: String) -> Result<Vec<FileInfo>, String> {
    reconnect_device(&device_serial)
        .ok_or_else(|| "Failed to connect to device".to_string())
        .and_then(|mut device| list_files(&mut device, &path))
}

#[tauri::command]
fn download_file(remote_path: String, local_path: String) -> Result<(), String> {
    get_connected_device()
        .ok_or_else(|| "No device connected".to_string())
        .and_then(|mut device| pull_file(&mut device, &remote_path, &local_path))
}

#[tauri::command]
fn get_apps() -> Result<Vec<String>, String> {
    get_connected_device()
        .ok_or_else(|| "No device connected".to_string())
        .and_then(|mut device| get_installed_packages(&mut device))
}

#[tauri::command]
fn get_apps_for_device(device_serial: String) -> Result<Vec<String>, String> {
    reconnect_device(&device_serial)
        .ok_or_else(|| "Failed to connect to device".to_string())
        .and_then(|mut device| get_installed_packages(&mut device))
}

#[tauri::command]
fn get_logcat(lines: u32) -> Result<String, String> {
    get_connected_device()
        .ok_or_else(|| "No device connected".to_string())
        .and_then(|mut device| get_logcat_output(&mut device, lines))
}

#[tauri::command]
fn get_logcat_for_device(device_serial: String, lines: u32) -> Result<String, String> {
    reconnect_device(&device_serial)
        .ok_or_else(|| "Failed to connect to device".to_string())
        .and_then(|mut device| get_logcat_output(&mut device, lines))
}

#[tauri::command]
fn connect_wireless_device(ip: String, port: u16) -> Result<DeviceInfo, String> {
    let ip_addr: IpAddr = ip.parse()
        .map_err(|_| "Invalid IP address format".to_string())?;
    
    connect_tcp_device(ip_addr, port)
        .ok_or_else(|| "Failed to connect to device".to_string())
        .and_then(|mut device| {
            let mut device_info = get_device_info(&mut device).map_err(|_| "Failed to get device info".to_string())?;
            // Override the serial number with IP:port format for easy reconnection
            device_info.serial_no = format!("{}:{}", ip, port);
            Ok(device_info)
        })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            device_info,
            get_android_sdk_path,
            get_available_avds,
            start_avd,
            browse_files,
            browse_files_for_device,
            download_file,
            get_apps,
            get_apps_for_device,
            get_logcat,
            get_logcat_for_device,
            connect_wireless_device
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
