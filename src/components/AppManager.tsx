import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DeviceInfo } from "@/types/device"
import { 
  Package, 
  Search,
  RefreshCw,
  Trash2,
  Info
} from "lucide-react"

interface AppManagerProps {
  selectedDevice?: DeviceInfo
}

export function AppManager({ selectedDevice }: AppManagerProps) {
  const [apps, setApps] = useState<string[]>([])
  const [filteredApps, setFilteredApps] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const loadApps = async () => {
    if (!selectedDevice) {
      setApps([])
      setFilteredApps([])
      return
    }

    setIsLoading(true)
    try {
      const appList = await invoke<string[]>("get_apps_for_device", { 
        deviceSerial: selectedDevice.serial_no 
      })
      setApps(appList)
      setFilteredApps(appList)
    } catch (error) {
      console.error("Failed to load apps:", error)
      setApps([])
      setFilteredApps([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterApps = (term: string) => {
    const filtered = apps.filter(app => 
      app.toLowerCase().includes(term.toLowerCase())
    )
    setFilteredApps(filtered)
  }

  const isSystemApp = (packageName: string) => {
    return packageName.startsWith("com.android.") || 
           packageName.startsWith("android.") ||
           packageName.includes("google") ||
           packageName.includes("system")
  }

  const getAppDisplayName = (packageName: string) => {
    // Extract the app name from package name
    const parts = packageName.split(".")
    return parts[parts.length - 1].replace(/[_-]/g, " ")
  }

  useEffect(() => {
    loadApps()
  }, [selectedDevice])

  useEffect(() => {
    filterApps(searchTerm)
  }, [searchTerm, apps])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Installed Applications ({filteredApps.length})</span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadApps}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading applications...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No applications found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredApps.map((app, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Package className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {getAppDisplayName(app)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {app}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isSystemApp(app) ? (
                      <Badge variant="outline" className="text-xs">
                        System
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        User
                      </Badge>
                    )}
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log("App info for:", app)}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                      {!isSystemApp(app) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => console.log("Uninstall:", app)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}