import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Folder, Play } from "lucide-react"

interface SettingsDialogProps {
  children: React.ReactNode
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const [androidSdkPath, setAndroidSdkPath] = useState<string>("")
  const [availableAvds, setAvailableAvds] = useState<string[]>([])
  const [isLoadingAvds, setIsLoadingAvds] = useState(false)

  const loadSettings = async () => {
    try {
      const sdkPath = await invoke<string>("get_android_sdk_path")
      if (sdkPath) {
        setAndroidSdkPath(sdkPath)
      }
    } catch (error) {
      console.log("No Android SDK found:", error)
    }
  }

  const loadAvds = async () => {
    setIsLoadingAvds(true)
    try {
      const avds = await invoke<string[]>("get_available_avds")
      setAvailableAvds(avds)
    } catch (error) {
      console.log("Failed to load AVDs:", error)
      setAvailableAvds([])
    } finally {
      setIsLoadingAvds(false)
    }
  }

  const launchAvd = async (avdName: string) => {
    try {
      await invoke("start_avd", { avdName })
      console.log(`Launching AVD: ${avdName}`)
    } catch (error) {
      console.error("Failed to launch AVD:", error)
    }
  }

  useEffect(() => {
    loadSettings()
    loadAvds()
  }, [])

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            DroidKit Settings
          </DialogTitle>
          <DialogDescription>
            Configure Android SDK path and manage virtual devices
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Android SDK Configuration */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Android SDK</h3>
            <div className="space-y-2">
              <Label htmlFor="android-sdk-path">SDK Path</Label>
              <div className="flex gap-2">
                <Input
                  id="android-sdk-path"
                  value={androidSdkPath}
                  onChange={(e) => setAndroidSdkPath(e.target.value)}
                  placeholder="/path/to/android/sdk"
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Folder className="h-4 w-4" />
                </Button>
              </div>
              {androidSdkPath && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-1" />
                    SDK Found
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* AVD Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Android Virtual Devices</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadAvds}
                disabled={isLoadingAvds}
              >
                {isLoadingAvds ? "Loading..." : "Refresh"}
              </Button>
            </div>
            
            <div className="space-y-2">
              {availableAvds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No AVDs found</p>
                  <p className="text-sm mt-1">
                    Create AVDs using Android Studio or the command line
                  </p>
                </div>
              ) : (
                availableAvds.map((avd) => (
                  <div
                    key={avd}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{avd}</p>
                      <p className="text-sm text-muted-foreground">
                        Android Virtual Device
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => launchAvd(avd)}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Launch
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}