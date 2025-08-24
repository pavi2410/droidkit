import { Smartphone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DeviceInfo } from "@/tauri-commands"
import { useDeviceHardwareInfo } from "@/hooks/useSystemInfo"

interface DeviceInfoCardProps {
  selectedDevice: DeviceInfo
}

export function DeviceInfoCard({ selectedDevice }: DeviceInfoCardProps) {
  const { data: hardwareInfo, isLoading } = useDeviceHardwareInfo(selectedDevice)
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="h-4 w-4" />
          Device Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Model:</span>
            <span className="font-mono">{selectedDevice.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Serial:</span>
            <span className="font-mono text-xs">{selectedDevice.serial_no}</span>
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
          {isLoading ? (
            <>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </>
          ) : (
            <>
              {hardwareInfo?.manufacturer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Manufacturer:</span>
                  <span>{hardwareInfo.manufacturer}</span>
                </div>
              )}
              {hardwareInfo?.brand && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span>{hardwareInfo.brand}</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}