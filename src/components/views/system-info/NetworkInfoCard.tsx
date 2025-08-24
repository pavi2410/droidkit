import { Wifi, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DeviceInfo } from "@/tauri-commands"
import { useDeviceNetworkInfo } from "@/hooks/useSystemInfo"

interface NetworkInfoCardProps {
  selectedDevice: DeviceInfo
}

export function NetworkInfoCard({ selectedDevice }: NetworkInfoCardProps) {
  const { data: networkInfo, isLoading: networkLoading, error: networkError } = useDeviceNetworkInfo(selectedDevice)

  return (
    <Card className="xl:col-span-3">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wifi className="h-4 w-4" />
          Network Information
          {networkLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {networkLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded p-3">
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 rounded p-3">
                <Skeleton className="h-4 w-28 mb-2" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : networkError ? (
          <div className="text-sm text-destructive">
            {networkError instanceof Error ? networkError.message : 'Failed to fetch network info'}
          </div>
        ) : !networkInfo ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No network information available
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connection Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded p-3">
                <h4 className="text-sm font-medium mb-2">Connection Details</h4>
                <div className="space-y-1 text-sm">
                  {networkInfo.connection_type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connection Type:</span>
                      <span className="font-semibold">{networkInfo.connection_type}</span>
                    </div>
                  )}
                  {networkInfo.wifi_status && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">WiFi Status:</span>
                      <span>{networkInfo.wifi_status}</span>
                    </div>
                  )}
                  {networkInfo.signal_strength !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Signal Strength:</span>
                      <span className={
                        networkInfo.signal_strength > 70 ? 'text-green-600' :
                        networkInfo.signal_strength > 40 ? 'text-yellow-600' : 'text-red-600'
                      }>
                        {networkInfo.signal_strength}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 rounded p-3">
                <h4 className="text-sm font-medium mb-2">Network Speed</h4>
                <div className="space-y-1 text-sm">
                  {networkInfo.download_speed && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Download:</span>
                      <span>{networkInfo.download_speed}</span>
                    </div>
                  )}
                  {networkInfo.upload_speed && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upload:</span>
                      <span>{networkInfo.upload_speed}</span>
                    </div>
                  )}
                  {!networkInfo.download_speed && !networkInfo.upload_speed && (
                    <div className="text-muted-foreground text-xs">
                      Speed information not available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Network Interfaces */}
            {networkInfo.network_interfaces && networkInfo.network_interfaces.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Network Interfaces</h4>
                {networkInfo.network_interfaces.map((interface_, index) => (
                  <div key={index} className="bg-muted/30 rounded p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{interface_.name}</div>
                      {interface_.status && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          interface_.status === 'UP' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {interface_.status}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {interface_.ip_address && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IP Address:</span>
                          <span className="font-mono">{interface_.ip_address}</span>
                        </div>
                      )}
                      {interface_.mac_address && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">MAC Address:</span>
                          <span className="font-mono text-xs">{interface_.mac_address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No network info available */}
            {(!networkInfo.network_interfaces || networkInfo.network_interfaces.length === 0) && 
             !networkInfo.connection_type && !networkInfo.wifi_status && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No network information available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}