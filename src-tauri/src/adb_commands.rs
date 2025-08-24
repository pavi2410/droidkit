use crate::utils::get_local_ip_address;
use adb_client::{
    ADBDeviceExt, ADBServer, ADBTcpDevice, ADBUSBDevice, MDNSDiscoveryService, RustADBError,
};
use serde::{Deserialize, Serialize};
use std::net::{IpAddr, SocketAddr, SocketAddrV4};
use std::str::from_utf8;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

#[derive(Serialize)]
pub(crate) enum DeviceTransport {
    USB,
    TCP,
}

#[derive(Serialize)]
pub(crate) struct DeviceInfo {
    pub transport: DeviceTransport,
    pub serial_no: String,
    pub model: String,
    pub android_version: String,
    pub sdk_version: String,
}

pub(crate) enum Device {
    USB(ADBUSBDevice),
    TCP(ADBTcpDevice),
}

impl Device {
    pub fn shell_command(
        &mut self,
        cmd: &[&str],
        output: &mut dyn std::io::Write,
    ) -> Result<(), RustADBError> {
        match self {
            Device::USB(device) => device.shell_command(cmd, output),
            Device::TCP(device) => device.shell_command(cmd, output),
        }
    }
}

pub(crate) fn get_connected_device() -> Option<Device> {
    let autodetect = ADBUSBDevice::autodetect();
    match autodetect {
        Ok(device) => Some(Device::USB(device)),
        Err(what) => {
            println!("Error: {:?}", what);
            None
        }
    }
}

#[derive(Serialize, Deserialize)]
pub(crate) enum ConnectionMethod {
    USB { serial_number: String },
    TCP { socket_address: String },
}

#[derive(Serialize, Deserialize)]
pub(crate) struct DiscoveredDevice {
    pub connection_method: ConnectionMethod,
    pub model: Option<String>,
    pub android_version: Option<String>,
    pub sdk_version: Option<String>,
    pub is_connected: bool,
}

pub(crate) fn list_discovered_devices() -> Result<Vec<DiscoveredDevice>, String> {
    let mut discovered_devices = Vec::new();

    // Try to get currently connected USB device
    if let Ok(usb_device) = ADBUSBDevice::autodetect() {
        if let Ok(device_info) = get_device_info(&mut Device::USB(usb_device)) {
            discovered_devices.push(DiscoveredDevice {
                connection_method: ConnectionMethod::USB {
                    serial_number: device_info.serial_no,
                },
                model: Some(device_info.model),
                android_version: Some(device_info.android_version),
                sdk_version: Some(device_info.sdk_version),
                is_connected: true,
            });
        }
    }

    // Add any TCP devices that might be available
    // For now, this is empty but could be populated from known connections

    Ok(discovered_devices)
}

pub(crate) fn connect_to_discovered_device(device: &DiscoveredDevice) -> Result<Device, String> {
    match &device.connection_method {
        ConnectionMethod::USB { serial_number } => {
            // Try to connect to USB device by serial
            match ADBUSBDevice::autodetect() {
                Ok(device) => {
                    // In a real implementation, you'd verify the serial matches
                    Ok(Device::USB(device))
                }
                Err(e) => Err(format!(
                    "Failed to connect to USB device {}: {:?}",
                    serial_number, e
                )),
            }
        }
        ConnectionMethod::TCP { socket_address } => {
            // Parse socket address (IP:PORT format) and connect
            if socket_address.contains(':') {
                let parts: Vec<&str> = socket_address.split(':').collect();
                if parts.len() == 2 {
                    if let Ok(ip) = parts[0].parse::<IpAddr>() {
                        if let Ok(port) = parts[1].parse::<u16>() {
                            return connect_tcp_device(ip, port)
                                .ok_or_else(|| "Failed to connect to TCP device".to_string());
                        }
                    }
                }
            }

            Err(format!("Invalid socket address format: {}", socket_address))
        }
    }
}

pub(crate) fn reconnect_device(serial_no: &str) -> Option<Device> {
    // For TCP devices, we need to parse the serial to get IP and port
    if serial_no.contains(':') {
        let parts: Vec<&str> = serial_no.split(':').collect();
        if parts.len() == 2 {
            if let Ok(ip) = parts[0].parse::<IpAddr>() {
                if let Ok(port) = parts[1].parse::<u16>() {
                    let socket_addr = SocketAddr::new(ip, port);
                    if let Ok(device) = ADBTcpDevice::new(socket_addr) {
                        return Some(Device::TCP(device));
                    }
                }
            }
        }
    }

    // For USB devices, try autodetect
    if let Ok(device) = ADBUSBDevice::autodetect() {
        return Some(Device::USB(device));
    }

    None
}

pub(crate) fn connect_tcp_device(ip: IpAddr, port: u16) -> Option<Device> {
    let socket_addr = SocketAddr::new(ip, port);
    match ADBTcpDevice::new(socket_addr) {
        Ok(device) => Some(Device::TCP(device)),
        Err(what) => {
            println!("Error connecting to TCP device: {:?}", what);
            None
        }
    }
}

pub(crate) fn pair_device_with_code(
    ip: IpAddr,
    port: u16,
    pairing_code: &str,
) -> Result<(), String> {
    // Convert IpAddr to Ipv4Addr
    let ipv4 = match ip {
        IpAddr::V4(ipv4) => ipv4,
        IpAddr::V6(_) => return Err("IPv6 addresses are not supported for pairing".to_string()),
    };

    // Validate pairing code - should be 6 digits
    let trimmed_code = pairing_code.trim();
    if trimmed_code.len() != 6 {
        return Err("Pairing code must be exactly 6 digits".to_string());
    }

    if !trimmed_code.chars().all(|c| c.is_ascii_digit()) {
        return Err("Pairing code must contain only digits".to_string());
    }

    println!(
        "Attempting to pair with device at {}:{} using code: {}",
        ip, port, trimmed_code
    );

    // Use adb_client's ADBServer to pair the device
    let mut adb_server = ADBServer::default();
    let socket_addr_v4 = SocketAddrV4::new(ipv4, port);

    println!("Created socket address: {:?}", socket_addr_v4);
    println!("Pairing code to be used: '{}'", trimmed_code);

    // Try the pairing with extensive error logging
    let result = adb_server.pair(socket_addr_v4, trimmed_code.to_string());

    match result {
        Ok(_) => {
            println!("Pairing successful with device at {}:{}", ip, port);
            Ok(())
        }
        Err(e) => {
            println!("Detailed pairing error: {:#?}", e);

            // The ParseIntError might be coming from the adb_client library itself
            // Let's provide a helpful error message based on common issues
            let error_str = format!("{:?}", e);

            if error_str.contains("ParseIntError") {
                Err(
                    "Pairing failed due to a protocol parsing error. This might happen if:\n\
                     1. The device is not in pairing mode\n\
                     2. The pairing port is incorrect\n\
                     3. The pairing code has expired\n\
                     Please check your Android device's wireless debugging screen and try again."
                        .to_string(),
                )
            } else if error_str.contains("ConnectionRefused") {
                Err("Connection refused. Please ensure:\n\
                     1. The device is in pairing mode\n\
                     2. The IP address and port are correct\n\
                     3. Both devices are on the same network"
                    .to_string())
            } else if error_str.contains("TimedOut") {
                Err("Pairing timed out. Please try again with a fresh pairing code.".to_string())
            } else {
                Err(format!("Pairing failed with error: {}", error_str))
            }
        }
    }
}

#[derive(Serialize)]
pub(crate) struct PairingData {
    pub ip: String,
    pub port: u16,
    pub qr_data: String,
}

#[derive(Serialize)]
pub(crate) struct DiscoveredWirelessDevice {
    pub name: String,
    pub fullname: String,
    pub addresses: Vec<String>,
    pub port: u16,
    pub connection_port: Option<u16>, // Track the actual connection port if available
    pub is_paired: bool,
    pub is_connected: bool,
}

pub(crate) fn discover_wireless_devices() -> Result<Vec<DiscoveredWirelessDevice>, String> {
    let (tx, rx) = mpsc::channel();

    let mut discovery_service = MDNSDiscoveryService::new()
        .map_err(|e| format!("Failed to create mDNS discovery service: {:?}", e))?;

    discovery_service
        .start(tx)
        .map_err(|e| format!("Failed to start mDNS discovery: {:?}", e))?;

    // Listen for devices for a few seconds
    let mut devices = Vec::new();
    let timeout = Duration::from_secs(5);
    let start_time = std::time::Instant::now();

    println!("Starting mDNS discovery for wireless devices...");

    while start_time.elapsed() < timeout {
        if let Ok(device) = rx.try_recv() {
            println!("Discovered mDNS service: {}", device.fullname);

            // Extract name from fullname (usually format is "device_name._adb-tls-connect._tcp.local.")
            let name = device
                .fullname
                .split('.')
                .next()
                .unwrap_or(&device.fullname)
                .to_string();

            // Determine if this is a pairing or connection service and set appropriate port
            let (port, service_type) = if device.fullname.contains("_adb-tls-pairing._tcp") {
                // This is a pairing service - try to extract actual port or use a reasonable default
                (37851, "pairing") // Common pairing port range starts around 37851
            } else if device.fullname.contains("_adb-tls-connect._tcp") {
                // This is a connection service - we'll show it but use a pairing port for pairing
                (37851, "connection") // Default pairing port for connection services
            } else {
                // Unknown service type, assume it's a pairing service for now
                (37851, "unknown")
            };

            println!("Service type: {}, using port: {}", service_type, port);

            // Filter out IPv6 addresses and only include IPv4 addresses
            let ipv4_addresses: Vec<String> = device
                .addresses
                .iter()
                .filter_map(|addr| {
                    // Filter for IPv4 addresses only
                    match addr {
                        std::net::IpAddr::V4(_) => Some(addr.to_string()),
                        std::net::IpAddr::V6(_) => None,
                    }
                })
                .collect();

            println!("IPv4 addresses found: {:?}", ipv4_addresses);

            // Add both pairing and connection services if they have IPv4 addresses
            // This allows users to attempt pairing even with connection services
            if !ipv4_addresses.is_empty() {
                let wireless_device = DiscoveredWirelessDevice {
                    name: name.clone(),
                    fullname: device.fullname.clone(),
                    addresses: ipv4_addresses.clone(),
                    port,
                    connection_port: if service_type == "connection" {
                        Some(5555)
                    } else {
                        None
                    },
                    is_paired: false, // We'd need to check this against known paired devices
                    is_connected: false, // We'd need to check if currently connected
                };
                println!(
                    "Added {} device: {} at {}:{}",
                    service_type, name, ipv4_addresses[0], port
                );
                devices.push(wireless_device);
            }
        }
        thread::sleep(Duration::from_millis(100));
    }

    discovery_service
        .shutdown()
        .map_err(|e| format!("Failed to shutdown mDNS discovery: {:?}", e))?;

    println!(
        "Discovery completed. Found {} wireless devices",
        devices.len()
    );
    Ok(devices)
}

pub(crate) fn discover_wireless_devices_detailed() -> Result<Vec<DiscoveredWirelessDevice>, String>
{
    discover_wireless_devices()
}

pub(crate) fn get_connection_port_for_device(ip: &str) -> u16 {
    // Try to discover devices and find the connection port for the given IP
    if let Ok(devices) = discover_wireless_devices() {
        for device in devices {
            if device.addresses.contains(&ip.to_string()) {
                if let Some(connection_port) = device.connection_port {
                    println!(
                        "Found connection port {} for device at {}",
                        connection_port, ip
                    );
                    return connection_port;
                }
            }
        }
    }

    // If no specific connection service found, try common ADB ports in order
    let common_ports = [5555, 5556, 5557, 5558];
    for &test_port in &common_ports {
        println!(
            "Testing connection on port {} for device at {}",
            test_port, ip
        );
        if let Ok(ip_addr) = ip.parse::<IpAddr>() {
            if connect_tcp_device(ip_addr, test_port).is_some() {
                println!("Successfully connected to device at {}:{}", ip, test_port);
                return test_port;
            }
        }
    }

    // Default to standard ADB port if not found
    println!("Using default connection port 5555 for device at {}", ip);
    5555
}

pub(crate) fn generate_pairing_data() -> Result<PairingData, String> {
    // For QR pairing, we need to start ADB in pairing mode
    // This typically involves starting the ADB server in pairing mode

    // First, try to get local IP address that's accessible to Android devices
    let local_ip = get_local_ip_address().unwrap_or_else(|| "192.168.1.100".to_string());

    // Use a standard pairing port (this might need to be configurable)
    let pairing_port = 5555;

    // For QR pairing, the format expected by Android wireless debugging
    // Note: This is a simplified format - actual format may differ
    let qr_data = format!("{}:{}", local_ip, pairing_port);

    Ok(PairingData {
        ip: local_ip,
        port: pairing_port,
        qr_data,
    })
}

#[derive(Serialize, Clone, Debug)]
#[serde(tag = "type")]
pub enum FileType {
    File,
    Directory,
    Symlink { target: String },
}

#[derive(Serialize)]
pub(crate) struct FileInfo {
    name: String,
    dir: String,
    file_type: FileType,
    size: Option<u64>,
    permissions: String,
}

pub(crate) fn list_files(device: &mut Device, path: &str) -> Result<Vec<FileInfo>, String> {
    let mut buf: Vec<u8> = Vec::new();

    let result = device.shell_command(&["ls", "-la", path], &mut buf);

    match result {
        Ok(_) => {
            let output = String::from_utf8_lossy(&buf);
            let mut files = Vec::new();

            for line in output.lines() {
                let line = line.trim();

                // Skip empty lines and the "total" line
                if line.is_empty() || line.starts_with("total ") {
                    continue;
                }

                // Parse line: permissions links owner group size month day time/year name [-> target]
                let parts: Vec<&str> = line.split_whitespace().collect();

                if parts.len() < 8 {
                    continue; // Skip malformed lines
                }

                let permissions = parts[0];
                let size_str = parts[4];

                // Extract the name part (everything from index 7 onwards)
                let name_part = parts[7..].join(" ");

                // Determine file type and extract name/target
                let file_info = match permissions.chars().next() {
                    Some('d') => {
                        // Directory
                        Some((FileType::Directory, name_part.clone(), None))
                    }
                    Some('-') => {
                        // Regular file
                        Some((FileType::File, name_part.clone(), size_str.parse().ok()))
                    }
                    Some('l') => {
                        // Symlink - parse name -> target format
                        if let Some(arrow_pos) = name_part.find(" -> ") {
                            let link_name = name_part[..arrow_pos].to_string();
                            let target = name_part[arrow_pos + 4..].to_string();
                            Some((
                                FileType::Symlink { target },
                                link_name,
                                size_str.parse().ok(),
                            ))
                        } else {
                            // Malformed symlink - treat as symlink with empty target
                            Some((
                                FileType::Symlink {
                                    target: String::new(),
                                },
                                name_part.clone(),
                                size_str.parse().ok(),
                            ))
                        }
                    }
                    _ => {
                        // Skip unsupported file types (block devices, character devices, pipes, sockets, etc.)
                        None
                    }
                };

                if let Some((file_type, name, size)) = file_info {
                    // Skip current and parent directory entries
                    if name != "." && name != ".." {
                        files.push(FileInfo {
                            name,
                            dir: path.to_string(),
                            file_type,
                            size,
                            permissions: permissions.to_string(),
                        });
                    }
                }
            }

            Ok(files)
        }
        Err(e) => Err(format!("Failed to list files: {:?}", e)),
    }
}

pub(crate) fn pull_file(
    device: &mut Device,
    remote_path: &str,
    local_path: &str,
) -> Result<(), String> {
    // Note: This is a simplified implementation
    // In a real app, you'd want to use proper file transfer methods
    let mut buf: Vec<u8> = Vec::new();

    let result = device.shell_command(&["cat", remote_path], &mut buf);

    match result {
        Ok(_) => {
            std::fs::write(local_path, buf).map_err(|e| format!("Failed to write file: {}", e))?;
            Ok(())
        }
        Err(e) => Err(format!("Failed to pull file: {:?}", e)),
    }
}

pub(crate) fn get_installed_packages(device: &mut Device) -> Result<Vec<String>, String> {
    let mut buf: Vec<u8> = Vec::new();

    let result = device.shell_command(&["pm", "list", "packages"], &mut buf);

    match result {
        Ok(_) => {
            let output = String::from_utf8_lossy(&buf);
            let packages: Vec<String> = output
                .lines()
                .filter_map(|line| {
                    if line.starts_with("package:") {
                        Some(line.strip_prefix("package:").unwrap_or(line).to_string())
                    } else {
                        None
                    }
                })
                .collect();
            Ok(packages)
        }
        Err(e) => Err(format!("Failed to get packages: {:?}", e)),
    }
}

pub(crate) fn get_logcat_output(
    device: &mut Device,
    lines: u32,
    log_level: Option<String>,
) -> Result<String, String> {
    let mut buf: Vec<u8> = Vec::new();

    let lines_str = lines.to_string();
    let mut args = vec!["logcat", "-d", "-t", lines_str.as_str()];

    // Add log level filter if specified
    let filter_arg;
    if let Some(level) = log_level.as_ref() {
        filter_arg = format!("*:{}", level);
        args.push(filter_arg.as_str());
    }

    let shell_result = device.shell_command(&args, &mut buf);

    match shell_result {
        Ok(_) => {
            let output = String::from_utf8_lossy(&buf);
            Ok(output.to_string())
        }
        Err(e) => Err(format!("Failed to get logcat: {:?}", e)),
    }
}

fn getprop_from_device(device: &mut Device, property: &str) -> Option<String> {
    let mut buf: Vec<u8> = Vec::new();

    match device.shell_command(&["getprop", property], &mut buf) {
        Ok(..) => match from_utf8(buf.as_slice()) {
            Ok(data) => Some(data.trim().to_string()),
            Err(..) => None,
        },
        Err(..) => None,
    }
}

pub(crate) fn get_device_serial(device: &mut Device) -> Option<String> {
    getprop_from_device(device, "ro.serialno")
}

pub(crate) fn get_device_model(device: &mut Device) -> Option<String> {
    getprop_from_device(device, "ro.product.model")
}

pub(crate) fn get_device_android_version(device: &mut Device) -> Option<String> {
    getprop_from_device(device, "ro.build.version.release")
}

pub(crate) fn get_device_sdk_version(device: &mut Device) -> Option<String> {
    getprop_from_device(device, "ro.build.version.sdk")
}

pub(crate) fn execute_shell_command(device: &mut Device, command: &str) -> Result<String, String> {
    let mut buf: Vec<u8> = Vec::new();

    // Split command into parts for shell execution
    let command_parts: Vec<&str> = command.trim().split_whitespace().collect();
    if command_parts.is_empty() {
        return Err("Empty command".to_string());
    }

    let result = device.shell_command(&command_parts, &mut buf);

    match result {
        Ok(_) => {
            let output = String::from_utf8_lossy(&buf);
            Ok(output.to_string())
        }
        Err(e) => Err(format!("Command execution failed: {:?}", e)),
    }
}

pub(crate) fn get_device_info(device: &mut Device) -> Result<DeviceInfo, ()> {
    if let Some(serial_no) = get_device_serial(device) {
        if let Some(model) = get_device_model(device) {
            if let Some(android_version) = get_device_android_version(device) {
                if let Some(sdk_version) = get_device_sdk_version(device) {
                    let transport = match device {
                        Device::USB(_) => DeviceTransport::USB,
                        Device::TCP(_) => DeviceTransport::TCP,
                    };
                    return Ok(DeviceInfo {
                        transport,
                        serial_no,
                        model,
                        android_version,
                        sdk_version,
                    });
                }
            }
        }
    }
    Err(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_device_info() {
        if let Some(mut device) = get_connected_device() {
            if let Ok(device_info) = get_device_info(&mut device) {
                println!("Serial No: {:?}", device_info.serial_no);
                println!("Model: {:?}", device_info.model);
                println!("Android Version: {:?}", device_info.android_version);
                println!("SDK Version: {:?}", device_info.sdk_version);
            }
        }
    }
}
