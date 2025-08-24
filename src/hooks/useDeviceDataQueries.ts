import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import type { DeviceInfo } from '@/tauri-commands'
import {
  browseFilesForDevice,
  getAppsForDevice,
  downloadFile,
  getLogcatForDevice,
} from '@/tauri-commands'

// Query Keys for file and app operations
export const fileKeys = {
  all: ['files'] as const,
  device: (deviceId: string) => [...fileKeys.all, 'device', deviceId] as const,
  devicePath: (deviceId: string, path: string) => [...fileKeys.device(deviceId), 'path', path] as const,
}

export const appKeys = {
  all: ['apps'] as const,
  device: (deviceId: string) => [...appKeys.all, 'device', deviceId] as const,
}

export const logKeys = {
  all: ['logs'] as const,
  device: (deviceId: string) => [...logKeys.all, 'device', deviceId] as const,
}

// File Browser Queries
export function useDeviceFiles(device: DeviceInfo | undefined, path: string) {
  return useQuery({
    queryKey: fileKeys.devicePath(device?.serial_no || '', path),
    queryFn: () => browseFilesForDevice(device!.serial_no, path),
    enabled: !!device,
    staleTime: 30 * 1000, // Files change less frequently than device lists
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error instanceof Error && error.message.includes('permission denied')) {
        return false
      }
      return failureCount < 2
    },
  })
}

// App Manager Queries
export function useDeviceApps(device: DeviceInfo | undefined) {
  return useQuery({
    queryKey: appKeys.device(device?.serial_no || ''),
    queryFn: () => getAppsForDevice(device!.serial_no),
    enabled: !!device,
    staleTime: 5 * 60 * 1000, // Apps change even less frequently
    retry: 2,
  })
}

// Logcat Hook using Channels
export function useDeviceLogs(
  device: DeviceInfo | undefined, 
  lines: number = 100, 
  enabled: boolean = true, 
  logLevel?: string
) {
  const [logs, setLogs] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(() => {
    if (!device || !enabled) return

    setIsLoading(true)
    setError(null)

    getLogcatForDevice(
      device.serial_no, 
      lines, 
      logLevel,
      (result: { Ok?: string; Err?: string }) => {
        if (result.Ok) {
          setLogs(result.Ok)
          setError(null)
        } else if (result.Err) {
          setError(new Error(result.Err))
        }
        setIsLoading(false)
      }
    )
  }, [device, lines, logLevel, enabled])

  useEffect(() => {
    if (enabled && device) {
      refetch()
    }
  }, [refetch, enabled, device])

  return {
    data: logs,
    isLoading,
    error,
    refetch,
  }
}

// File Operations Mutations
export function useDownloadFile() {
  return useMutation({
    mutationFn: ({ remotePath, localPath }: { remotePath: string; localPath: string }) =>
      downloadFile(remotePath, localPath),
    onSuccess: (_, { localPath }) => {
      console.log(`File downloaded to: ${localPath}`)
      // Could show a toast notification here
    },
    onError: (error) => {
      console.error('Download failed:', error)
      // Could show an error toast here
    },
  })
}

// Utility hooks for cache management
export function useRefreshDeviceFiles(device: DeviceInfo | undefined, path: string) {
  const queryClient = useQueryClient()
  
  return () => {
    if (device) {
      queryClient.invalidateQueries({ 
        queryKey: fileKeys.devicePath(device.serial_no, path) 
      })
    }
  }
}

export function useRefreshDeviceApps(device: DeviceInfo | undefined) {
  const queryClient = useQueryClient()
  
  return () => {
    if (device) {
      queryClient.invalidateQueries({ 
        queryKey: appKeys.device(device.serial_no) 
      })
    }
  }
}

export function useInvalidateAllDeviceData(device: DeviceInfo | undefined) {
  const queryClient = useQueryClient()
  
  return () => {
    if (device) {
      queryClient.invalidateQueries({ queryKey: fileKeys.device(device.serial_no) })
      queryClient.invalidateQueries({ queryKey: appKeys.device(device.serial_no) })
      queryClient.invalidateQueries({ queryKey: logKeys.device(device.serial_no) })
    }
  }
}
