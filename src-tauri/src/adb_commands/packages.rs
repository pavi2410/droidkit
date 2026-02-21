use super::device::Device;

pub(crate) fn get_installed_packages(device: &mut Device) -> Result<Vec<String>, String> {
    let mut buf: Vec<u8> = Vec::new();

    let result = device.shell_command(&"pm list packages", &mut buf);

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
