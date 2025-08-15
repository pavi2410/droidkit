import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Smartphone, 
  Play, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Monitor
} from "lucide-react"

interface DeviceInfo {
  transport: "USB" | "TCP"
  serial_no: string
  model: string
  android_version: string
  sdk_version: string
}

interface SidebarProps {
  devices: DeviceInfo[]
  selectedDevice?: DeviceInfo
  onDeviceSelect: (device: DeviceInfo) => void
  onRefreshDevices: () => void
  isLoading?: boolean
}

export function Sidebar({ 
  devices, 
  selectedDevice, 
  onDeviceSelect, 
  onRefreshDevices,
  isLoading = false 
}: SidebarProps) {
  const [availableAvds, setAvailableAvds] = useState<string[]>([])
  const [isLoadingAvds, setIsLoadingAvds] = useState(false)

  const loadAvds = async () => {
    setIsLoadingAvds(true)
    try {
      const avds = await invoke<string[]>("get_available_avds")
      setAvailableAvds(avds)
    } catch (error) {
      console.log("Failed to load AVDs:", error)
      setAvailableAvds([])
    } finally {
      setIsLoadingAvds(false)
    }
  }

  const launchAvd = async (avdName: string) => {
    try {
      await invoke("start_avd", { avdName })
      console.log(`Launching AVD: ${avdName}`)
      // Refresh devices after a short delay to detect the new emulator
      setTimeout(() => {
        onRefreshDevices()
      }, 3000)
    } catch (error) {
      console.error("Failed to launch AVD:", error)
    }
  }

  useEffect(() => {
    loadAvds()
  }, [])
  return (
    <aside className="w-80 border-r bg-muted/20 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Devices</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefreshDevices}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex-1 space-y-3">
        {devices.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No devices found</p>
                <p className="text-xs mt-1">Connect a device or start an emulator</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          devices.map((device) => (
            <Card 
              key={device.serial_no}
              className={`cursor-pointer transition-colors hover:bg-muted/40 ${
                selectedDevice?.serial_no === device.serial_no 
                  ? 'ring-2 ring-primary' 
                  : ''
              }`}
              onClick={() => onDeviceSelect(device)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="truncate">{device.model}</span>
                  <div className="flex items-center gap-1">
                    {device.transport === "USB" ? (
                      <Wifi className="h-3 w-3 text-green-500" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-mono truncate">{device.serial_no}</p>
                  <div className="flex justify-between">
                    <span>Android {device.android_version}</span>
                    <span>API {device.sdk_version}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge 
                    variant={device.transport === "USB" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {device.transport}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Available AVDs</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadAvds}
            disabled={isLoadingAvds}
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingAvds ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {availableAvds.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No AVDs found
            </p>
          ) : (
            availableAvds.map((avd) => (
              <Button
                key={avd}
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => launchAvd(avd)}
              >
                <Play className="h-3 w-3 mr-2" />
                <span className="truncate">{avd}</span>
              </Button>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}