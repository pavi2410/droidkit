import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { DeviceInfo } from "@/tauri-commands"
import { useDeviceBatteryInfo } from "@/hooks/useSystemInfo"
import { 
  Wifi, 
  Usb, 
  Download, 
  Upload, 
  Activity,
  CheckCircle,
  AlertCircle,
  PanelLeft,
  Battery
} from "lucide-react"

interface StatusBarProps {
  selectedDevice?: DeviceInfo
  isLoading?: boolean
  onToggleSidebar?: () => void
}

interface Operation {
  id: string
  type: 'download' | 'upload' | 'install'
  description: string
  progress: number
  status: 'running' | 'completed' | 'error'
}

export function StatusBar({ selectedDevice, isLoading, onToggleSidebar }: StatusBarProps) {
  // Get battery info for the selected device
  const { data: batteryInfo } = useDeviceBatteryInfo(selectedDevice)
  
  // Simulate some operations for demo
  const activeOperations: Operation[] = [
    {
      id: '1',
      type: 'download',
      description: 'Downloading screenshot.png',
      progress: 75,
      status: 'running'
    }
  ]

  const getConnectionQuality = () => {
    if (!selectedDevice) return null
    
    if (selectedDevice.transport === 'USB') {
      return { level: 'excellent', strength: 100, icon: Usb, color: 'text-green-500' }
    } else {
      // Simulate TCP connection quality
      const strength = Math.floor(Math.random() * 40) + 60 // 60-100%
      const level = strength > 80 ? 'excellent' : strength > 60 ? 'good' : 'fair'
      const color = strength > 80 ? 'text-green-500' : strength > 60 ? 'text-yellow-500' : 'text-orange-500'
      return { level, strength, icon: Wifi, color }
    }
  }

  const connectionQuality = getConnectionQuality()

  return (
    <div className="border-t bg-background px-3 py-1.5 flex items-center justify-between text-xs h-(--statusbar-height)">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="h-6 w-6 p-0"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        {/* Connection Status */}
        {selectedDevice && connectionQuality && (
          <div className="flex items-center gap-1.5 min-w-0">
            <connectionQuality.icon className={`h-3.5 w-3.5 ${connectionQuality.color} flex-shrink-0`} />
            <span className="text-muted-foreground truncate">
              {selectedDevice.model}
            </span>
            {selectedDevice.transport === 'TCP' && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {connectionQuality.strength}%
              </Badge>
            )}
          </div>
        )}

        {/* Active Operations */}
        {activeOperations.map((operation) => (
          <div key={operation.id} className="flex items-center gap-1.5 min-w-0">
            {operation.type === 'download' && <Download className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
            {operation.type === 'upload' && <Upload className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />}
            {operation.type === 'install' && <Activity className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />}
            
            {operation.status === 'running' && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Progress value={operation.progress} className="w-16 h-1.5" />
                <span className="text-xs text-muted-foreground">{operation.progress}%</span>
              </div>
            )}
            
            {operation.status === 'completed' && (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            )}
            
            {operation.status === 'error' && (
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 animate-spin text-blue-500" />
            <span className="text-muted-foreground">Loading</span>
          </div>
        )}
      </div>

      {/* Right side - Quick stats */}
      <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
        {selectedDevice && (
          <>
            {/* Battery Level */}
            {batteryInfo && batteryInfo.level !== undefined && (
              <div className="flex items-center gap-1">
                <Battery 
                  className={`h-3.5 w-3.5 ${
                    batteryInfo.level <= 20 ? 'text-red-500' : 
                    batteryInfo.level <= 50 ? 'text-yellow-500' : 
                    'text-green-500'
                  }`} 
                />
                <span className="text-xs">{batteryInfo.level}%</span>
              </div>
            )}
            <span className="hidden sm:inline">Android {selectedDevice.android_version}</span>
            <span className="sm:hidden">API {selectedDevice.sdk_version}</span>
            <span className="hidden md:inline">API {selectedDevice.sdk_version}</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {selectedDevice.transport}
            </Badge>
          </>
        )}
      </div>
    </div>
  )
}