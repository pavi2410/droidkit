use adb_client::mdns::MDNSDiscoveryService;
use serde::Serialize;
use std::net::IpAddr;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use super::device::connect_tcp_device;

#[derive(Serialize)]
pub(crate) struct DiscoveredWirelessDevice {
    pub name: String,
    pub fullname: String,
    pub addresses: Vec<String>,
    pub port: u16,
    pub connection_port: Option<u16>,
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

    let mut devices = Vec::new();
    let timeout = Duration::from_secs(5);
    let start_time = std::time::Instant::now();

    println!("Starting mDNS discovery for wireless devices...");

    while start_time.elapsed() < timeout {
        if let Ok(device) = rx.try_recv() {
            println!("Discovered mDNS service: {}", device.fullname);

            let name = device
                .fullname
                .split('.')
                .next()
                .unwrap_or(&device.fullname)
                .to_string();

            let (port, service_type) = if device.fullname.contains("_adb-tls-pairing._tcp") {
                (37851, "pairing")
            } else if device.fullname.contains("_adb-tls-connect._tcp") {
                (37851, "connection")
            } else {
                (37851, "unknown")
            };

            println!("Service type: {}, using port: {}", service_type, port);

            let ipv4_addresses: Vec<String> = device
                .addresses()
                .iter()
                .filter_map(|addr| match addr {
                    std::net::IpAddr::V4(_) => Some(addr.to_string()),
                    std::net::IpAddr::V6(_) => None,
                })
                .collect();

            println!("IPv4 addresses found: {:?}", ipv4_addresses);

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
                    is_paired: false,
                    is_connected: false,
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

    println!("Using default connection port 5555 for device at {}", ip);
    5555
}
