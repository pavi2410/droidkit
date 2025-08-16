import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DeviceInfo } from "@/tauri-commands"
import { Camera } from "lucide-react"

interface ScreenControlProps {
  selectedDevice: DeviceInfo
}

export function ScreenControl({ selectedDevice }: ScreenControlProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Screen Control</CardTitle>
        <CardDescription>
          Screenshot and screen control for {selectedDevice.model}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Camera className="h-8 w-8 mb-2" />
          <p>Screen control coming soon...</p>
        </div>
      </CardContent>
    </Card>
  )
}