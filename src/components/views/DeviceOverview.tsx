import { DeviceInfo } from "@/tauri-commands"

interface DeviceOverviewProps {
  selectedDevice: DeviceInfo
}

export function DeviceOverview({ selectedDevice }: DeviceOverviewProps) {
  return (
    <div className="h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Device Information</h2>
        <p className="text-muted-foreground">
          Overview of {selectedDevice.model}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium">Device Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span>{selectedDevice.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serial:</span>
              <span className="font-mono">{selectedDevice.serial_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Android:</span>
              <span>{selectedDevice.android_version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Level:</span>
              <span>{selectedDevice.sdk_version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connection:</span>
              <span>{selectedDevice.transport}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium">System Status</h4>
          <div className="text-sm text-muted-foreground">
            Additional device information will be displayed here
          </div>
        </div>
      </div>
    </div>
  )
}