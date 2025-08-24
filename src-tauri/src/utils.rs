use std::process::Command;

pub(crate) fn get_local_ip_address() -> Option<String> {
    // Try to get the local IP address that would be accessible to Android devices
    // This is a simplified implementation - in production, you'd want more robust detection

    #[cfg(target_os = "macos")]
    {
        let output = Command::new("ifconfig").output().ok()?;

        let output_str = String::from_utf8(output.stdout).ok()?;

        // Look for an IP address that's not localhost
        for line in output_str.lines() {
            if line.contains("inet ") && !line.contains("127.0.0.1") && !line.contains("::1") {
                if let Some(ip_start) = line.find("inet ") {
                    let ip_part = &line[ip_start + 5..];
                    if let Some(ip_end) = ip_part.find(' ') {
                        let ip = &ip_part[..ip_end];
                        if ip.starts_with("192.168.")
                            || ip.starts_with("10.")
                            || ip.starts_with("172.")
                        {
                            return Some(ip.to_string());
                        }
                    }
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        let output = Command::new("hostname").arg("-I").output().ok()?;

        let output_str = String::from_utf8(output.stdout).ok()?;
        let ip = output_str.trim().split_whitespace().next()?;

        if !ip.starts_with("127.") {
            return Some(ip.to_string());
        }
    }

    #[cfg(target_os = "windows")]
    {
        let output = Command::new("ipconfig").output().ok()?;

        let output_str = String::from_utf8(output.stdout).ok()?;

        for line in output_str.lines() {
            if line.contains("IPv4 Address") {
                if let Some(ip_start) = line.find(": ") {
                    let ip = &line[ip_start + 2..].trim();
                    if ip.starts_with("192.168.") || ip.starts_with("10.") || ip.starts_with("172.")
                    {
                        return Some(ip.to_string());
                    }
                }
            }
        }
    }

    None
}
