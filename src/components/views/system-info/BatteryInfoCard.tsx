import { Battery, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DeviceInfo } from "@/tauri-commands"
import { useDeviceBatteryInfo } from "@/hooks/useSystemInfo"

interface BatteryInfoCardProps {
  selectedDevice: DeviceInfo
}

export function BatteryInfoCard({ selectedDevice }: BatteryInfoCardProps) {
  const { data: batteryInfo, isLoading: batteryLoading, error: batteryError } = useDeviceBatteryInfo(selectedDevice)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Battery className="h-4 w-4" />
          Battery
          {batteryLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {batteryLoading ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ) : batteryError ? (
          <div className="text-sm text-destructive">
            {batteryError instanceof Error ? batteryError.message : 'Failed to fetch battery info'}
          </div>
        ) : !batteryInfo ? (
          <div className="text-sm text-muted-foreground">
            No battery information available
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {batteryInfo.level !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level:</span>
                <span className="font-semibold">{batteryInfo.level}%</span>
              </div>
            )}
            {batteryInfo.status && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span>{batteryInfo.status}</span>
              </div>
            )}
            {batteryInfo.health && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Health:</span>
                <span>{batteryInfo.health}</span>
              </div>
            )}
            {batteryInfo.temperature !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temperature:</span>
                <span>{batteryInfo.temperature}°C</span>
              </div>
            )}
            {batteryInfo.technology && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Technology:</span>
                <span>{batteryInfo.technology}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}