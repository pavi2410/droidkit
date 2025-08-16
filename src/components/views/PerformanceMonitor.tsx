import { DeviceInfo } from "@/tauri-commands"
import { Activity } from "lucide-react"

interface PerformanceMonitorProps {
  selectedDevice: DeviceInfo
}

export function PerformanceMonitor({ selectedDevice }: PerformanceMonitorProps) {
  return (
    <div className="h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Performance Monitor</h2>
        <p className="text-muted-foreground">
          Monitor system performance of {selectedDevice.model}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Activity className="h-8 w-8 mb-2" />
        <p>Performance monitoring coming soon...</p>
      </div>
    </div>
  )
}