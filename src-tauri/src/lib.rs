use crate::adb_commands::{
    DeviceInfo, DiscoveredDevice, DiscoveredWirelessDevice, FileInfo, PairingData,
    connect_tcp_device, connect_to_discovered_device, discover_wireless_devices,
    discover_wireless_devices_detailed, execute_shell_command, generate_pairing_data,
    get_connected_device, get_connection_port_for_device, get_device_info, get_installed_packages,
    get_logcat_output, list_discovered_devices, list_files, pair_device_with_code, pull_file,
    reconnect_device,
};
use crate::emulator::{get_android_home, launch_avd, list_avds};
use crate::system_info::{
    BatteryInfo, BuildInfo, DisplayInfo, HardwareInfo, NetworkInfo, get_battery_info,
    get_build_info, get_display_info, get_hardware_info, get_network_info,
};
use std::net::IpAddr;

mod adb_commands;
mod emulator;
mod system_info;
mod utils;

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
    let ip_addr: IpAddr = ip
        .parse()
        .map_err(|_| "Invalid IP address format".to_string())?;

    connect_tcp_device(ip_addr, port)
        .ok_or_else(|| "Failed to connect to device".to_string())
        .and_then(|mut device| {
            let mut device_info = get_device_info(&mut device)
                .map_err(|_| "Failed to get device info".to_string())?;
            // Override the serial number with IP:port format for easy reconnection
            device_info.serial_no = format!("{}:{}", ip, port);
            Ok(device_info)
        })
}

#[tauri::command]
fn pair_wireless_device(ip: String, port: u16, pairing_code: String) -> Result<DeviceInfo, String> {
    let ip_addr: IpAddr = ip
        .parse()
        .map_err(|_| "Invalid IP address format".to_string())?;

    // First, pair the device using the pairing port
    pair_device_with_code(ip_addr, port, &pairing_code)?;

    // After successful pairing, find the actual connection port for this device
    let connection_port = get_connection_port_for_device(&ip);

    println!(
        "Attempting to connect to paired device on port {}",
        connection_port
    );

    connect_tcp_device(ip_addr, connection_port)
        .ok_or_else(|| format!("Failed to connect to paired device on port {}. The device may not be advertising a connection service or wireless debugging may have been disabled.", connection_port))
        .and_then(|mut device| {
            let mut device_info = get_device_info(&mut device).map_err(|_| "Failed to get device info".to_string())?;
            // Override the serial number with IP:connection_port format for easy reconnection
            device_info.serial_no = format!("{}:{}", ip, connection_port);
            Ok(device_info)
        })
}

#[tauri::command]
fn get_pairing_qr_data() -> Result<PairingData, String> {
    generate_pairing_data()
}

#[tauri::command]
fn discover_devices() -> Result<Vec<String>, String> {
    discover_wireless_devices().map(|devices| {
        devices
            .into_iter()
            .map(|device| format!("{} - {:?}", device.fullname, device.addresses))
            .collect()
    })
}

#[tauri::command]
fn list_discovered_devices_cmd() -> Result<Vec<DiscoveredDevice>, String> {
    list_discovered_devices()
}

#[tauri::command]
fn discover_wireless_devices_detailed_cmd() -> Result<Vec<DiscoveredWirelessDevice>, String> {
    discover_wireless_devices_detailed()
}

#[tauri::command]
fn connect_to_discovered_device_cmd(device: DiscoveredDevice) -> Result<DeviceInfo, String> {
    connect_to_discovered_device(&device).and_then(|mut device| {
        get_device_info(&mut device).map_err(|_| "Failed to get device info".to_string())
    })
}

#[tauri::command]
fn execute_shell_command_cmd(device_serial: String, command: String) -> Result<String, String> {
    reconnect_device(&device_serial)
        .ok_or_else(|| "Failed to connect to device".to_string())
        .and_then(|mut device| execute_shell_command(&mut device, &command))
}

#[tauri::command]
async fn get_device_hardware_info_cmd(device_serial: String) -> Result<HardwareInfo, String> {
    let device_serial_clone = device_serial.clone();
    tokio::task::spawn_blocking(move || {
        reconnect_device(&device_serial_clone)
            .ok_or_else(|| "Failed to connect to device".to_string())
            .map(|mut device| get_hardware_info(&mut device))
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
}

#[tauri::command]
async fn get_device_display_info_cmd(device_serial: String) -> Result<DisplayInfo, String> {
    let device_serial_clone = device_serial.clone();
    tokio::task::spawn_blocking(move || {
        reconnect_device(&device_serial_clone)
            .ok_or_else(|| "Failed to connect to device".to_string())
            .map(|mut device| get_display_info(&mut device))
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
}

#[tauri::command]
async fn get_device_battery_info_cmd(device_serial: String) -> Result<Option<BatteryInfo>, String> {
    let device_serial_clone = device_serial.clone();
    tokio::task::spawn_blocking(move || {
        reconnect_device(&device_serial_clone)
            .ok_or_else(|| "Failed to connect to device".to_string())
            .map(|mut device| get_battery_info(&mut device))
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
}

#[tauri::command]
async fn get_device_build_info_cmd(device_serial: String) -> Result<BuildInfo, String> {
    let device_serial_clone = device_serial.clone();
    tokio::task::spawn_blocking(move || {
        reconnect_device(&device_serial_clone)
            .ok_or_else(|| "Failed to connect to device".to_string())
            .map(|mut device| get_build_info(&mut device))
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
}

#[tauri::command]
async fn get_device_network_info_cmd(device_serial: String) -> Result<NetworkInfo, String> {
    let device_serial_clone = device_serial.clone();
    tokio::task::spawn_blocking(move || {
        reconnect_device(&device_serial_clone)
            .ok_or_else(|| "Failed to connect to device".to_string())
            .map(|mut device| get_network_info(&mut device))
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
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
            connect_wireless_device,
            pair_wireless_device,
            get_pairing_qr_data,
            discover_devices,
            list_discovered_devices_cmd,
            discover_wireless_devices_detailed_cmd,
            connect_to_discovered_device_cmd,
            execute_shell_command_cmd,
            get_device_hardware_info_cmd,
            get_device_display_info_cmd,
            get_device_battery_info_cmd,
            get_device_build_info_cmd,
            get_device_network_info_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
