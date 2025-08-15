import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SettingsDialog } from "@/components/SettingsDialog"
import { Settings, Smartphone } from "lucide-react"

interface HeaderProps {
  connectedDevice?: {
    model: string
    serial_no: string
  }
}

export function Header({ connectedDevice }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">DroidKit</h1>
        </div>
        {connectedDevice && (
          <Badge variant="secondary" className="gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            {connectedDevice.model}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <SettingsDialog>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </SettingsDialog>
      </div>
    </header>
  )
}