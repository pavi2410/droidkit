import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SettingsDialog } from "@/components/SettingsDialog"
import { Settings, Wifi, Usb } from "lucide-react"
import { DeviceInfo } from "@/tauri-commands"

interface HeaderProps {
  selectedDevice?: DeviceInfo
}

export function Header({ selectedDevice }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center justify-between w-full px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <img 
              src="/droidkit-icon-128.png" 
              alt="DroidKit" 
              className="size-8"
            />
            <h1 className="text-lg font-semibold">DroidKit</h1>
          </div>
          {selectedDevice && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                {selectedDevice.transport === "TCP" ? (
                  <Wifi className="h-3 w-3 text-blue-500" />
                ) : (
                  <Usb className="h-3 w-3 text-green-500" />
                )}
                <span>{selectedDevice.model}</span>
                <span className="text-xs opacity-70">
                  ({selectedDevice.transport === "TCP" ? "Wireless" : "USB"})
                </span>
              </Badge>
            </>
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
      </div>
    </header>
  )
}