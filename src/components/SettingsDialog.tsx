import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useAppSettings } from "@/hooks/useAppSettings"
import { 
  Palette, 
  Smartphone, 
  Monitor, 
  Folder, 
  FileText,
  RotateCcw
} from "lucide-react"

interface SettingsDialogProps {
  children: React.ReactNode
}

const settingsSections = [
  { id: 'appearance', name: 'Appearance', icon: Palette },
  { id: 'android', name: 'Android SDK', icon: Smartphone },
  { id: 'devices', name: 'Device Monitoring', icon: Monitor },
  { id: 'files', name: 'File Operations', icon: Folder },
  { id: 'logcat', name: 'Logcat & Debugging', icon: FileText },
] as const

type SettingsSection = typeof settingsSections[number]['id']

export function SettingsDialog({ children }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance')
  const [open, setOpen] = useState(false)
  const { 
    settings, 
    isLoading, 
    updateSettings, 
    resetToDefaults, 
    hasCategoryErrors,
    getFieldError 
  } = useAppSettings()

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      await resetToDefaults()
    }
  }

  const activeSectionData = settingsSections.find(s => s.id === activeSection)

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[900px] lg:max-w-[1000px]">
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[900px] lg:max-w-[1000px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your DroidKit settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {settingsSections.map((section) => {
                      const hasError = hasCategoryErrors(section.id)
                      return (
                        <SidebarMenuItem key={section.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={section.id === activeSection}
                            className={cn(hasError && "border-l-2 border-red-500")}
                          >
                            <button onClick={() => setActiveSection(section.id)}>
                              <section.icon />
                              <span>{section.name}</span>
                              {hasError && (
                                <div className="ml-auto h-2 w-2 rounded-full bg-red-500" />
                              )}
                            </button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              
              <div className="mt-auto p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="w-full gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Defaults
                </Button>
              </div>
            </SidebarContent>
          </Sidebar>
          
          <main className="flex h-[580px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#" onClick={(e) => e.preventDefault()}>
                        Settings
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeSectionData?.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pt-0">
              {activeSection === 'appearance' && (
                <AppearanceSettings 
                  settings={settings.appearance}
                  updateSettings={updateSettings}
                />
              )}
              {activeSection === 'android' && (
                <AndroidSettings 
                  settings={settings.android}
                  updateSettings={updateSettings}
                  getFieldError={getFieldError}
                />
              )}
              {activeSection === 'devices' && (
                <DeviceSettings 
                  settings={settings.devices}
                  updateSettings={updateSettings}
                />
              )}
              {activeSection === 'files' && (
                <FileSettings 
                  settings={settings.files}
                  updateSettings={updateSettings}
                  getFieldError={getFieldError}
                />
              )}
              {activeSection === 'logcat' && (
                <LogcatSettings 
                  settings={settings.logcat}
                  updateSettings={updateSettings}
                />
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}

function AppearanceSettings({ settings, updateSettings }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Theme</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how DroidKit looks to you. Select a single theme, or sync with your system.
        </p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme preference</Label>
            <Select
              value={settings.theme}
              onValueChange={(value) => updateSettings('appearance', { theme: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

function AndroidSettings({ settings, updateSettings, getFieldError }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Android SDK Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure your Android SDK path and AVD management settings.
        </p>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="sdkPath">SDK Path</Label>
            <Input
              id="sdkPath"
              value={settings.sdkPath}
              onChange={(e) => updateSettings('android', { sdkPath: e.target.value })}
              placeholder="/Users/username/Library/Android/sdk"
              className={getFieldError('android', 'sdkPath') ? 'border-red-500' : ''}
            />
            {getFieldError('android', 'sdkPath') && (
              <p className="text-sm text-red-500">{getFieldError('android', 'sdkPath')}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Path to your Android SDK installation
            </p>
          </div>
          
          <div className="space-y-3">
            <Label>AVD Refresh Interval</Label>
            <div className="space-y-2">
              <Slider
                value={[settings.avdRefreshInterval]}
                onValueChange={([value]) => updateSettings('android', { avdRefreshInterval: value })}
                min={10}
                max={300}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>10s</span>
                <span className="font-medium">{settings.avdRefreshInterval}s</span>
                <span>300s</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              How often to check for available Android Virtual Devices
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeviceSettings({ settings, updateSettings }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Device Monitoring</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Control how DroidKit monitors and connects to your Android devices.
        </p>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Device Polling Interval</Label>
            <div className="space-y-2">
              <Slider
                value={[settings.pollingInterval]}
                onValueChange={([value]) => updateSettings('devices', { pollingInterval: value })}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1s</span>
                <span className="font-medium">{settings.pollingInterval}s</span>
                <span>10s</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              How often to check for connected devices
            </p>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label htmlFor="autoRefresh">Auto-refresh device list</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect device connections and disconnections
              </p>
            </div>
            <Switch
              id="autoRefresh"
              checked={settings.autoRefresh}
              onCheckedChange={(checked) => updateSettings('devices', { autoRefresh: checked })}
            />
          </div>
          
          <div className="space-y-3">
            <Label>Connection Timeout</Label>
            <div className="space-y-2">
              <Slider
                value={[settings.connectionTimeout]}
                onValueChange={([value]) => updateSettings('devices', { connectionTimeout: value })}
                min={1000}
                max={30000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1s</span>
                <span className="font-medium">{settings.connectionTimeout / 1000}s</span>
                <span>30s</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Maximum time to wait for device responses
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FileSettings({ settings, updateSettings, getFieldError }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">File Operations</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure how files are handled when browsing device storage.
        </p>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="downloadPath">Default Download Path</Label>
            <Input
              id="downloadPath"
              value={settings.downloadPath}
              onChange={(e) => updateSettings('files', { downloadPath: e.target.value })}
              placeholder="/Users/username/Downloads"
              className={getFieldError('files', 'downloadPath') ? 'border-red-500' : ''}
            />
            <p className="text-sm text-muted-foreground">
              Where files from device will be saved by default
            </p>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label htmlFor="showHidden">Show hidden files</Label>
              <p className="text-sm text-muted-foreground">
                Display files and folders that start with a dot
              </p>
            </div>
            <Switch
              id="showHidden"
              checked={settings.showHidden}
              onCheckedChange={(checked) => updateSettings('files', { showHidden: checked })}
            />
          </div>
          
          <div className="space-y-3">
            <Label>Transfer Chunk Size</Label>
            <div className="space-y-2">
              <Slider
                value={[settings.transferChunkSize]}
                onValueChange={([value]) => updateSettings('files', { transferChunkSize: value })}
                min={512}
                max={10240}
                step={512}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>512B</span>
                <span className="font-medium">{settings.transferChunkSize}B</span>
                <span>10KB</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Size of data chunks for file transfers (larger = faster, more memory)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function LogcatSettings({ settings, updateSettings }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Logcat & Debugging</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure how logs are displayed and filtered in the logcat viewer.
        </p>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="defaultLevel">Default Log Level</Label>
            <Select
              value={settings.defaultLevel}
              onValueChange={(value) => updateSettings('logcat', { defaultLevel: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select log level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verbose">Verbose</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="fatal">Fatal</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Minimum log level to display by default
            </p>
          </div>
          
          <div className="space-y-3">
            <Label>Log Buffer Size</Label>
            <div className="space-y-2">
              <Slider
                value={[settings.bufferSize]}
                onValueChange={([value]) => updateSettings('logcat', { bufferSize: value })}
                min={100}
                max={10000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>100</span>
                <span className="font-medium">{settings.bufferSize} lines</span>
                <span>10,000</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Maximum number of log lines to keep in memory
            </p>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label htmlFor="autoScroll">Auto-scroll logs</Label>
              <p className="text-sm text-muted-foreground">
                Automatically scroll to show new log entries
              </p>
            </div>
            <Switch
              id="autoScroll"
              checked={settings.autoScroll}
              onCheckedChange={(checked) => updateSettings('logcat', { autoScroll: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}