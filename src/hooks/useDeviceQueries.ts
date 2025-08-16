import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppSettings } from '@/hooks/useAppSettings'
import { PairedDevice } from '@/types/paired-device'
import { 
  listDiscoveredDevices, 
  discoverWirelessDevicesDetailed, 
  connectToDiscoveredDevice, 
  connectWirelessDevice, 
  pairWirelessDevice,
  deviceInfo,
  DeviceInfo
} from '@/tauri-commands'

export type ConnectionMethod = 
  | { USB: { serial_number: string } }
  | { TCP: { socket_address: string } }

export interface DiscoveredDevice {
  connection_method: ConnectionMethod
  model?: string
  android_version?: string
  sdk_version?: string
  is_connected: boolean
}

export interface DiscoveredWirelessDevice {
  name: string
  fullname: string
  addresses: string[]
  port: number
  is_paired: boolean
  is_connected: boolean
}

// Query keys
const deviceKeys = {
  all: ['devices'] as const,
  discovered: () => [...deviceKeys.all, 'discovered'] as const,
  wireless: () => [...deviceKeys.all, 'wireless'] as const,
  usb: () => [...deviceKeys.all, 'usb'] as const,
  connected: () => [...deviceKeys.all, 'connected'] as const,
}

// Queries
export function useDiscoveredDevices() {
  const { getCategory } = useAppSettings()
  const deviceSettings = getCategory('devices')

  return useQuery({
    queryKey: deviceKeys.discovered(),
    queryFn: listDiscoveredDevices,
    enabled: deviceSettings.autoDiscoverUSB,
    refetchInterval: deviceSettings.autoRefresh ? deviceSettings.pollingInterval * 1000 : false,
    staleTime: 2000, // Consider data stale after 2 seconds
  })
}

export function useUSBDevices() {
  const discoveredDevices = useDiscoveredDevices()
  
  return {
    ...discoveredDevices,
    data: discoveredDevices.data?.filter(d => 'USB' in d.connection_method) ?? [],
  }
}

export function useWirelessDevices() {
  const { getCategory } = useAppSettings()
  const deviceSettings = getCategory('devices')

  return useQuery({
    queryKey: deviceKeys.wireless(),
    queryFn: discoverWirelessDevicesDetailed,
    enabled: deviceSettings.autoDiscoverWireless,
    refetchInterval: deviceSettings.autoDiscoverWireless ? deviceSettings.wirelessDiscoveryInterval * 1000 : false,
    staleTime: 10000, // Wireless discovery is more expensive, cache longer
  })
}

// Mutations
export function useConnectToDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: connectToDiscoveredDevice,
    onSuccess: () => {
      // Invalidate and refetch device lists after successful connection
      queryClient.invalidateQueries({ queryKey: deviceKeys.all })
    },
  })
}

export function useConnectToWirelessDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ip, port }: { ip: string; port: number }) =>
      connectWirelessDevice(ip, port),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all })
    },
  })
}

export function usePairWirelessDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ip, port, pairing_code }: { ip: string; port: number; pairing_code: string }) =>
      pairWirelessDevice(ip, port, pairing_code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all })
    },
  })
}

// Connected devices query
export function useConnectedDevices() {
  const { getCategory } = useAppSettings()
  const deviceSettings = getCategory('devices')
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: deviceKeys.connected(),
    queryFn: async (): Promise<DeviceInfo[]> => {
      try {
        const currentDevice = await deviceInfo()
        
        // Get existing devices from cache
        const existingDevices = queryClient.getQueryData<DeviceInfo[]>(deviceKeys.connected()) || []
        
        // Check if this device is already in our list
        const existingDevice = existingDevices.find(d => d.serial_no === currentDevice.serial_no)
        if (existingDevice) {
          // Update existing device info
          return existingDevices.map(d => 
            d.serial_no === currentDevice.serial_no ? currentDevice : d
          )
        } else {
          // Add new device
          return [...existingDevices, currentDevice]
        }
      } catch (error) {
        console.log("No USB device connected:", error)
        // Get existing devices and filter out USB devices that are no longer connected
        const existingDevices = queryClient.getQueryData<DeviceInfo[]>(deviceKeys.connected()) || []
        return existingDevices.filter(d => d.transport === "TCP")
      }
    },
    refetchInterval: deviceSettings.autoRefresh ? deviceSettings.pollingInterval * 1000 : false,
    staleTime: 1000, // Consider data stale after 1 second
  })

  const addDevice = (device: DeviceInfo) => {
    queryClient.setQueryData<DeviceInfo[]>(deviceKeys.connected(), (prev = []) => {
      const existingDevice = prev.find(d => d.serial_no === device.serial_no)
      if (existingDevice) {
        // Update existing device
        return prev.map(d => d.serial_no === device.serial_no ? device : d)
      } else {
        // Add new device
        return [...prev, device]
      }
    })
  }

  const removeDevice = (serialNo: string) => {
    queryClient.setQueryData<DeviceInfo[]>(deviceKeys.connected(), (prev = []) => 
      prev.filter(d => d.serial_no !== serialNo)
    )
  }

  return {
    ...query,
    addDevice,
    removeDevice,
  }
}

// Auto-reconnect hook
export function useAutoReconnect() {
  const { getCategory } = useAppSettings()
  const connectToWirelessMutation = useConnectToWirelessDevice()
  const { addDevice } = useConnectedDevices()

  const tryAutoReconnect = async (pairedDevices: PairedDevice[], updateLastConnected: (id: string) => Promise<boolean>) => {
    const deviceSettings = getCategory('devices')
    
    if (!deviceSettings.autoReconnectPaired || pairedDevices.length === 0) {
      return null
    }
    
    // Try to reconnect to the most recently connected device
    const mostRecentDevice = pairedDevices
      .sort((a, b) => b.lastConnected - a.lastConnected)[0]
    
    if (mostRecentDevice) {
      try {
        console.log(`Attempting auto-reconnect to ${mostRecentDevice.name}...`)
        const deviceInfo = await connectToWirelessMutation.mutateAsync({
          ip: mostRecentDevice.ip,
          port: mostRecentDevice.port
        })
        
        // Add the reconnected device to the connected devices list
        addDevice(deviceInfo)
        await updateLastConnected(mostRecentDevice.id)
        
        console.log(`Auto-reconnected to ${mostRecentDevice.name}`)
        return deviceInfo
      } catch (error) {
        console.log(`Auto-reconnect failed: ${error}`)
        return null
      }
    }
    
    return null
  }

  return {
    tryAutoReconnect,
    isConnecting: connectToWirelessMutation.isPending,
  }
}

// Manual refetch hooks
export function useRefreshDevices() {
  const queryClient = useQueryClient()

  return {
    refreshAll: () => queryClient.invalidateQueries({ queryKey: deviceKeys.all }),
    refreshDiscovered: () => queryClient.invalidateQueries({ queryKey: deviceKeys.discovered() }),
    refreshWireless: () => queryClient.invalidateQueries({ queryKey: deviceKeys.wireless() }),
    refreshConnected: () => queryClient.invalidateQueries({ queryKey: deviceKeys.connected() }),
  }
}