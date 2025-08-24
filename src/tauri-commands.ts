import { invoke, Channel } from '@tauri-apps/api/core';

// Type definitions based on Rust structs
export type DeviceTransport = 'USB' | 'TCP';

export interface DeviceInfo {
  transport: DeviceTransport;
  serial_no: string;
  model: string;
  android_version: string;
  sdk_version: string;
}

export type FileType = 
  | { type: 'File' }
  | { type: 'Directory' }
  | { type: 'Symlink'; target: string };

export interface FileInfo {
  name: string;
  dir: string;
  file_type: FileType;
  size?: number;
  permissions: string;
}

export interface PairingData {
  ip: string;
  port: number;
  qr_data: string;
}

export interface DiscoveredWirelessDevice {
  name: string;
  fullname: string;
  addresses: string[];
  port: number;
  connection_port?: number;
  is_paired: boolean;
  is_connected: boolean;
}

export type ConnectionMethod = 
  | { USB: { serial_number: string } }
  | { TCP: { socket_address: string } };

export interface DiscoveredDevice {
  connection_method: ConnectionMethod;
  model?: string;
  android_version?: string;
  sdk_version?: string;
  is_connected: boolean;
}

// Type-safe command functions
/**
 * Get information about the currently connected device
 */
export const deviceInfo = (): Promise<DeviceInfo> => 
  invoke('device_info');

/**
 * Get the Android SDK path
 */
export const getAndroidSdkPath = (): Promise<string | null> => 
  invoke('get_android_sdk_path');

/**
 * Get list of available Android Virtual Devices (AVDs)
 */
export const getAvailableAvds = (): Promise<string[]> => 
  invoke('get_available_avds');

/**
 * Start an Android Virtual Device
 */
export const startAvd = (avdName: string): Promise<void> => 
  invoke('start_avd', { avdName });

/**
 * Browse files on the connected device
 */
export const browseFiles = (path: string): Promise<FileInfo[]> => 
  invoke('browse_files', { path });

/**
 * Browse files on a specific device
 */
export const browseFilesForDevice = (deviceSerial: string, path: string): Promise<FileInfo[]> => 
  invoke('browse_files_for_device', { deviceSerial, path });

/**
 * Download a file from the device to local storage
 */
export const downloadFile = (remotePath: string, localPath: string): Promise<void> => 
  invoke('download_file', { remotePath, localPath });

/**
 * Get list of installed apps on the connected device
 */
export const getApps = (): Promise<string[]> => 
  invoke('get_apps');

/**
 * Get list of installed apps on a specific device
 */
export const getAppsForDevice = (deviceSerial: string): Promise<string[]> => 
  invoke('get_apps_for_device', { deviceSerial });

/**
 * Get logcat output from the connected device
 */
export const getLogcat = (lines: number): Promise<string> => 
  invoke('get_logcat', { lines });

/**
 * Get logcat output from a specific device
 */
export const getLogcatForDevice = (
  deviceSerial: string, 
  lines: number, 
  logLevel: string | undefined,
  onLogReceived: (result: { Ok?: string; Err?: string }) => void
): void => {
  const channel = new Channel<{ Ok?: string; Err?: string }>();
  channel.onmessage = onLogReceived;
  
  invoke('get_logcat_for_device', { 
    deviceSerial, 
    lines, 
    logLevel, 
    onEvent: channel 
  });
};

/**
 * Connect to a wireless device using IP and port
 */
export const connectWirelessDevice = (ip: string, port: number): Promise<DeviceInfo> => 
  invoke('connect_wireless_device', { ip, port });

/**
 * Pair with a wireless device using IP, port, and pairing code
 */
export const pairWirelessDevice = (ip: string, port: number, pairingCode: string): Promise<DeviceInfo> => 
  invoke('pair_wireless_device', { ip, port, pairingCode });

/**
 * Get QR code data for wireless pairing
 */
export const getPairingQrData = (): Promise<PairingData> => 
  invoke('get_pairing_qr_data');

/**
 * Discover wireless devices on the network
 */
export const discoverDevices = (): Promise<string[]> => 
  invoke('discover_devices');

/**
 * Get list of discovered devices with detailed information
 */
export const listDiscoveredDevices = (): Promise<DiscoveredDevice[]> => 
  invoke('list_discovered_devices_cmd');

/**
 * Discover wireless devices with detailed information
 */
export const discoverWirelessDevicesDetailed = (): Promise<DiscoveredWirelessDevice[]> => 
  invoke('discover_wireless_devices_detailed_cmd');

/**
 * Connect to a discovered device
 */
export const connectToDiscoveredDevice = (device: DiscoveredDevice): Promise<DeviceInfo> => 
  invoke('connect_to_discovered_device_cmd', { device });

/**
 * Execute a shell command on a specific device
 */
export const executeShellCommand = (deviceSerial: string, command: string): Promise<string> => 
  invoke('execute_shell_command_cmd', { deviceSerial, command });

// System Information Types
export interface SystemInfo {
  hardware: HardwareInfo;
  display: DisplayInfo;
  battery?: BatteryInfo;
  build: BuildInfo;
  network: NetworkInfo;
}

export interface HardwareInfo {
  cpu_architecture?: string;
  cpu_abi_list?: string;
  total_memory?: string;
  available_memory?: string;
  internal_storage_total?: string;
  internal_storage_available?: string;
  manufacturer?: string;
  brand?: string;
  board?: string;
  hardware?: string;
}

export interface DisplayInfo {
  resolution?: string;
  density?: string;
  physical_size?: string;
  refresh_rate?: string;
  orientation?: string;
}

export interface BatteryInfo {
  level?: number;
  status?: string;
  health?: string;
  temperature?: number;
  voltage?: number;
  technology?: string;
}

export interface BuildInfo {
  fingerprint?: string;
  build_date?: string;
  build_user?: string;
  build_host?: string;
  security_patch?: string;
  bootloader?: string;
  baseband?: string;
  build_id?: string;
  build_tags?: string;
  build_type?: string;
}

export interface NetworkInfo {
  wifi_status?: string;
  connection_type?: string;
  signal_strength?: number;
  upload_speed?: string;
  download_speed?: string;
  ip_addresses: string[];
  mac_addresses: string[];
  network_interfaces: NetworkInterface[];
}

export interface NetworkInterface {
  name: string;
  ip_address?: string;
  mac_address?: string;
  status?: string;
}

/**
 * Get hardware information for a specific device
 */
export const getDeviceHardwareInfo = (deviceSerial: string): Promise<HardwareInfo> => 
  invoke('get_device_hardware_info_cmd', { deviceSerial });

/**
 * Get display information for a specific device
 */
export const getDeviceDisplayInfo = (deviceSerial: string): Promise<DisplayInfo> => 
  invoke('get_device_display_info_cmd', { deviceSerial });

/**
 * Get battery information for a specific device
 */
export const getDeviceBatteryInfo = (deviceSerial: string): Promise<BatteryInfo | null> => 
  invoke('get_device_battery_info_cmd', { deviceSerial });

/**
 * Get build information for a specific device
 */
export const getDeviceBuildInfo = (deviceSerial: string): Promise<BuildInfo> => 
  invoke('get_device_build_info_cmd', { deviceSerial });

/**
 * Get network information for a specific device
 */
export const getDeviceNetworkInfo = (deviceSerial: string): Promise<NetworkInfo> => 
  invoke('get_device_network_info_cmd', { deviceSerial });
