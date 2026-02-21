use adb_client::{
    ADBDeviceExt, RustADBError, server::ADBServer, tcp::ADBTcpDevice, usb::ADBUSBDevice,
};
use serde::{Deserialize, Serialize};
use std::net::{IpAddr, SocketAddr, SocketAddrV4};

use super::logcat::get_device_info;

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
        cmd: &dyn AsRef<str>,
        output: &mut dyn std::io::Write,
    ) -> Result<Option<u8>, RustADBError> {
        match self {
            Device::USB(device) => device.shell_command(cmd, Some(output), None),
            Device::TCP(device) => device.shell_command(cmd, Some(output), None),
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

    Ok(discovered_devices)
}

pub(crate) fn connect_to_discovered_device(device: &DiscoveredDevice) -> Result<Device, String> {
    match &device.connection_method {
        ConnectionMethod::USB { serial_number } => match ADBUSBDevice::autodetect() {
            Ok(device) => Ok(Device::USB(device)),
            Err(e) => Err(format!(
                "Failed to connect to USB device {}: {:?}",
                serial_number, e
            )),
        },
        ConnectionMethod::TCP { socket_address } => {
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
    let ipv4 = match ip {
        IpAddr::V4(ipv4) => ipv4,
        IpAddr::V6(_) => return Err("IPv6 addresses are not supported for pairing".to_string()),
    };

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

    let mut adb_server = ADBServer::default();
    let socket_addr_v4 = SocketAddrV4::new(ipv4, port);

    println!("Created socket address: {:?}", socket_addr_v4);
    println!("Pairing code to be used: '{}'", trimmed_code);

    let result = adb_server.pair(socket_addr_v4, trimmed_code.to_string());

    match result {
        Ok(_) => {
            println!("Pairing successful with device at {}:{}", ip, port);
            Ok(())
        }
        Err(e) => {
            println!("Detailed pairing error: {:#?}", e);

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
