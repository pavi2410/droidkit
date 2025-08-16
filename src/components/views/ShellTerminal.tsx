import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DeviceInfo } from "@/tauri-commands"
import { Terminal } from "lucide-react"

interface ShellTerminalProps {
  selectedDevice: DeviceInfo
}

export function ShellTerminal({ selectedDevice }: ShellTerminalProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>ADB Shell</CardTitle>
        <CardDescription>
          Interactive shell access to {selectedDevice.model}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Terminal className="h-8 w-8 mb-2" />
          <p>Shell terminal coming soon...</p>
        </div>
      </CardContent>
    </Card>
  )
}