import { Cpu, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DeviceInfo } from "@/tauri-commands"
import { useDeviceHardwareInfo } from "@/hooks/useSystemInfo"

interface HardwareInfoCardProps {
  selectedDevice: DeviceInfo
}

export function HardwareInfoCard({ selectedDevice }: HardwareInfoCardProps) {
  const { data: hardwareInfo, isLoading: hardwareLoading, error: hardwareError } = useDeviceHardwareInfo(selectedDevice)
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="h-4 w-4" />
          Hardware
          {hardwareLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hardwareLoading ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : hardwareError ? (
          <div className="text-sm text-destructive">
            {hardwareError instanceof Error ? hardwareError.message : 'Failed to fetch hardware info'}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {hardwareInfo?.cpu_architecture && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPU Architecture:</span>
                <span className="font-mono">{hardwareInfo.cpu_architecture}</span>
              </div>
            )}
            {hardwareInfo?.total_memory && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Memory:</span>
                <span>{hardwareInfo.total_memory}</span>
              </div>
            )}
            {hardwareInfo?.available_memory && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Memory:</span>
                <span>{hardwareInfo.available_memory}</span>
              </div>
            )}
            {hardwareInfo?.board && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Board:</span>
                <span>{hardwareInfo.board}</span>
              </div>
            )}
            {hardwareInfo?.hardware && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hardware:</span>
                <span>{hardwareInfo.hardware}</span>
              </div>
            )}
            {!hardwareInfo && (
              <div className="text-sm text-muted-foreground">No hardware info available</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}