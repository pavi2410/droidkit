use crate::utils::get_local_ip_address;
use serde::Serialize;

#[derive(Serialize)]
pub(crate) struct PairingData {
    pub ip: String,
    pub port: u16,
    pub qr_data: String,
}

pub(crate) fn generate_pairing_data() -> Result<PairingData, String> {
    let local_ip = get_local_ip_address().unwrap_or_else(|| "192.168.1.100".to_string());

    let pairing_port = 5555;

    let qr_data = format!("{}:{}", local_ip, pairing_port);

    Ok(PairingData {
        ip: local_ip,
        port: pairing_port,
        qr_data,
    })
}
