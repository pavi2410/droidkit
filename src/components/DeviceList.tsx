import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PairingDialog } from "@/components/PairingDialog"
import { connectWirelessDevice, type DeviceInfo } from "@/tauri-commands"
import { useUSBDevices, useWirelessDevices, useConnectToDevice, useRefreshDevices } from "@/hooks/useDeviceQueries"
import { usePairedDevices } from "@/hooks/usePairedDevices"
import { useAppSettings } from "@/hooks/useAppSettings"
import { useAvdList, useLaunchAvd } from "@/hooks/useEmulators"
import { 
  Smartphone, 
  Play, 
  RefreshCw, 
  Wifi, 
  Usb,
  Plus,
  Monitor,
  Loader2,
  Circle
} from "lucide-react"
import { useState } from "react"

interface DeviceListProps {
  connectedDevices: DeviceInfo[]
  selectedDevice?: DeviceInfo
  onDeviceSelect: (device: DeviceInfo) => void
  onWirelessDeviceConnected: (device: DeviceInfo) => void
}

interface UnifiedDevice {
  id: string
  type: 'connected' | 'usb' | 'wireless' | 'paired' | 'emulator'
  name: string
  subtitle: string
  icon: React.ReactNode
  isConnected: boolean
  data: any
}

interface UnifiedDeviceItemProps {
  device: UnifiedDevice
  selectedDevice?: DeviceInfo
  onDeviceSelect: (device: DeviceInfo) => void
  onDevicePaired: (deviceInfo: DeviceInfo) => void
}

function UnifiedDeviceItem({ device, selectedDevice, onDeviceSelect, onDevicePaired }: UnifiedDeviceItemProps) {
  const connectMutation = useConnectToDevice()
  const { launchAvd, isLaunchingAvd } = useLaunchAvd()
  const { updateLastConnected } = usePairedDevices()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleClick = () => {
    if (device.type === 'connected') {
      onDeviceSelect(device.data)
    }
  }

  const handleAction = async () => {
    switch (device.type) {
      case 'emulator':
        launchAvd(device.data)
        break
      case 'usb':
        try {
          const deviceInfo = await connectMutation.mutateAsync(device.data)
          onDeviceSelect(deviceInfo as DeviceInfo)
        } catch (error) {
          console.error('Failed to connect to USB device:', error)
        }
        break
      case 'paired':
        setIsConnecting(true)
        try {
          const deviceInfo = await connectWirelessDevice(device.data.ip, device.data.port)
          await updateLastConnected(device.data.id)
          onDeviceSelect(deviceInfo)
        } catch (error) {
          console.error('Failed to connect to paired device:', error)
        } finally {
          setIsConnecting(false)
        }
        break
      case 'wireless':
        // Wireless devices need pairing dialog - handled separately
        break
    }
  }

  const isSelected = device.type === 'connected' && selectedDevice?.serial_no === device.data.serial_no
  const isLoading = (device.type === 'emulator' && isLaunchingAvd) || 
                   (device.type === 'usb' && connectMutation.isPending) ||
                   (device.type === 'paired' && isConnecting)

  return (
    <Card className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3" onClick={handleClick}>
            {device.icon}
            <div className="flex flex-col">
              <span className="text-sm font-medium">{device.name}</span>
              <span className="text-xs text-muted-foreground">{device.subtitle}</span>
            </div>
          </div>
          
          {device.type !== 'connected' && (
            <>
              {device.type === 'wireless' ? (
                <PairingDialog device={device.data} onDevicePaired={onDevicePaired}>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Pair Device</span>
                  </Button>
                </PairingDialog>
              ) : (
                <Button variant="outline" size="sm" onClick={handleAction} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : device.type === 'emulator' ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {device.type === 'emulator' ? 'Start Emulator' : 'Connect Device'}
                  </span>
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function DeviceList({
  connectedDevices,
  selectedDevice,
  onDeviceSelect,
  onWirelessDeviceConnected
}: DeviceListProps) {
  const { getCategory } = useAppSettings()
  const { data: usbDevices = [], isLoading: isDiscoveringUSB, refetch: refetchUSB } = useUSBDevices()
  const { data: wirelessDevices = [], isLoading: isDiscoveringWireless, refetch: refetchWireless } = useWirelessDevices()
  const { devices: pairedDevices } = usePairedDevices()
  const { availableAvds, isLoadingAvds, loadAvds } = useAvdList()
  
  const deviceSettings = getCategory('devices')
  
  const handleDevicePaired = async (deviceInfo: DeviceInfo) => {
    onWirelessDeviceConnected(deviceInfo)
    refetchWireless()
  }

  // Create unified device list
  const unifiedDevices: UnifiedDevice[] = []
  
  // Add connected devices
  connectedDevices.forEach(device => {
    unifiedDevices.push({
      id: `connected-${device.serial_no}`,
      type: 'connected',
      name: device.model,
      subtitle: `Android ${device.android_version} • API ${device.sdk_version}`,
      icon: (
        <div className="relative">
          {device.transport === "TCP" ? (
            <Wifi className="h-4 w-4 text-blue-500" />
          ) : (
            <Usb className="h-4 w-4 text-green-500" />
          )}
          <Circle className="h-2 w-2 text-green-500 fill-green-500 absolute -top-0.5 -right-0.5" />
        </div>
      ),
      isConnected: true,
      data: device
    })
  })

  // Add emulators
  availableAvds.forEach(avd => {
    unifiedDevices.push({
      id: `emulator-${avd}`,
      type: 'emulator',
      name: avd,
      subtitle: 'Emulator',
      icon: <Monitor className="h-4 w-4 text-purple-500" />,
      isConnected: false,
      data: avd
    })
  })

  // Add USB devices (not connected)
  if (deviceSettings.autoDiscoverUSB) {
    usbDevices.filter(d => !d.is_connected).forEach(device => {
      const serialNumber = 'USB' in device.connection_method ? device.connection_method.USB.serial_number : 'Unknown'
      unifiedDevices.push({
        id: `usb-${serialNumber}`,
        type: 'usb',
        name: device.model || 'Unknown Device',
        subtitle: 'USB Device',
        icon: <Usb className="h-4 w-4 text-green-500" />,
        isConnected: false,
        data: device
      })
    })
  }

  // Add paired devices
  pairedDevices.forEach(device => {
    unifiedDevices.push({
      id: `paired-${device.id}`,
      type: 'paired',
      name: device.name,
      subtitle: `Paired • Last: ${new Date(device.lastConnected).toLocaleDateString()}`,
      icon: <Wifi className="h-4 w-4 text-blue-500" />,
      isConnected: false,
      data: device
    })
  })

  // Add wireless devices (unpaired)
  if (deviceSettings.showUnpairedDevices) {
    wirelessDevices.filter(d => !d.is_paired).forEach(device => {
      unifiedDevices.push({
        id: `wireless-${device.fullname}`,
        type: 'wireless',
        name: device.name,
        subtitle: 'Discovered',
        icon: <Wifi className="h-4 w-4 text-blue-500" />,
        isConnected: false,
        data: device
      })
    })
  }

  // Sort by connectivity (connected first), then by name
  const sortedDevices = unifiedDevices.sort((a, b) => {
    if (a.isConnected !== b.isConnected) {
      return a.isConnected ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  // Group devices by type for better organization
  const connectedGroup = sortedDevices.filter(d => d.type === 'connected')
  const emulatorGroup = sortedDevices.filter(d => d.type === 'emulator')
  const usbGroup = sortedDevices.filter(d => d.type === 'usb')
  const pairedGroup = sortedDevices.filter(d => d.type === 'paired')
  const wirelessGroup = sortedDevices.filter(d => d.type === 'wireless')

  const totalDevices = unifiedDevices.length
  const hasNoDevices = totalDevices === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Devices</h2>
          <Badge variant="outline">{totalDevices}</Badge>
          {(isDiscoveringUSB || isDiscoveringWireless || isLoadingAvds) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </div>
      </div>

      {hasNoDevices ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No devices discovered</h3>
              <p className="text-sm mb-6">Connect a device or start an emulator to get started</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => loadAvds()} disabled={isLoadingAvds}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAvds ? 'animate-spin' : ''}`} />
                  Scan Emulators
                </Button>
                {deviceSettings.autoDiscoverUSB && (
                  <Button variant="outline" onClick={() => refetchUSB()} disabled={isDiscoveringUSB}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isDiscoveringUSB ? 'animate-spin' : ''}`} />
                    Scan USB
                  </Button>
                )}
                {deviceSettings.showUnpairedDevices && (
                  <Button variant="outline" onClick={() => refetchWireless()} disabled={isDiscoveringWireless}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isDiscoveringWireless ? 'animate-spin' : ''}`} />
                    Scan Wireless
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {connectedGroup.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Circle className="h-3 w-3 text-green-500 fill-green-500" />
                Connected Devices ({connectedGroup.length})
              </h3>
              <div className="grid gap-3">
                {connectedGroup.map((device) => (
                  <UnifiedDeviceItem
                    key={device.id}
                    device={device}
                    selectedDevice={selectedDevice}
                    onDeviceSelect={onDeviceSelect}
                    onDevicePaired={handleDevicePaired}
                  />
                ))}
              </div>
            </div>
          )}

          {emulatorGroup.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Monitor className="h-3 w-3" />
                Emulators ({emulatorGroup.length})
              </h3>
              <div className="grid gap-3">
                {emulatorGroup.map((device) => (
                  <UnifiedDeviceItem
                    key={device.id}
                    device={device}
                    selectedDevice={selectedDevice}
                    onDeviceSelect={onDeviceSelect}
                    onDevicePaired={handleDevicePaired}
                  />
                ))}
              </div>
            </div>
          )}

          {usbGroup.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Usb className="h-3 w-3" />
                USB Devices ({usbGroup.length})
              </h3>
              <div className="grid gap-3">
                {usbGroup.map((device) => (
                  <UnifiedDeviceItem
                    key={device.id}
                    device={device}
                    selectedDevice={selectedDevice}
                    onDeviceSelect={onDeviceSelect}
                    onDevicePaired={handleDevicePaired}
                  />
                ))}
              </div>
            </div>
          )}

          {pairedGroup.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Wifi className="h-3 w-3" />
                Paired Devices ({pairedGroup.length})
              </h3>
              <div className="grid gap-3">
                {pairedGroup.map((device) => (
                  <UnifiedDeviceItem
                    key={device.id}
                    device={device}
                    selectedDevice={selectedDevice}
                    onDeviceSelect={onDeviceSelect}
                    onDevicePaired={handleDevicePaired}
                  />
                ))}
              </div>
            </div>
          )}

          {wirelessGroup.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Wifi className="h-3 w-3" />
                Discovered Devices ({wirelessGroup.length})
              </h3>
              <div className="grid gap-3">
                {wirelessGroup.map((device) => (
                  <UnifiedDeviceItem
                    key={device.id}
                    device={device}
                    selectedDevice={selectedDevice}
                    onDeviceSelect={onDeviceSelect}
                    onDevicePaired={handleDevicePaired}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}