import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { useAppSettings } from "@/hooks/useAppSettings"

export function LogcatSettings() {
  const { settings, updateSettings } = useAppSettings()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Logcat & Debugging</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure how logs are displayed and filtered in the logcat viewer.
        </p>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="defaultLevel">Default Log Level</Label>
            <Select
              value={settings.logcat.defaultLevel}
              onValueChange={(value) => updateSettings('logcat', { defaultLevel: value as 'verbose' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select log level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verbose">Verbose</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="fatal">Fatal</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Minimum log level to display by default
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label>Log Buffer Size</Label>
            <div className="space-y-2">
              <Slider
                value={[settings.logcat.bufferSize]}
                onValueChange={([value]) => updateSettings('logcat', { bufferSize: value })}
                min={100}
                max={10000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>100</span>
                <span className="font-medium">{settings.logcat.bufferSize} lines</span>
                <span>10,000</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Maximum number of log lines to keep in memory
            </p>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label htmlFor="autoScroll">Auto-scroll logs</Label>
              <p className="text-sm text-muted-foreground">
                Automatically scroll to show new log entries
              </p>
            </div>
            <Switch
              id="autoScroll"
              checked={settings.logcat.autoScroll}
              onCheckedChange={(checked) => updateSettings('logcat', { autoScroll: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
