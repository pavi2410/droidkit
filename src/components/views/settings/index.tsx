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
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
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
import { AppearanceSettings } from "./AppearanceSettings"
import { AndroidSettings } from "./AndroidSettings"
import { DeviceSettings } from "./DeviceSettings"
import { FileSettings } from "./FileSettings"
import { LogcatSettings } from "./LogcatSettings"

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
    isLoading, 
    resetToDefaults, 
    hasCategoryErrors
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
        <SidebarProvider className="items-start min-h-0">
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
            </SidebarContent>
            <SidebarFooter className="max-lg:pb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
            </SidebarFooter>
          </Sidebar>
          
          <main className="flex h-[580px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear border-b">
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
            
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
              {activeSection === 'appearance' && <AppearanceSettings />}
              {activeSection === 'android' && <AndroidSettings />}
              {activeSection === 'devices' && <DeviceSettings />}
              {activeSection === 'files' && <FileSettings />}
              {activeSection === 'logcat' && <LogcatSettings />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
