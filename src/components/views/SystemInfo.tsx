import { DeviceInfo } from "@/tauri-commands"
import { 
  useDeviceHardwareInfo,
  useDeviceDisplayInfo,
  useDeviceBatteryInfo,
  useDeviceBuildInfo,
  useDeviceNetworkInfo
} from "@/hooks/useSystemInfo"
import { 
  Monitor, 
  Cpu, 
  HardDrive, 
  Battery, 
  Wifi, 
  Smartphone, 
  RefreshCw,
  Loader2,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SystemInfoProps {
  selectedDevice: DeviceInfo
}

export function SystemInfo({ selectedDevice }: SystemInfoProps) {
  // Use TanStack Query hooks for data fetching
  const { data: hardwareInfo, isLoading: hardwareLoading, error: hardwareError, refetch: refetchHardware } = useDeviceHardwareInfo(selectedDevice)
  const { data: displayInfo, isLoading: displayLoading, error: displayError, refetch: refetchDisplay } = useDeviceDisplayInfo(selectedDevice)
  const { data: batteryInfo, isLoading: batteryLoading, error: batteryError, refetch: refetchBattery } = useDeviceBatteryInfo(selectedDevice)
  const { data: buildInfo, isLoading: buildLoading, error: buildError, refetch: refetchBuild } = useDeviceBuildInfo(selectedDevice)
  const { data: networkInfo, isLoading: networkLoading, error: networkError, refetch: refetchNetwork } = useDeviceNetworkInfo(selectedDevice)

  const isAnyLoading = hardwareLoading || displayLoading || batteryLoading || buildLoading || networkLoading

  const refetchAll = () => {
    refetchHardware()
    refetchDisplay()
    refetchBattery()
    refetchBuild()
    refetchNetwork()
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            System Information
          </h2>
          <p className="text-muted-foreground">
            Comprehensive system details for {selectedDevice.model}
          </p>
        </div>
        <Button onClick={refetchAll} variant="outline" size="sm" disabled={isAnyLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isAnyLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full">
        {/* Basic Device Info */}
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
            </div>
          </CardContent>
        </Card>

        {/* Hardware Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4" />
              Hardware
              {hardwareLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hardwareError ? (
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
                {!hardwareLoading && !hardwareInfo && (
                  <div className="text-sm text-muted-foreground">No hardware info available</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="h-4 w-4" />
              Display
              {displayLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayError ? (
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
                {!displayLoading && !displayInfo && (
                  <div className="text-sm text-muted-foreground">No display info available</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Information */}
        {(hardwareInfo?.internal_storage_total || hardwareInfo?.internal_storage_available) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-4 w-4" />
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {hardwareInfo.internal_storage_total && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Storage:</span>
                    <span>{hardwareInfo.internal_storage_total}</span>
                  </div>
                )}
                {hardwareInfo.internal_storage_available && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Storage:</span>
                    <span>{hardwareInfo.internal_storage_available}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Battery Information */}
        {batteryInfo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Battery className="h-4 w-4" />
                Battery
                {batteryLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {batteryError ? (
                <div className="text-sm text-destructive">
                  {batteryError instanceof Error ? batteryError.message : 'Failed to fetch battery info'}
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
        )}

        {/* Build Information */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              Build Information
              {buildLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {buildError ? (
              <div className="text-sm text-destructive">
                {buildError instanceof Error ? buildError.message : 'Failed to fetch build info'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {buildInfo?.build_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build ID:</span>
                  <span className="font-mono text-xs">{buildInfo.build_id}</span>
                </div>
              )}
              {buildInfo?.build_type && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build Type:</span>
                  <span>{buildInfo.build_type}</span>
                </div>
              )}
              {buildInfo?.security_patch && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security Patch:</span>
                  <span>{buildInfo.security_patch}</span>
                </div>
              )}
              {buildInfo?.bootloader && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bootloader:</span>
                  <span className="font-mono text-xs">{buildInfo.bootloader}</span>
                </div>
              )}
              {buildInfo?.build_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build Date:</span>
                  <span>{buildInfo.build_date}</span>
                </div>
              )}
              {buildInfo?.build_tags && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build Tags:</span>
                  <span>{buildInfo.build_tags}</span>
                </div>
              )}
            </div>
            {buildInfo?.fingerprint && (
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

        {/* Network Information */}
        {networkInfo && networkInfo.network_interfaces.length > 0 && (
          <Card className="xl:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wifi className="h-4 w-4" />
                Network
                {networkLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {networkError ? (
                <div className="text-sm text-destructive">
                  {networkError instanceof Error ? networkError.message : 'Failed to fetch network info'}
                </div>
              ) : (
                <div className="space-y-3">
                  {networkInfo.wifi_status && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">WiFi Status:</span>
                      <span>{networkInfo.wifi_status}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Network Interfaces</h4>
                    {networkInfo.network_interfaces.map((interface_, index) => (
                      <div key={index} className="bg-muted/30 rounded p-3 text-sm">
                        <div className="font-medium mb-1">{interface_.name}</div>
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
                        {interface_.status && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={interface_.status === 'UP' ? 'text-green-600' : 'text-red-600'}>
                              {interface_.status}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}