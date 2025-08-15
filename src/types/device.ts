export interface DeviceInfo {
  transport: "USB" | "TCP"
  serial_no: string
  model: string
  android_version: string
  sdk_version: string
}

export interface FileInfo {
  name: string
  path: string
  is_directory: boolean
  size?: number
  permissions: string
}