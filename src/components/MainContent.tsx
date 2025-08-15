import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileExplorer } from "@/components/FileExplorer"
import { AppManager } from "@/components/AppManager"
import { LogcatViewer } from "@/components/LogcatViewer"
import { 
  FileText, 
  Monitor, 
  Package, 
  Info, 
  Terminal,
  Camera,
  Activity
} from "lucide-react"

interface DeviceInfo {
  transport: "USB" | "TCP"
  serial_no: string
  model: string
  android_version: string
  sdk_version: string
}

interface MainContentProps {
  selectedDevice?: DeviceInfo
}

export function MainContent({ selectedDevice }: MainContentProps) {
  if (!selectedDevice) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Device Selected</h3>
          <p className="text-sm">
            Select a device from the sidebar to start using DroidKit tools
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6">
      <Tabs defaultValue="overview" className="h-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="gap-2">
            <Info className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FileText className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="logcat" className="gap-2">
            <Terminal className="h-4 w-4" />
            Logcat
          </TabsTrigger>
          <TabsTrigger value="apps" className="gap-2">
            <Package className="h-4 w-4" />
            Apps
          </TabsTrigger>
          <TabsTrigger value="screen" className="gap-2">
            <Camera className="h-4 w-4" />
            Screen
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="shell" className="gap-2">
            <Terminal className="h-4 w-4" />
            Shell
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 h-[calc(100%-60px)]">
          <TabsContent value="overview" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
                <CardDescription>
                  Overview of {selectedDevice.model}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Device Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model:</span>
                        <span>{selectedDevice.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Serial:</span>
                        <span className="font-mono">{selectedDevice.serial_no}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Android:</span>
                        <span>{selectedDevice.android_version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">API Level:</span>
                        <span>{selectedDevice.sdk_version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Connection:</span>
                        <span>{selectedDevice.transport}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">System Status</h4>
                    <div className="text-sm text-muted-foreground">
                      Additional device information will be displayed here
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="h-full">
            <FileExplorer />
          </TabsContent>

          <TabsContent value="logcat" className="h-full">
            <LogcatViewer />
          </TabsContent>

          <TabsContent value="apps" className="h-full">
            <AppManager />
          </TabsContent>

          <TabsContent value="screen" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Screen Control</CardTitle>
                <CardDescription>
                  Screenshot and screen control for {selectedDevice.model}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <Camera className="h-8 w-8 mb-2" />
                  <p>Screen control coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Performance Monitor</CardTitle>
                <CardDescription>
                  Monitor system performance of {selectedDevice.model}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2" />
                  <p>Performance monitoring coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shell" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>ADB Shell</CardTitle>
                <CardDescription>
                  Interactive shell access to {selectedDevice.model}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <Terminal className="h-8 w-8 mb-2" />
                  <p>Shell terminal coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}