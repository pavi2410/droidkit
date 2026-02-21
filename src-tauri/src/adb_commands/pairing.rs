use crate::utils::get_local_ip_address;
use mdns_sd::{ServiceDaemon, ServiceEvent};
use serde::Serialize;
use std::net::Ipv4Addr;
use std::process::Command;

#[derive(Serialize)]
pub(crate) struct PairingData {
    pub ip: String,
    pub port: u16,
    pub qr_data: String,
    pub pairing_code: String,
}

#[derive(Serialize)]
pub(crate) struct PairingResult {
    pub success: bool,
    pub message: String,
    pub device_ip: Option<String>,
    pub device_port: Option<u16>,
}

pub(crate) fn generate_pairing_data() -> Result<PairingData, String> {
    let local_ip = get_local_ip_address().unwrap_or_else(|| "192.168.1.100".to_string());

    let pairing_port = 5555;

    let pairing_code: String = (0..6)
        .map(|_| {
            let idx = rand::random::<u8>() % 10;
            char::from_digit(idx as u32, 10).unwrap()
        })
        .collect();

    let device_name = "droidkit";

    let qr_data = format!("WIFI:T:ADB;S:{};P:{};;", device_name, pairing_code);

    println!("Generated QR data: {}", qr_data);
    println!("Pairing code: {}", pairing_code);

    Ok(PairingData {
        ip: local_ip,
        port: pairing_port,
        qr_data,
        pairing_code,
    })
}

pub(crate) fn start_pairing_listener(
    pairing_code: String,
    timeout_secs: u64,
) -> Result<PairingResult, String> {
    println!("Starting mDNS pairing listener with code: {}", pairing_code);

    let mdns =
        ServiceDaemon::new().map_err(|e| format!("Failed to create mDNS daemon: {:?}", e))?;

    let service_name = "_adb-tls-pairing._tcp.local.";
    let receiver = mdns
        .browse(service_name)
        .map_err(|e| format!("Failed to browse mDNS service: {:?}", e))?;

    println!("Listening for pairing devices...");

    let timeout = std::time::Duration::from_secs(timeout_secs);
    let start_time = std::time::Instant::now();

    while start_time.elapsed() < timeout {
        match receiver.recv_timeout(std::time::Duration::from_millis(500)) {
            Ok(ServiceEvent::ServiceResolved(service)) => {
                println!("Discovered mDNS service: {}", service.get_fullname());

                let ipv4_addresses: Vec<Ipv4Addr> = service
                    .get_addresses_v4()
                    .iter()
                    .map(|addr| **addr)
                    .collect();

                if let Some(ip) = ipv4_addresses.first() {
                    let port = service.get_port();
                    let ip_str = ip.to_string();

                    println!("Attempting to pair with {}:{}", ip_str, port);

                    let output = Command::new("adb")
                        .args(["pair", &format!("{}:{}", ip_str, port), &pairing_code])
                        .output();

                    match output {
                        Ok(result) => {
                            let stdout = String::from_utf8_lossy(&result.stdout);
                            let stderr = String::from_utf8_lossy(&result.stderr);

                            println!("adb pair stdout: {}", stdout);
                            println!("adb pair stderr: {}", stderr);

                            let _ = mdns.shutdown();

                            if result.status.success() && stdout.contains("Successfully paired") {
                                return Ok(PairingResult {
                                    success: true,
                                    message: "Device paired successfully".to_string(),
                                    device_ip: Some(ip_str),
                                    device_port: Some(port),
                                });
                            } else {
                                return Ok(PairingResult {
                                    success: false,
                                    message: format!("Pairing failed: {}", stderr),
                                    device_ip: None,
                                    device_port: None,
                                });
                            }
                        }
                        Err(e) => {
                            println!("Failed to run adb pair: {}", e);
                        }
                    }
                }
            }
            Ok(ServiceEvent::ServiceRemoved(_, _)) => {
                println!("Service removed");
            }
            Ok(_) => {}
            Err(_) => {
                continue;
            }
        }
    }

    let _ = mdns.shutdown();

    Ok(PairingResult {
        success: false,
        message: "Pairing timeout - no device found".to_string(),
        device_ip: None,
        device_port: None,
    })
}
