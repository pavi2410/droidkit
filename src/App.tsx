import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import { MainContent } from "@/components/MainContent"
import { ThemeProvider } from "@/components/ThemeProvider"
import { useAppSettings } from "@/hooks/useAppSettings"

interface DeviceInfo {
  transport: "USB" | "TCP"
  serial_no: string
  model: string
  android_version: string
  sdk_version: string
}

function App() {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo>()
  const [isLoading, setIsLoading] = useState(false)
  const { getCategory } = useAppSettings()

  const refreshDevices = async () => {
    setIsLoading(true)
    try {
      const deviceInfo = await invoke<DeviceInfo>("device_info")
      setDevices([deviceInfo])
      if (!selectedDevice) {
        setSelectedDevice(deviceInfo)
      }
    } catch (error) {
      console.log("No device connected:", error)
      setDevices([])
      setSelectedDevice(undefined)
    } finally {
      setIsLoading(false)
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
            isLoading={isLoading}
          />
          <MainContent selectedDevice={selectedDevice} />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
