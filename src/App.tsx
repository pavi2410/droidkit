import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/AppSidebar"
import { MainContent } from "@/components/MainContent"
import { StatusBar } from "@/components/StatusBar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { usePairedDevices } from "@/hooks/usePairedDevices"
import { useConnectedDevices, useAutoReconnect } from "@/hooks/useDeviceQueries"
import { DeviceInfo } from "@/tauri-commands"

function App() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo>()
  const [activeView, setActiveView] = useState('devices')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { devices: pairedDevices, updateLastConnected } = usePairedDevices()
  const { data: devices = [], isLoading, addDevice, refetch } = useConnectedDevices()
  const { tryAutoReconnect } = useAutoReconnect()

  const refreshDevices = async () => {
    await refetch()
  }

  const handleWirelessDeviceConnected = (device: DeviceInfo) => {
    addDevice(device)

    // Auto-select the newly connected device if no device is currently selected
    if (!selectedDevice) {
      setSelectedDevice(device)
    }
  }

  // Auto-select first device if none selected and devices are available
  useEffect(() => {
    if (!selectedDevice && devices.length > 0) {
      setSelectedDevice(devices[0])
    }
  }, [devices, selectedDevice])

  useEffect(() => {
    const initializeApp = async () => {
      const reconnectedDevice = await tryAutoReconnect(pairedDevices, updateLastConnected)
      if (reconnectedDevice && !selectedDevice) {
        setSelectedDevice(reconnectedDevice)
      }
    }

    // Only run auto-reconnect when paired devices are loaded
    if (pairedDevices.length > 0) {
      initializeApp()
    }
  }, [pairedDevices]) // Removed getCategory dependency since useConnectedDevices handles polling

  return (
    <div className="flex flex-col h-screen [--statusbar-height:calc(--spacing(8))]">
      <div className="flex-1 overflow-hidden">
        <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <AppSidebar
            onRefreshDevices={refreshDevices}
            onWirelessDeviceConnected={handleWirelessDeviceConnected}
            isLoading={isLoading}
            activeView={activeView}
            onViewChange={setActiveView}
          />
          <SidebarInset className="mr-0! mb-0! rounded-tr-none!">
            <MainContent
              selectedDevice={selectedDevice}
              activeView={activeView}
              devices={devices}
              onDeviceSelect={setSelectedDevice}
              onWirelessDeviceConnected={handleWirelessDeviceConnected}
            />
          </SidebarInset>
        </SidebarProvider>
      </div>
      <StatusBar
        selectedDevice={selectedDevice}
        isLoading={isLoading}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  )
}

export default App