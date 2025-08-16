import { DeviceInfo } from "@/tauri-commands"
import { Camera } from "lucide-react"

interface ScreenControlProps {
  selectedDevice: DeviceInfo
}

export function ScreenControl({ selectedDevice }: ScreenControlProps) {
  return (
    <div className="h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Screen Control</h2>
        <p className="text-muted-foreground">
          Screenshot and screen control for {selectedDevice.model}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Camera className="h-8 w-8 mb-2" />
        <p>Screen control coming soon...</p>
      </div>
    </div>
  )
}