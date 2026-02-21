use std::str::from_utf8;

use super::device::{Device, DeviceInfo, DeviceTransport};

pub(crate) fn get_logcat_output(
    device: &mut Device,
    lines: u32,
    log_level: Option<String>,
) -> Result<String, String> {
    let mut buf: Vec<u8> = Vec::new();

    let lines_str = lines.to_string();
    let mut args = vec!["logcat", "-d", "-t", lines_str.as_str()];

    let filter_arg;
    if let Some(level) = log_level.as_ref() {
        filter_arg = format!("*:{}", level);
        args.push(filter_arg.as_str());
    }

    let shell_result = device.shell_command(&args.join(" ").as_str(), &mut buf);

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

    match device.shell_command(&format!("getprop {}", property), &mut buf) {
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

    let command_parts: Vec<&str> = command.trim().split_whitespace().collect();
    if command_parts.is_empty() {
        return Err("Empty command".to_string());
    }

    let result = device.shell_command(&command, &mut buf);

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
