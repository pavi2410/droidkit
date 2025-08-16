import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAvailableAvds, startAvd } from "@/tauri-commands"

export function useAvdList() {
  // Query for available AVDs
  const {
    data: availableAvds = [],
    isLoading: isLoadingAvds,
    refetch: loadAvds,
    error: avdsError
  } = useQuery({
    queryKey: ['emulators', 'avds'],
    queryFn: async () => {
      try {
        const avds = await getAvailableAvds()
        return avds
      } catch (error) {
        console.log("Failed to load AVDs:", error)
        return []
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    availableAvds,
    isLoadingAvds,
    loadAvds,
    avdsError
  }
}

export function useLaunchAvd() {
  const queryClient = useQueryClient()

  // Mutation for launching AVDs
  const launchAvdMutation = useMutation({
    mutationFn: async (avdName: string) => {
      await startAvd(avdName)
      return avdName
    },
    onSuccess: (avdName) => {
      console.log(`Launching AVD: ${avdName}`)
      // Invalidate queries that might be affected by the new emulator
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
    onError: (error) => {
      console.error("Failed to launch AVD:", error)
    }
  })

  const launchAvd = async (avdName: string, onRefreshDevices?: () => void) => {
    try {
      await launchAvdMutation.mutateAsync(avdName)
      // Refresh devices after a short delay to detect the new emulator
      if (onRefreshDevices) {
        setTimeout(() => {
          onRefreshDevices()
        }, 3000)
      }
    } catch (error) {
      // Error is already handled in mutation
    }
  }

  return {
    launchAvd,
    isLaunchingAvd: launchAvdMutation.isPending,
    launchError: launchAvdMutation.error
  }
}
