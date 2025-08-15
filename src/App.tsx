import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import { MainContent } from "@/components/MainContent"

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
    // Set up periodic refresh every 5 seconds
    const interval = setInterval(refreshDevices, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
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
  )
}

export default App
