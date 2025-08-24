use serde::{Deserialize, Serialize};
use crate::adb_commands::Device;
use std::str::from_utf8;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SystemInfo {
    pub hardware: HardwareInfo,
    pub display: DisplayInfo,
    pub battery: Option<BatteryInfo>,
    pub build: BuildInfo,
    pub network: NetworkInfo,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HardwareInfo {
    pub cpu_architecture: Option<String>,
    pub cpu_abi_list: Option<String>,
    pub total_memory: Option<String>,
    pub available_memory: Option<String>,
    pub internal_storage_total: Option<String>,
    pub internal_storage_available: Option<String>,
    pub manufacturer: Option<String>,
    pub brand: Option<String>,
    pub board: Option<String>,
    pub hardware: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DisplayInfo {
    pub resolution: Option<String>,
    pub density: Option<String>,
    pub physical_size: Option<String>,
    pub refresh_rate: Option<String>,
    pub orientation: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BatteryInfo {
    pub level: Option<i32>,
    pub status: Option<String>,
    pub health: Option<String>,
    pub temperature: Option<f32>,
    pub voltage: Option<i32>,
    pub technology: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BuildInfo {
    pub fingerprint: Option<String>,
    pub build_date: Option<String>,
    pub build_user: Option<String>,
    pub build_host: Option<String>,
    pub security_patch: Option<String>,
    pub bootloader: Option<String>,
    pub baseband: Option<String>,
    pub build_id: Option<String>,
    pub build_tags: Option<String>,
    pub build_type: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NetworkInfo {
    pub wifi_status: Option<String>,
    pub connection_type: Option<String>,
    pub signal_strength: Option<i32>,
    pub upload_speed: Option<String>,
    pub download_speed: Option<String>,
    pub ip_addresses: Vec<String>,
    pub mac_addresses: Vec<String>,
    pub network_interfaces: Vec<NetworkInterface>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NetworkInterface {
    pub name: String,
    pub ip_address: Option<String>,
    pub mac_address: Option<String>,
    pub status: Option<String>,
}

fn execute_adb_command(device: &mut Device, command: &[&str]) -> Option<String> {
    let mut buf: Vec<u8> = Vec::new();
    match device.shell_command(command, &mut buf) {
        Ok(_) => {
            match from_utf8(&buf) {
                Ok(output) => Some(output.trim().to_string()),
                Err(_) => None,
            }
        }
        Err(_) => None,
    }
}

fn get_property(device: &mut Device, property: &str) -> Option<String> {
    execute_adb_command(device, &["getprop", property])
}

pub fn get_hardware_info(device: &mut Device) -> HardwareInfo {
    HardwareInfo {
        cpu_architecture: get_property(device, "ro.product.cpu.abi"),
        cpu_abi_list: get_property(device, "ro.product.cpu.abilist"),
        total_memory: parse_memory_info(device, "MemTotal"),
        available_memory: parse_memory_info(device, "MemAvailable"),
        internal_storage_total: get_storage_info(device, "/data", "total"),
        internal_storage_available: get_storage_info(device, "/data", "available"),
        manufacturer: get_property(device, "ro.product.manufacturer"),
        brand: get_property(device, "ro.product.brand"),
        board: get_property(device, "ro.product.board"),
        hardware: get_property(device, "ro.hardware"),
    }
}

fn parse_memory_info(device: &mut Device, field: &str) -> Option<String> {
    if let Some(meminfo) = execute_adb_command(device, &["cat", "/proc/meminfo"]) {
        for line in meminfo.lines() {
            if line.starts_with(field) {
                if let Some(value) = line.split_whitespace().nth(1) {
                    if let Ok(kb) = value.parse::<u64>() {
                        let mb = kb / 1024;
                        let gb = mb as f64 / 1024.0;
                        if gb >= 1.0 {
                            return Some(format!("{:.1} GB", gb));
                        } else {
                            return Some(format!("{} MB", mb));
                        }
                    }
                }
                break;
            }
        }
    }
    None
}

fn get_storage_info(device: &mut Device, path: &str, info_type: &str) -> Option<String> {
    if let Some(df_output) = execute_adb_command(device, &["df", "-h", path]) {
        for line in df_output.lines() {
            if line.contains(path) || line.starts_with("/dev/") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 4 {
                    return match info_type {
                        "total" => Some(parts[1].to_string()),
                        "available" => Some(parts[3].to_string()),
                        _ => None,
                    };
                }
            }
        }
    }
    None
}

pub fn get_display_info(device: &mut Device) -> DisplayInfo {
    DisplayInfo {
        resolution: get_screen_resolution(device),
        density: get_screen_density(device),
        physical_size: get_physical_size(device),
        refresh_rate: get_refresh_rate(device),
        orientation: get_orientation(device),
    }
}

fn get_screen_resolution(device: &mut Device) -> Option<String> {
    if let Some(output) = execute_adb_command(device, &["wm", "size"]) {
        for line in output.lines() {
            if line.contains("Physical size:") {
                if let Some(size) = line.split("Physical size:").nth(1) {
                    return Some(size.trim().to_string());
                }
            }
        }
    }
    None
}

fn get_screen_density(device: &mut Device) -> Option<String> {
    if let Some(output) = execute_adb_command(device, &["wm", "density"]) {
        for line in output.lines() {
            if line.contains("Physical density:") {
                if let Some(density) = line.split("Physical density:").nth(1) {
                    return Some(density.trim().to_string());
                }
            }
        }
    }
    None
}

fn get_physical_size(device: &mut Device) -> Option<String> {
    get_property(device, "ro.sf.lcd_density").map(|density| format!("{} dpi", density))
}

fn get_refresh_rate(device: &mut Device) -> Option<String> {
    if let Some(output) = execute_adb_command(device, &["dumpsys", "display"]) {
        for line in output.lines() {
            if line.contains("refreshRate=") {
                if let Some(rate_part) = line.split("refreshRate=").nth(1) {
                    if let Some(rate) = rate_part.split(',').next() {
                        return Some(format!("{} Hz", rate.trim()));
                    }
                }
            }
        }
    }
    None
}

fn get_orientation(device: &mut Device) -> Option<String> {
    if let Some(output) = execute_adb_command(device, &["dumpsys", "input"]) {
        for line in output.lines() {
            if line.contains("SurfaceOrientation:") {
                if let Some(orientation) = line.split("SurfaceOrientation:").nth(1) {
                    return match orientation.trim() {
                        "0" => Some("Portrait".to_string()),
                        "1" => Some("Landscape".to_string()),
                        "2" => Some("Reverse Portrait".to_string()),
                        "3" => Some("Reverse Landscape".to_string()),
                        _ => Some(orientation.trim().to_string()),
                    };
                }
            }
        }
    }
    None
}

pub fn get_battery_info(device: &mut Device) -> Option<BatteryInfo> {
    if let Some(output) = execute_adb_command(device, &["dumpsys", "battery"]) {
        let mut battery_info = BatteryInfo {
            level: None,
            status: None,
            health: None,
            temperature: None,
            voltage: None,
            technology: None,
        };

        for line in output.lines() {
            let line = line.trim();
            if line.starts_with("level: ") {
                if let Ok(level) = line[7..].parse::<i32>() {
                    battery_info.level = Some(level);
                }
            } else if line.starts_with("status: ") {
                battery_info.status = Some(line[8..].to_string());
            } else if line.starts_with("health: ") {
                battery_info.health = Some(line[8..].to_string());
            } else if line.starts_with("temperature: ") {
                if let Ok(temp) = line[13..].parse::<i32>() {
                    battery_info.temperature = Some(temp as f32 / 10.0);
                }
            } else if line.starts_with("voltage: ") {
                if let Ok(voltage) = line[9..].parse::<i32>() {
                    battery_info.voltage = Some(voltage);
                }
            } else if line.starts_with("technology: ") {
                battery_info.technology = Some(line[12..].to_string());
            }
        }

        Some(battery_info)
    } else {
        None
    }
}

pub fn get_build_info(device: &mut Device) -> BuildInfo {
    BuildInfo {
        fingerprint: get_property(device, "ro.build.fingerprint"),
        build_date: get_property(device, "ro.build.date"),
        build_user: get_property(device, "ro.build.user"),
        build_host: get_property(device, "ro.build.host"),
        security_patch: get_property(device, "ro.build.version.security_patch"),
        bootloader: get_property(device, "ro.bootloader"),
        baseband: get_property(device, "ro.baseband"),
        build_id: get_property(device, "ro.build.id"),
        build_tags: get_property(device, "ro.build.tags"),
        build_type: get_property(device, "ro.build.type"),
    }
}

pub fn get_network_info(device: &mut Device) -> NetworkInfo {
    let mut network_info = NetworkInfo {
        wifi_status: get_wifi_status(device),
        connection_type: get_connection_type(device),
        signal_strength: get_signal_strength(device),
        upload_speed: get_network_speed(device, "upload"),
        download_speed: get_network_speed(device, "download"),
        ip_addresses: Vec::new(),
        mac_addresses: Vec::new(),
        network_interfaces: Vec::new(),
    };

    if let Some(interfaces) = get_network_interfaces(device) {
        for interface in interfaces {
            if let Some(ip) = &interface.ip_address {
                network_info.ip_addresses.push(ip.clone());
            }
            if let Some(mac) = &interface.mac_address {
                network_info.mac_addresses.push(mac.clone());
            }
            network_info.network_interfaces.push(interface);
        }
    }

    network_info
}

fn get_wifi_status(device: &mut Device) -> Option<String> {
    if let Some(output) = execute_adb_command(device, &["dumpsys", "wifi"]) {
        for line in output.lines() {
            if line.contains("Wi-Fi is ") {
                if line.contains("enabled") {
                    return Some("Connected".to_string());
                } else if line.contains("disabled") {
                    return Some("Disconnected".to_string());
                }
            }
        }
    }
    None
}

fn get_connection_type(device: &mut Device) -> Option<String> {
    // Check for WiFi connection first
    if let Some(wifi_info) = execute_adb_command(device, &["dumpsys", "wifi"]) {
        if wifi_info.contains("mWifiInfo") && wifi_info.contains("state: COMPLETED") {
            return Some("WiFi".to_string());
        }
    }
    
    // Check for mobile data connection
    if let Some(telephony) = execute_adb_command(device, &["dumpsys", "telephony.registry"]) {
        if telephony.contains("mDataConnectionState=2") || telephony.contains("CONNECTED") {
            // Try to determine mobile data type
            if let Some(network_type) = get_property(device, "gsm.network.type") {
                match network_type.as_str() {
                    "LTE" | "LTEA" => return Some("4G LTE".to_string()),
                    "UMTS" | "HSDPA" | "HSUPA" | "HSPA" => return Some("3G".to_string()),
                    "EDGE" | "GPRS" => return Some("2G".to_string()),
                    "NR" => return Some("5G".to_string()),
                    _ => return Some("Mobile Data".to_string()),
                }
            }
            return Some("Mobile Data".to_string());
        }
    }
    
    // Check for ethernet connection
    if let Some(interfaces) = get_network_interfaces(device) {
        for interface in interfaces {
            if interface.name.contains("eth") && interface.status.as_ref().map_or(false, |s| s == "UP") {
                if interface.ip_address.is_some() {
                    return Some("Ethernet".to_string());
                }
            }
        }
    }
    
    Some("Unknown".to_string())
}

fn get_signal_strength(device: &mut Device) -> Option<i32> {
    if let Some(output) = execute_adb_command(device, &["dumpsys", "telephony.registry"]) {
        for line in output.lines() {
            if line.contains("mSignalStrength") {
                // Parse signal strength - this is a simplified approach
                if let Some(rssi_part) = line.split("rssi=").nth(1) {
                    if let Some(rssi_str) = rssi_part.split(' ').next() {
                        if let Ok(rssi) = rssi_str.parse::<i32>() {
                            // Convert RSSI to percentage (rough approximation)
                            let percentage = if rssi <= -100 { 0 } else if rssi >= -50 { 100 } else { ((rssi + 100) * 2) };
                            return Some(percentage);
                        }
                    }
                }
            }
        }
    }
    
    // Try WiFi signal strength as fallback
    if let Some(output) = execute_adb_command(device, &["dumpsys", "wifi"]) {
        for line in output.lines() {
            if line.contains("rssi: ") {
                if let Some(rssi_part) = line.split("rssi: ").nth(1) {
                    if let Some(rssi_str) = rssi_part.split(' ').next() {
                        if let Ok(rssi) = rssi_str.parse::<i32>() {
                            // Convert WiFi RSSI to percentage
                            let percentage = if rssi <= -100 { 0 } else if rssi >= -50 { 100 } else { ((rssi + 100) * 2) };
                            return Some(percentage);
                        }
                    }
                }
            }
        }
    }
    
    None
}

fn get_network_speed(device: &mut Device, speed_type: &str) -> Option<String> {
    // Simple connectivity test using ping
    if let Some(ping_output) = execute_adb_command(device, &["ping", "-c", "3", "8.8.8.8"]) {
        // Parse ping results for basic connectivity info
        for line in ping_output.lines() {
            if line.contains("avg") {
                if let Some(time_part) = line.split("avg = ").nth(1) {
                    if let Some(avg_time) = time_part.split('/').next() {
                        if let Ok(ms) = avg_time.parse::<f32>() {
                            // Rough estimate based on ping time
                            let estimated_speed = if ms < 50.0 {
                                "Good (>10 Mbps)"
                            } else if ms < 100.0 {
                                "Fair (1-10 Mbps)"
                            } else {
                                "Slow (<1 Mbps)"
                            };
                            return Some(estimated_speed.to_string());
                        }
                    }
                }
            }
        }
    }
    
    // Try to get speed info from system properties or network stats
    if speed_type == "download" {
        // Check for download speed indicators
        if let Some(stats) = execute_adb_command(device, &["cat", "/proc/net/dev"]) {
            // This is a placeholder - actual implementation would parse network statistics
            return Some("Estimating...".to_string());
        }
    }
    
    None
}

fn get_network_interfaces(device: &mut Device) -> Option<Vec<NetworkInterface>> {
    if let Some(output) = execute_adb_command(device, &["ip", "addr", "show"]) {
        let mut interfaces = Vec::new();
        let mut current_interface: Option<NetworkInterface> = None;

        for line in output.lines() {
            let line = line.trim();
            
            if line.contains(": ") && (line.contains("wlan") || line.contains("eth") || line.contains("lo") || line.contains("rmnet") || line.contains("ccmni")) {
                if let Some(interface) = current_interface.take() {
                    interfaces.push(interface);
                }
                
                if let Some(name_part) = line.split(": ").nth(1) {
                    let name = name_part.split_whitespace().next().unwrap_or("unknown").to_string();
                    current_interface = Some(NetworkInterface {
                        name,
                        ip_address: None,
                        mac_address: None,
                        status: if line.contains("UP") { Some("UP".to_string()) } else { Some("DOWN".to_string()) },
                    });
                }
            } else if let Some(ref mut interface) = current_interface {
                if line.starts_with("inet ") {
                    if let Some(ip_part) = line.split_whitespace().nth(1) {
                        if let Some(ip) = ip_part.split('/').next() {
                            interface.ip_address = Some(ip.to_string());
                        }
                    }
                } else if line.starts_with("link/ether ") {
                    if let Some(mac) = line.split_whitespace().nth(1) {
                        interface.mac_address = Some(mac.to_string());
                    }
                }
            }
        }

        if let Some(interface) = current_interface {
            interfaces.push(interface);
        }

        if !interfaces.is_empty() {
            Some(interfaces)
        } else {
            None
        }
    } else {
        None
    }
}
