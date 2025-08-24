import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type DeviceInfo, type FileInfo } from "@/tauri-commands"
import { useDeviceFiles, useDownloadFile, useRefreshDeviceFiles } from "@/hooks/useDeviceDataQueries"
import {
  Folder,
  File,
  Home,
  ArrowLeft,
  Download,
  RefreshCw,
  Smartphone,
  HardDrive,
  Camera,
  Link
} from "lucide-react"

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

interface FileItemProps {
  file: FileInfo
  onNavigate: (path: string) => void
  onDownload: (file: FileInfo) => void
}

function FileItem({ file, onNavigate, onDownload }: FileItemProps) {
  const getNavigationPath = (): string | null => {
    switch (file.file_type.type) {
      case 'Directory':
        return `${file.dir}/${file.name}`
      case 'Symlink':
        return file.file_type.target
      case 'File':
        return null // Files are not navigatable
    }
  }

  const isNavigatable = (): boolean => {
    return file.file_type.type === 'Directory' || file.file_type.type === 'Symlink'
  }

  const getFileIcon = () => {
    switch (file.file_type.type) {
      case 'Directory':
        return <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
      case 'Symlink':
        return <Link className="h-4 w-4 text-green-500 flex-shrink-0" />
      case 'File':
        return <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
    }
  }

  const navPath = getNavigationPath()

  return (
    <div
      className={`flex items-center justify-between p-3 hover:bg-muted/50 ${isNavigatable() ? 'cursor-pointer' : ''
        }`}
      onClick={() => navPath && onNavigate(navPath)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getFileIcon()}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {file.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{file.permissions}</span>
            {file.size && (
              <span>{formatFileSize(file.size)}</span>
            )}
            {file.file_type.type === 'Symlink' && (
              <span className="text-green-600 truncate">→ {file.file_type.target}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {file.file_type.type === 'File' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDownload(file)
            }}
          >
            <Download className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

interface PathBreadcrumbProps {
  currentPath: string
  onNavigate: (path: string) => void
}

function PathBreadcrumb({ currentPath, onNavigate }: PathBreadcrumbProps) {
  const getPathSegments = () => {
    return currentPath.split('/').filter(segment => segment !== '')
  }

  const getPathUpTo = (index: number) => {
    const segments = getPathSegments()
    if (index === -1) return '/'
    return '/' + segments.slice(0, index + 1).join('/')
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            className={`cursor-pointer ${currentPath === '/' ? 'font-semibold text-foreground' : ''}`}
            onClick={() => onNavigate('/')}
            title="Root directory"
          >
            /
          </BreadcrumbLink>
        </BreadcrumbItem>
        {getPathSegments().map((segment, index) => (
          <React.Fragment key={index}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className={`cursor-pointer hover:text-foreground ${getPathUpTo(index) === currentPath ? 'font-semibold text-foreground' : ''
                  }`}
                onClick={() => onNavigate(getPathUpTo(index))}
                title={getPathUpTo(index)}
              >
                {segment}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

interface FileExplorerProps {
  selectedDevice?: DeviceInfo
}

export function FileExplorer({ selectedDevice }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState("/")
  const [pathHistory, setPathHistory] = useState<string[]>(["/"])

  // Use TanStack Query for file operations
  const {
    data: files = [],
    isLoading
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
      const remotePath = `${file.dir}/${file.name}`
      await downloadFileMutation.mutateAsync({
        remotePath,
        localPath
      })
    } catch (error) {
      console.error("Failed to download file:", error)
    }
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
              onClick={() => navigateToPath("/home")}
              title="User home directory"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPath("/sdcard")}
              title="Internal storage"
            >
              <HardDrive className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPath("/system")}
              title="System directory"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPath("/sdcard/DCIM")}
              title="Camera photos"
            >
              <Camera className="h-4 w-4" />
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
        <PathBreadcrumb
          currentPath={currentPath}
          onNavigate={navigateToBreadcrumb}
        />
      </div>

      <div className="flex-1 h-0 border rounded-lg overflow-hidden">
        <ScrollArea className="h-full">
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
                <FileItem
                  key={index}
                  file={file}
                  onNavigate={navigateToPath}
                  onDownload={downloadFile}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
