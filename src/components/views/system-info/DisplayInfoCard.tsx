import { Monitor, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DeviceInfo } from "@/tauri-commands"
import { useDeviceDisplayInfo } from "@/hooks/useSystemInfo"

interface DisplayInfoCardProps {
  selectedDevice: DeviceInfo
}

export function DisplayInfoCard({ selectedDevice }: DisplayInfoCardProps) {
  const { data: displayInfo, isLoading: displayLoading, error: displayError } = useDeviceDisplayInfo(selectedDevice)
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Monitor className="h-4 w-4" />
          Display
          {displayLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayLoading ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ) : displayError ? (
          <div className="text-sm text-destructive">
            {displayError instanceof Error ? displayError.message : 'Failed to fetch display info'}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {displayInfo?.resolution && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resolution:</span>
                <span className="font-mono">{displayInfo.resolution}</span>
              </div>
            )}
            {displayInfo?.density && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Density:</span>
                <span>{displayInfo.density}</span>
              </div>
            )}
            {displayInfo?.physical_size && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Physical Size:</span>
                <span>{displayInfo.physical_size}</span>
              </div>
            )}
            {displayInfo?.refresh_rate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refresh Rate:</span>
                <span>{displayInfo.refresh_rate}</span>
              </div>
            )}
            {displayInfo?.orientation && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orientation:</span>
                <span>{displayInfo.orientation}</span>
              </div>
            )}
            {!displayInfo && (
              <div className="text-sm text-muted-foreground">No display info available</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}