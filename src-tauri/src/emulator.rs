use std::env;
use std::path::PathBuf;
use std::process::Command;

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
