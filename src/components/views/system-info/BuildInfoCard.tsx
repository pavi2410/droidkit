import { Settings, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DeviceInfo } from "@/tauri-commands"
import { useDeviceBuildInfo } from "@/hooks/useSystemInfo"

interface BuildInfoCardProps {
  selectedDevice: DeviceInfo
}

export function BuildInfoCard({ selectedDevice }: BuildInfoCardProps) {
  const { data: buildInfo, isLoading: buildLoading, error: buildError } = useDeviceBuildInfo(selectedDevice)
  return (
    <Card className="xl:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          Build Information
          {buildLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {buildLoading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </>
        ) : buildError ? (
          <div className="text-sm text-destructive">
            {buildError instanceof Error ? buildError.message : 'Failed to fetch build info'}
          </div>
        ) : !buildInfo ? (
          <div className="text-sm text-muted-foreground">
            No build information available
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {buildInfo.build_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build ID:</span>
                  <span className="font-mono text-xs">{buildInfo.build_id}</span>
                </div>
              )}
              {buildInfo.build_type && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build Type:</span>
                  <span>{buildInfo.build_type}</span>
                </div>
              )}
              {buildInfo.security_patch && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security Patch:</span>
                  <span>{buildInfo.security_patch}</span>
                </div>
              )}
              {buildInfo.bootloader && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bootloader:</span>
                  <span className="font-mono text-xs">{buildInfo.bootloader}</span>
                </div>
              )}
              {buildInfo.build_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build Date:</span>
                  <span>{buildInfo.build_date}</span>
                </div>
              )}
              {buildInfo.build_tags && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build Tags:</span>
                  <span>{buildInfo.build_tags}</span>
                </div>
              )}
            </div>
            {buildInfo.fingerprint && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Fingerprint:</span>
                  <span className="font-mono text-xs text-right max-w-md break-all">
                    {buildInfo.fingerprint}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}