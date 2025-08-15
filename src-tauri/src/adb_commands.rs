use adb_client::{ADBDeviceExt, ADBUSBDevice};
use serde::Serialize;
use std::env;
use std::io::stdout;
use std::path::PathBuf;
use std::process::Command;
use std::str::from_utf8;

#[derive(Serialize)]
pub(crate) enum DeviceTransport {
    USB,
    TCP,
}

#[derive(Serialize)]
pub(crate) struct DeviceInfo {
    transport: DeviceTransport,
    serial_no: String,
    model: String,
    android_version: String,
    sdk_version: String,
}

const COMPANION_PKG_NAME: &str = "io.makeroid.companion";

pub(crate) fn get_connected_device() -> Option<ADBUSBDevice> {
    let autodetect = ADBUSBDevice::autodetect();
    match autodetect {
        Ok(device) => Some(device),
        Err(what) => {
            println!("Error: {:?}", what);
            None
        }
    }
}

pub(crate) fn get_android_home() -> Option<PathBuf> {
    // First check environment variable
    if let Ok(android_home) = env::var("ANDROID_HOME") {
        let path = PathBuf::from(android_home);
        if path.exists() {
            return Some(path);
        }
    }

    // Check common locations on macOS
    let home = env::var("HOME").ok()?;
    let common_paths = [
        format!("{}/Library/Android/sdk", home),
        format!("{}/Android/Sdk", home),
        "/usr/local/android-sdk".to_string(),
    ];

    for path_str in &common_paths {
        let path = PathBuf::from(path_str);
        if path.exists() {
            return Some(path);
        }
    }

    None
}

pub(crate) fn list_avds() -> Vec<String> {
    let android_home = match get_android_home() {
        Some(path) => path,
        None => return vec![],
    };

    let emulator_path = android_home.join("emulator").join("emulator");

    let output = Command::new(&emulator_path).args(&["-list-avds"]).output();

    match output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            stdout
                .lines()
                .filter(|line| !line.trim().is_empty())
                .map(|line| line.trim().to_string())
                .collect()
        }
        Err(_) => vec![],
    }
}

pub(crate) fn launch_avd(avd_name: &str) -> Result<(), String> {
    let android_home = match get_android_home() {
        Some(path) => path,
        None => return Err("Android SDK not found".to_string()),
    };

    let emulator_path = android_home.join("emulator").join("emulator");

    let result = Command::new(&emulator_path)
        .args(&["-avd", avd_name])
        .spawn();

    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to launch AVD: {}", e)),
    }
}

#[derive(Serialize)]
pub(crate) struct FileInfo {
    name: String,
    path: String,
    is_directory: bool,
    size: Option<u64>,
    permissions: String,
}

pub(crate) fn list_files(device: &mut ADBUSBDevice, path: &str) -> Result<Vec<FileInfo>, String> {
    let mut buf: Vec<u8> = Vec::new();

    let result = device.shell_command(&["ls", "-la", path], &mut buf);

    match result {
        Ok(_) => {
            let output = String::from_utf8_lossy(&buf);
            let mut files = Vec::new();

            for line in output.lines().skip(1) {
                // Skip the "total" line
                if line.trim().is_empty() {
                    continue;
                }

                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 9 {
                    let permissions = parts[0].to_string();
                    let is_directory = permissions.starts_with('d');
                    let size = if is_directory {
                        None
                    } else {
                        parts[4].parse().ok()
                    };
                    let name = parts[8..].join(" ");

                    if name != "." && name != ".." {
                        files.push(FileInfo {
                            name: name.clone(),
                            path: if path.ends_with('/') {
                                format!("{}{}", path, name)
                            } else {
                                format!("{}/{}", path, name)
                            },
                            is_directory,
                            size,
                            permissions,
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
    device: &mut ADBUSBDevice,
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

pub(crate) fn get_installed_packages(device: &mut ADBUSBDevice) -> Result<Vec<String>, String> {
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

pub(crate) fn get_logcat_output(device: &mut ADBUSBDevice, lines: u32) -> Result<String, String> {
    let mut buf: Vec<u8> = Vec::new();

    let result = device.shell_command(&["logcat", "-d", "-t", &lines.to_string()], &mut buf);

    match result {
        Ok(_) => {
            let output = String::from_utf8_lossy(&buf);
            Ok(output.to_string())
        }
        Err(e) => Err(format!("Failed to get logcat: {:?}", e)),
    }
}

fn getprop_from_device(device: &mut ADBUSBDevice, property: &str) -> Option<String> {
    let mut buf: Vec<u8> = Vec::new();

    match device.shell_command(&["getprop", property], &mut buf) {
        Ok(..) => match from_utf8(buf.as_slice()) {
            Ok(data) => Some(data.trim().to_string()),
            Err(..) => None,
        },
        Err(..) => None,
    }
}

pub(crate) fn get_device_serial(device: &mut ADBUSBDevice) -> Option<String> {
    getprop_from_device(device, "ro.serialno")
}

pub(crate) fn get_device_model(device: &mut ADBUSBDevice) -> Option<String> {
    getprop_from_device(device, "ro.product.model")
}

pub(crate) fn get_device_android_version(device: &mut ADBUSBDevice) -> Option<String> {
    getprop_from_device(device, "ro.build.version.release")
}

pub(crate) fn get_device_sdk_version(device: &mut ADBUSBDevice) -> Option<String> {
    getprop_from_device(device, "ro.build.version.sdk")
}

pub(crate) fn get_device_info(device: &mut ADBUSBDevice) -> Result<DeviceInfo, ()> {
    if let Some(serial_no) = get_device_serial(device) {
        if let Some(model) = get_device_model(device) {
            if let Some(android_version) = get_device_android_version(device) {
                if let Some(sdk_version) = get_device_sdk_version(device) {
                    return Ok(DeviceInfo {
                        transport: DeviceTransport::USB,
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

pub(crate) fn start_companion(device_serial: &str) -> Result<(), ()> {
    if let Some(mut device) = get_connected_device() {
        if let Some(serial_no) = get_device_serial(&mut device) {
            if serial_no != device_serial {
                return Err(());
            }

            let _ = device.shell_command(
                &[
                    "am",
                    "start",
                    "-a",
                    "android.intent.action.MAIN",
                    "-n",
                    &format!("{}/.Screen1", COMPANION_PKG_NAME),
                    "--ez",
                    "rundirect",
                    "true",
                ],
                &mut stdout(),
            );
        }
    }
    Ok(())
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

    #[test]
    fn test_start_companion() {
        if let Some(mut device) = get_connected_device() {
            if let Some(serial_no) = get_device_serial(&mut device) {
                start_companion(&serial_no).unwrap();
            }
        }
    }
}
