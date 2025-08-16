import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DeviceInfo } from "@/tauri-commands"
import { Activity } from "lucide-react"

interface PerformanceMonitorProps {
  selectedDevice: DeviceInfo
}

export function PerformanceMonitor({ selectedDevice }: PerformanceMonitorProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Performance Monitor</CardTitle>
        <CardDescription>
          Monitor system performance of {selectedDevice.model}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Activity className="h-8 w-8 mb-2" />
          <p>Performance monitoring coming soon...</p>
        </div>
      </CardContent>
    </Card>
  )
}