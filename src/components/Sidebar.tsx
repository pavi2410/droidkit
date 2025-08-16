import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarSeparator
} from "@/components/ui/sidebar"
import { WirelessConnectionDialog } from "@/components/WirelessConnectionDialog"
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

interface SidebarProps {
  devices: DeviceInfo[]
  selectedDevice?: DeviceInfo
  onDeviceSelect: (device: DeviceInfo) => void
  onRefreshDevices: () => void
  onWirelessDeviceConnected: (device: DeviceInfo) => void
  isLoading?: boolean
}

interface ConnectedDeviceItemProps {
  device: DeviceInfo
  isSelected: boolean
  onSelect: (device: DeviceInfo) => void
}

function ConnectedDeviceItem({ device, isSelected, onSelect }: ConnectedDeviceItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isSelected}
        onClick={() => onSelect(device)}
        tooltip={`${device.model} (${device.serial_no})`}
      >
        <div className="relative">
          {device.transport === "TCP" ? (
            <Wifi className="h-4 w-4 text-blue-500" />
          ) : (
            <Usb className="h-4 w-4 text-green-500" />
          )}
          <Circle className="h-2 w-2 text-green-500 fill-green-500 absolute -top-0.5 -right-0.5" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium truncate">{device.model}</span>
          <span className="text-xs text-muted-foreground">
            Android {device.android_version} • API {device.sdk_version}
          </span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

interface ConnectedDevicesProps {
  devices: DeviceInfo[]
  selectedDevice?: DeviceInfo
  onDeviceSelect: (device: DeviceInfo) => void
}

function ConnectedDevices({ devices, selectedDevice, onDeviceSelect }: ConnectedDevicesProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <Monitor className="h-4 w-4" />
        Connected Devices
        <Badge variant="secondary" className="ml-auto">
          {devices.length}
        </Badge>
      </SidebarGroupLabel>
      <SidebarMenu>
        {devices.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <Smartphone className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No devices connected</p>
          </div>
        ) : (
          devices.map((device) => (
            <ConnectedDeviceItem
              key={device.serial_no}
              device={device}
              isSelected={selectedDevice?.serial_no === device.serial_no}
              onSelect={onDeviceSelect}
            />
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

interface EmulatorDeviceItemProps {
  avd: string
}

function EmulatorDeviceItem({ avd }: EmulatorDeviceItemProps) {
  const { launchAvd, isLaunchingAvd } = useLaunchAvd()
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={avd}>
        <Monitor className="h-4 w-4 text-purple-500" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium truncate">{avd}</span>
          <span className="text-xs text-muted-foreground">Emulator</span>
        </div>
      </SidebarMenuButton>
      <SidebarMenuAction onClick={() => launchAvd(avd)} showOnHover>
        {isLaunchingAvd ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span className="sr-only">Start Emulator</span>
      </SidebarMenuAction>
    </SidebarMenuItem>
  )
}

interface USBDeviceItemProps {
  device: any
  onDeviceSelect: (device: DeviceInfo) => void
}

function USBDeviceItem({ device, onDeviceSelect }: USBDeviceItemProps) {
  const connectMutation = useConnectToDevice()
  const serialNumber = 'USB' in device.connection_method ? device.connection_method.USB.serial_number : 'Unknown'
  
  const handleConnect = async () => {
    try {
      const deviceInfo = await connectMutation.mutateAsync(device)
      onDeviceSelect(deviceInfo as DeviceInfo)
    } catch (error) {
      console.error('Failed to connect to USB device:', error)
    }
  }
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={serialNumber}>
        <Usb className="h-4 w-4 text-green-500" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium truncate">{device.model || 'Unknown Device'}</span>
          <span className="text-xs text-muted-foreground">USB Device</span>
        </div>
      </SidebarMenuButton>
      <SidebarMenuAction 
        onClick={handleConnect}
        showOnHover
      >
        {connectMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        <span className="sr-only">Connect USB Device</span>
      </SidebarMenuAction>
    </SidebarMenuItem>
  )
}

interface PairedDeviceItemProps {
  device: any
  onDeviceSelect: (device: DeviceInfo) => void
}

function PairedDeviceItem({ device, onDeviceSelect }: PairedDeviceItemProps) {
  const { updateLastConnected } = usePairedDevices()
  const [isConnecting, setIsConnecting] = useState(false)
  
  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const deviceInfo = await connectWirelessDevice(device.ip, device.port)
      await updateLastConnected(device.id)
      onDeviceSelect(deviceInfo)
    } catch (error) {
      console.error('Failed to connect to paired device:', error)
    } finally {
      setIsConnecting(false)
    }
  }
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={`${device.ip}:${device.port}`}>
        <Wifi className="h-4 w-4 text-blue-500" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium truncate">{device.name}</span>
          <span className="text-xs text-muted-foreground">
            Paired • Last: {new Date(device.lastConnected).toLocaleDateString()}
          </span>
        </div>
      </SidebarMenuButton>
      <SidebarMenuAction 
        onClick={handleConnect}
        showOnHover
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        <span className="sr-only">Connect Paired Device</span>
      </SidebarMenuAction>
    </SidebarMenuItem>
  )
}

interface WirelessDeviceItemProps {
  device: any
  onPaired: (deviceInfo: DeviceInfo) => void
}

function WirelessDeviceItem({ device, onPaired }: WirelessDeviceItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={`${device.addresses[0]}:${device.port}`}>
        <Wifi className="h-4 w-4 text-blue-500" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium truncate">{device.name}</span>
          <span className="text-xs text-muted-foreground">Discovered</span>
        </div>
      </SidebarMenuButton>
      <PairingDialog 
        device={device} 
        onDevicePaired={onPaired}
      >
        <SidebarMenuAction showOnHover>
          <Plus className="h-4 w-4" />
          <span className="sr-only">Pair Device</span>
        </SidebarMenuAction>
      </PairingDialog>
    </SidebarMenuItem>
  )
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

interface UnifiedDevicesProps {
  connectedDevices: DeviceInfo[]
  selectedDevice?: DeviceInfo
  onDeviceSelect: (device: DeviceInfo) => void
  onWirelessDeviceConnected: (device: DeviceInfo) => void
}

function UnifiedDevices({
  connectedDevices,
  selectedDevice,
  onDeviceSelect,
  onWirelessDeviceConnected
}: UnifiedDevicesProps) {
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

  const totalDevices = unifiedDevices.length
  const hasNoDevices = totalDevices === 0

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <Smartphone className="h-4 w-4" />
        Devices
        <div className="ml-auto flex items-center gap-1">
          {(isDiscoveringUSB || isDiscoveringWireless || isLoadingAvds) && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          <Badge variant="outline">{totalDevices}</Badge>
        </div>
      </SidebarGroupLabel>
      <SidebarMenu>
        {sortedDevices.map((device) => (
          <UnifiedDeviceItem
            key={device.id}
            device={device}
            selectedDevice={selectedDevice}
            onDeviceSelect={onDeviceSelect}
            onDevicePaired={handleDevicePaired}
          />
        ))}

        {/* Empty State */}
        {hasNoDevices && (
          <div className="text-center text-muted-foreground py-6">
            <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-3">No devices discovered</p>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" size="sm" onClick={() => loadAvds()} disabled={isLoadingAvds}>
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingAvds ? 'animate-spin' : ''}`} />
                Scan Emulators
              </Button>
              {deviceSettings.autoDiscoverUSB && (
                <Button variant="ghost" size="sm" onClick={() => refetchUSB()} disabled={isDiscoveringUSB}>
                  <RefreshCw className={`h-3 w-3 mr-1 ${isDiscoveringUSB ? 'animate-spin' : ''}`} />
                  Scan USB
                </Button>
              )}
              {deviceSettings.showUnpairedDevices && (
                <Button variant="ghost" size="sm" onClick={() => refetchWireless()} disabled={isDiscoveringWireless}>
                  <RefreshCw className={`h-3 w-3 mr-1 ${isDiscoveringWireless ? 'animate-spin' : ''}`} />
                  Scan Wireless
                </Button>
              )}
            </div>
          </div>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
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
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isSelected}
        onClick={handleClick}
        tooltip={device.name}
      >
        {device.icon}
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium truncate">{device.name}</span>
          <span className="text-xs text-muted-foreground">{device.subtitle}</span>
        </div>
      </SidebarMenuButton>
      
      {device.type !== 'connected' && (
        <>
          {device.type === 'wireless' ? (
            <PairingDialog device={device.data} onDevicePaired={onDevicePaired}>
              <SidebarMenuAction showOnHover>
                <Plus className="h-4 w-4" />
                <span className="sr-only">Pair Device</span>
              </SidebarMenuAction>
            </PairingDialog>
          ) : (
            <SidebarMenuAction onClick={handleAction} showOnHover>
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
            </SidebarMenuAction>
          )}
        </>
      )}
    </SidebarMenuItem>
  )
}

export function Sidebar({ 
  devices, 
  selectedDevice, 
  onDeviceSelect, 
  onRefreshDevices,
  onWirelessDeviceConnected,
  isLoading = false 
}: SidebarProps) {
  const { refreshAll } = useRefreshDevices()

  const handleDevicePaired = async (deviceInfo: DeviceInfo) => {
    onWirelessDeviceConnected(deviceInfo)
  }

  return (
    <SidebarContainer variant="inset">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Device Manager</h2>
          <div className="flex gap-1">
            <WirelessConnectionDialog onDeviceConnected={onWirelessDeviceConnected}>
              <Button variant="ghost" size="sm" title="Pair Wireless Device">
                <Plus className="h-4 w-4" />
              </Button>
            </WirelessConnectionDialog>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                onRefreshDevices()
                refreshAll()
              }}
              disabled={isLoading}
              title="Refresh All"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <UnifiedDevices
          connectedDevices={devices}
          selectedDevice={selectedDevice}
          onDeviceSelect={onDeviceSelect}
          onWirelessDeviceConnected={handleDevicePaired}
        />
      </SidebarContent>
    </SidebarContainer>
  )
}