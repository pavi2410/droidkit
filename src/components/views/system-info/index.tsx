import { DeviceInfo } from "@/tauri-commands"
import { 
  Monitor
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DeviceInfoCard } from "./DeviceInfoCard"
import { HardwareInfoCard } from "./HardwareInfoCard"
import { DisplayInfoCard } from "./DisplayInfoCard"
import { StorageInfoCard } from "./StorageInfoCard"
import { BatteryInfoCard } from "./BatteryInfoCard"
import { BuildInfoCard } from "./BuildInfoCard"
import { NetworkInfoCard } from "./NetworkInfoCard"

interface SystemInfoProps {
  selectedDevice: DeviceInfo
}

export function SystemInfo({ selectedDevice }: SystemInfoProps) {

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Monitor className="h-6 w-6" />
          System Information
        </h2>
        <p className="text-muted-foreground">
          Comprehensive system details for {selectedDevice.model}
        </p>
      </div>

      <ScrollArea className="flex-[1_1_0]">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
          <DeviceInfoCard selectedDevice={selectedDevice} />
          <HardwareInfoCard selectedDevice={selectedDevice} />
          <DisplayInfoCard selectedDevice={selectedDevice} />
          <StorageInfoCard selectedDevice={selectedDevice} />
          <BatteryInfoCard selectedDevice={selectedDevice} />
          <NetworkInfoCard selectedDevice={selectedDevice} />
          <BuildInfoCard selectedDevice={selectedDevice} />
        </div>
      </ScrollArea>
    </div>
  )
}