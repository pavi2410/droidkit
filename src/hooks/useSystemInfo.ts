import { useQuery } from '@tanstack/react-query'
import type { DeviceInfo } from '@/tauri-commands'
import {
  getDeviceHardwareInfo,
  getDeviceDisplayInfo,
  getDeviceBatteryInfo,
  getDeviceBuildInfo,
  getDeviceNetworkInfo
} from '@/tauri-commands'

// Query Keys for system info
export const systemInfoKeys = {
  all: ['systemInfo'] as const,
  device: (deviceId: string) => [...systemInfoKeys.all, 'device', deviceId] as const,
  hardware: (deviceId: string) => [...systemInfoKeys.device(deviceId), 'hardware'] as const,
  display: (deviceId: string) => [...systemInfoKeys.device(deviceId), 'display'] as const,
  battery: (deviceId: string) => [...systemInfoKeys.device(deviceId), 'battery'] as const,
  build: (deviceId: string) => [...systemInfoKeys.device(deviceId), 'build'] as const,
  network: (deviceId: string) => [...systemInfoKeys.device(deviceId), 'network'] as const,
}

// Hardware Info Hook
export function useDeviceHardwareInfo(device: DeviceInfo | undefined) {
  return useQuery({
    queryKey: systemInfoKeys.hardware(device?.serial_no || ''),
    queryFn: () => getDeviceHardwareInfo(device!.serial_no),
    enabled: !!device,
    staleTime: 5 * 60 * 1000, // Hardware info changes rarely
    retry: 2,
  })
}

// Display Info Hook
export function useDeviceDisplayInfo(device: DeviceInfo | undefined) {
  return useQuery({
    queryKey: systemInfoKeys.display(device?.serial_no || ''),
    queryFn: () => getDeviceDisplayInfo(device!.serial_no),
    enabled: !!device,
    staleTime: 5 * 60 * 1000, // Display info changes rarely
    retry: 2,
  })
}

// Battery Info Hook
export function useDeviceBatteryInfo(device: DeviceInfo | undefined) {
  return useQuery({
    queryKey: systemInfoKeys.battery(device?.serial_no || ''),
    queryFn: () => getDeviceBatteryInfo(device!.serial_no),
    enabled: !!device,
    staleTime: 30 * 1000, // Battery info changes more frequently
    refetchInterval: 60 * 1000, // Refresh every minute
    retry: 1, // Battery info might not be available on all devices
  })
}

// Build Info Hook
export function useDeviceBuildInfo(device: DeviceInfo | undefined) {
  return useQuery({
    queryKey: systemInfoKeys.build(device?.serial_no || ''),
    queryFn: () => getDeviceBuildInfo(device!.serial_no),
    enabled: !!device,
    staleTime: 10 * 60 * 1000, // Build info never changes
    retry: 2,
  })
}

// Network Info Hook
export function useDeviceNetworkInfo(device: DeviceInfo | undefined) {
  return useQuery({
    queryKey: systemInfoKeys.network(device?.serial_no || ''),
    queryFn: () => getDeviceNetworkInfo(device!.serial_no),
    enabled: !!device,
    staleTime: 2 * 60 * 1000, // Network info can change
    retry: 1, // Network commands might be slow or fail
  })
}