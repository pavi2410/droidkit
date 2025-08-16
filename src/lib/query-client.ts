import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on device not found or permission errors
        if (error instanceof Error && 
            (error.message.includes('device not found') || 
             error.message.includes('permission denied'))) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})
