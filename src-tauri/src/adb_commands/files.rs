use serde::Serialize;

use super::device::Device;

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

    let result = device.shell_command(&format!("ls -la {}", path), &mut buf);

    match result {
        Ok(_) => {
            let output = String::from_utf8_lossy(&buf);
            let mut files = Vec::new();

            for line in output.lines() {
                let line = line.trim();

                if line.is_empty() || line.starts_with("total ") {
                    continue;
                }

                let parts: Vec<&str> = line.split_whitespace().collect();

                if parts.len() < 8 {
                    continue;
                }

                let permissions = parts[0];
                let size_str = parts[4];
                let name_part = parts[7..].join(" ");

                let file_info = match permissions.chars().next() {
                    Some('d') => Some((FileType::Directory, name_part.clone(), None)),
                    Some('-') => Some((FileType::File, name_part.clone(), size_str.parse().ok())),
                    Some('l') => {
                        if let Some(arrow_pos) = name_part.find(" -> ") {
                            let link_name = name_part[..arrow_pos].to_string();
                            let target = name_part[arrow_pos + 4..].to_string();
                            Some((
                                FileType::Symlink { target },
                                link_name,
                                size_str.parse().ok(),
                            ))
                        } else {
                            Some((
                                FileType::Symlink {
                                    target: String::new(),
                                },
                                name_part.clone(),
                                size_str.parse().ok(),
                            ))
                        }
                    }
                    _ => None,
                };

                if let Some((file_type, name, size)) = file_info {
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
    let mut buf: Vec<u8> = Vec::new();

    let result = device.shell_command(&format!("cat {}", remote_path), &mut buf);

    match result {
        Ok(_) => {
            std::fs::write(local_path, buf).map_err(|e| format!("Failed to write file: {}", e))?;
            Ok(())
        }
        Err(e) => Err(format!("Failed to pull file: {:?}", e)),
    }
}
