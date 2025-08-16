import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
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

  const navigateToBreadcrumb = (path: string) => {
    setCurrentPath(path)
    // Update history to remove everything after the clicked breadcrumb
    const pathIndex = pathHistory.indexOf(path)
    if (pathIndex !== -1) {
      setPathHistory(pathHistory.slice(0, pathIndex + 1))
    }
  }

  const getPathSegments = () => {
    return currentPath.split('/').filter(segment => segment !== '')
  }

  const getPathUpTo = (index: number) => {
    const segments = getPathSegments()
    if (index === -1) return '/'
    return '/' + segments.slice(0, index + 1).join('/')
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
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">File Explorer</h2>
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
        </div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                className="cursor-pointer" 
                onClick={() => navigateToBreadcrumb('/')}
              >
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            {getPathSegments().map((segment, index) => (
              <React.Fragment key={index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    className="cursor-pointer hover:text-foreground" 
                    onClick={() => navigateToBreadcrumb(getPathUpTo(index))}
                  >
                    {segment}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex-1 border rounded-lg overflow-hidden">
        <div className="overflow-y-auto">
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
      </div>
    </div>
  )
}