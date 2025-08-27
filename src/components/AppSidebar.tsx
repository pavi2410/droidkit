import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar"
import { WirelessConnectionDialog } from "@/components/WirelessConnectionDialog"
import { useRefreshDevices } from "@/hooks/useDeviceQueries"
import { type DeviceInfo } from "@/tauri-commands"
import {
  Smartphone,
  RefreshCw,
  Plus,
  Info,
  FileText,
  Terminal,
  Package,
  Camera,
  Activity,
  Settings
} from "lucide-react"
import { useSettingsWindow } from "@/hooks/use-window"

interface SidebarProps {
  onRefreshDevices: () => void
  onWirelessDeviceConnected: (device: DeviceInfo) => void
  isLoading?: boolean
  activeView: string
  onViewChange: (view: string) => void
}

const navigationItems = [
  { id: 'devices', label: 'Devices', icon: Smartphone },
  { id: 'system-info', label: 'System Info', icon: Info },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'logcat', label: 'Logcat', icon: Terminal },
  { id: 'apps', label: 'Apps', icon: Package },
  { id: 'screen', label: 'Screen', icon: Camera },
  { id: 'performance', label: 'Performance', icon: Activity },
  { id: 'shell', label: 'Shell', icon: Terminal }
]

export function AppSidebar({
  onRefreshDevices,
  onWirelessDeviceConnected,
  isLoading = false,
  activeView,
  onViewChange
}: SidebarProps) {
  const { refreshAll } = useRefreshDevices()
  const { isOpened, open, close } = useSettingsWindow();

  return (
    <Sidebar variant="inset" className="h-[calc(100svh-var(--statusbar-height))] p-0 pt-8">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/droidkit-icon-128.png"
              alt="DroidKit"
              className="size-8"
            />
            <h2 className="text-lg font-semibold">DroidKit</h2>
          </div>
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
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    className="data-[active=true]:outline-solid hover:outline-solid outline-1 outline-sidebar-border/70"
                    isActive={activeView === item.id}
                    onClick={() => onViewChange(item.id)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={isOpened ? close : open}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}