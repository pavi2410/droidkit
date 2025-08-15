import { useEffect } from "react"
import { useAppSettings } from "@/hooks/useAppSettings"

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { getCategory, isLoading } = useAppSettings()

  useEffect(() => {
    if (isLoading) return

    const appearanceSettings = getCategory('appearance')
    const theme = appearanceSettings.theme

    const applyTheme = (isDark: boolean) => {
      document.documentElement.classList.toggle('dark', isDark)
    }

    if (theme === 'system') {
      // Use system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches)

      // Listen for system theme changes
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches)
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      applyTheme(theme === 'dark')
    }
  }, [getCategory, isLoading])

  return <>{children}</>
}