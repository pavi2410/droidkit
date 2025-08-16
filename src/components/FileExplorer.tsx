import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type DeviceInfo, type FileInfo } from "@/tauri-commands"
import { useDeviceFiles, useDownloadFile, useRefreshDeviceFiles } from "@/hooks/useDeviceDataQueries"
import { 
  Folder, 
  File, 
  Home, 
  ArrowLeft,
  Download,
  RefreshCw
} from "lucide-react"

interface FileExplorerProps {
  selectedDevice?: DeviceInfo
}

export function FileExplorer({ selectedDevice }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState("/sdcard")
  const [pathHistory, setPathHistory] = useState<string[]>(["/sdcard"])

  // Use TanStack Query for file operations
  const {
    data: files = [],
    isLoading,
    error
  } = useDeviceFiles(selectedDevice, currentPath)

  const downloadFileMutation = useDownloadFile()
  const refreshFiles = useRefreshDeviceFiles(selectedDevice, currentPath)

  const navigateToPath = (path: string) => {
    setCurrentPath(path)
    setPathHistory(prev => [...prev, path])
  }

  const goBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = pathHistory.slice(0, -1)
      const previousPath = newHistory[newHistory.length - 1]
      setPathHistory(newHistory)
      setCurrentPath(previousPath)
    }
  }

  const downloadFile = async (file: FileInfo) => {
    try {
      // For demo purposes, download to desktop
      const localPath = `/Users/${process.env.USER}/Desktop/${file.name}`
      await downloadFileMutation.mutateAsync({ 
        remotePath: file.path, 
        localPath 
      })
    } catch (error) {
      console.error("Failed to download file:", error)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ""
    const units = ["B", "KB", "MB", "GB"]
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>File Explorer</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              disabled={pathHistory.length <= 1}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPath("/sdcard")}
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshFiles}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <div className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded">
          {currentPath}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No files found or access denied</p>
            </div>
          ) : (
            <div className="divide-y">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => file.is_directory && navigateToPath(file.path)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {file.is_directory ? (
                      <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{file.permissions}</span>
                        {file.size && (
                          <span>{formatFileSize(file.size)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.is_directory ? (
                      <Badge variant="outline" className="text-xs">
                        Folder
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          File
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadFile(file)
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
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