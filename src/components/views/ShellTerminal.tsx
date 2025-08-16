import { DeviceInfo } from "@/tauri-commands"
import { Terminal } from "lucide-react"

interface ShellTerminalProps {
  selectedDevice: DeviceInfo
}

export function ShellTerminal({ selectedDevice }: ShellTerminalProps) {
  return (
    <div className="h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">ADB Shell</h2>
        <p className="text-muted-foreground">
          Interactive shell access to {selectedDevice.model}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Terminal className="h-8 w-8 mb-2" />
        <p>Shell terminal coming soon...</p>
      </div>
    </div>
  )
}