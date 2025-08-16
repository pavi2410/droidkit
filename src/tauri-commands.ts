import { invoke } from '@tauri-apps/api/core';

// Type definitions based on Rust structs
export type DeviceTransport = 'USB' | 'TCP';

export interface DeviceInfo {
  transport: DeviceTransport;
  serial_no: string;
  model: string;
  android_version: string;
  sdk_version: string;
}

export interface FileInfo {
  name: string;
  path: string;
  is_directory: boolean;
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
export const getLogcatForDevice = (deviceSerial: string, lines: number): Promise<string> => 
  invoke('get_logcat_for_device', { deviceSerial, lines });

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
