import { HardDrive } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DeviceInfo } from "@/tauri-commands"
import { useDeviceHardwareInfo } from "@/hooks/useSystemInfo"

interface StorageInfoCardProps {
  selectedDevice: DeviceInfo
}

export function StorageInfoCard({ selectedDevice }: StorageInfoCardProps) {
  const { data: hardwareInfo, isLoading, error } = useDeviceHardwareInfo(selectedDevice)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HardDrive className="h-4 w-4" />
          Storage
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to fetch storage info'}
          </div>
        ) : !hardwareInfo?.internal_storage_total && !hardwareInfo?.internal_storage_available ? (
          <div className="text-sm text-muted-foreground">
            No storage information available
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {hardwareInfo?.internal_storage_total && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Storage:</span>
                <span>{hardwareInfo.internal_storage_total}</span>
              </div>
            )}
            {hardwareInfo?.internal_storage_available && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Storage:</span>
                <span>{hardwareInfo.internal_storage_available}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}