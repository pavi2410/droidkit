import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppSettings } from "@/hooks/useAppSettings"

export function AppearanceSettings() {
  const { settings, updateSettings } = useAppSettings()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Theme</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how DroidKit looks to you. Select a single theme, or sync with your system.
        </p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme preference</Label>
            <Select
              value={settings.appearance.theme}
              onValueChange={(value) => updateSettings('appearance', { theme: value as 'light' | 'dark' | 'system' })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
