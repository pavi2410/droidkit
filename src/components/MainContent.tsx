import { FileExplorer } from "@/components/FileExplorer"
import { AppManager } from "@/components/AppManager"
import { LogcatViewer } from "@/components/LogcatViewer"
import { DeviceList } from "@/components/DeviceList"
import { DeviceOverview } from "@/components/views/DeviceOverview"
import { ScreenControl } from "@/components/views/ScreenControl"
import { PerformanceMonitor } from "@/components/views/PerformanceMonitor"
import { ShellTerminal } from "@/components/views/ShellTerminal"
import { DeviceInfo } from "@/tauri-commands"
import { Monitor } from "lucide-react"

interface MainContentProps {
  selectedDevice?: DeviceInfo
  activeView: string
  devices: DeviceInfo[]
  onDeviceSelect: (device: DeviceInfo) => void
  onWirelessDeviceConnected: (device: DeviceInfo) => void
}

export function MainContent({ 
  selectedDevice, 
  activeView, 
  devices, 
  onDeviceSelect, 
  onWirelessDeviceConnected 
}: MainContentProps) {
  
  // Devices view is always available
  if (activeView === 'devices') {
    return (
      <main className="flex-1 p-4 border-t border-l rounded-tl-xl">
        <DeviceList
          connectedDevices={devices}
          selectedDevice={selectedDevice}
          onDeviceSelect={onDeviceSelect}
          onWirelessDeviceConnected={onWirelessDeviceConnected}
        />
      </main>
    )
  }

  // Other views require a selected device
  if (!selectedDevice) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Device Selected</h3>
          <p className="text-sm">
            Select a device from the Devices view to use {activeView} tools
          </p>
        </div>
      </main>
    )
  }

  // Render the appropriate view based on activeView
  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <DeviceOverview selectedDevice={selectedDevice} />
      case 'files':
        return <FileExplorer selectedDevice={selectedDevice} />
      case 'logcat':
        return <LogcatViewer selectedDevice={selectedDevice} />
      case 'apps':
        return <AppManager selectedDevice={selectedDevice} />
      case 'screen':
        return <ScreenControl selectedDevice={selectedDevice} />
      case 'performance':
        return <PerformanceMonitor selectedDevice={selectedDevice} />
      case 'shell':
        return <ShellTerminal selectedDevice={selectedDevice} />
      default:
        return <DeviceOverview selectedDevice={selectedDevice} />
    }
  }

  return (
    <main className="flex-1 p-4 border-t border-l rounded-tl-xl">
      <div className="h-full">
        {renderView()}
      </div>
    </main>
  )
}