import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import { MainContent } from "@/components/MainContent"
import { ThemeProvider } from "@/components/ThemeProvider"
import { useAppSettings } from "@/hooks/useAppSettings"
import { DeviceInfo } from "@/types/device"

function App() {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo>()
  const [isLoading, setIsLoading] = useState(false)
  const { getCategory } = useAppSettings()

  const refreshDevices = async () => {
    setIsLoading(true)
    try {
      const deviceInfo = await invoke<DeviceInfo>("device_info")
      
      // Check if this device is already in our list
      setDevices(prevDevices => {
        const existingDevice = prevDevices.find(d => d.serial_no === deviceInfo.serial_no)
        if (existingDevice) {
          // Update existing device info
          return prevDevices.map(d => 
            d.serial_no === deviceInfo.serial_no ? deviceInfo : d
          )
        } else {
          // Add new device
          return [...prevDevices, deviceInfo]
        }
      })
      
      if (!selectedDevice) {
        setSelectedDevice(deviceInfo)
      }
    } catch (error) {
      console.log("No USB device connected:", error)
      // Remove USB devices that are no longer connected
      setDevices(prevDevices => prevDevices.filter(d => d.transport === "TCP"))
      
      // If selected device was USB and no longer connected, clear selection
      if (selectedDevice?.transport === "USB") {
        const remainingDevices = devices.filter(d => d.transport === "TCP")
        setSelectedDevice(remainingDevices.length > 0 ? remainingDevices[0] : undefined)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleWirelessDeviceConnected = (device: DeviceInfo) => {
    setDevices(prevDevices => {
      const existingDevice = prevDevices.find(d => d.serial_no === device.serial_no)
      if (existingDevice) {
        // Update existing device
        return prevDevices.map(d => 
          d.serial_no === device.serial_no ? device : d
        )
      } else {
        // Add new wireless device
        return [...prevDevices, device]
      }
    })
    
    // Auto-select the newly connected device if no device is currently selected
    if (!selectedDevice) {
      setSelectedDevice(device)
    }
  }


  useEffect(() => {
    refreshDevices()
    // Get polling interval from settings
    const deviceSettings = getCategory('devices')
    const pollingInterval = deviceSettings.pollingInterval * 1000 // Convert to milliseconds
    
    let interval: NodeJS.Timeout | null = null
    if (deviceSettings.autoRefresh) {
      interval = setInterval(refreshDevices, pollingInterval)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [getCategory])

  return (
    <ThemeProvider>
      <div className="flex h-screen flex-col bg-background">
        <Header connectedDevice={selectedDevice} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            devices={devices}
            selectedDevice={selectedDevice}
            onDeviceSelect={setSelectedDevice}
            onRefreshDevices={refreshDevices}
            onWirelessDeviceConnected={handleWirelessDeviceConnected}
            isLoading={isLoading}
          />
          <MainContent selectedDevice={selectedDevice} />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
