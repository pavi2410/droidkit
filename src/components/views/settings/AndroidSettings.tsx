import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { useAppSettings } from "@/hooks/useAppSettings"

export function AndroidSettings() {
  const { settings, updateSettings, getFieldError } = useAppSettings()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Android SDK Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure your Android SDK path and AVD management settings.
        </p>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="sdkPath">SDK Path</Label>
            <Input
              id="sdkPath"
              value={settings.android.sdkPath}
              onChange={(e) => updateSettings('android', { sdkPath: e.target.value })}
              placeholder="/Users/username/Library/Android/sdk"
              className={getFieldError('android', 'sdkPath') ? 'border-red-500' : ''}
            />
            {getFieldError('android', 'sdkPath') && (
              <p className="text-sm text-red-500">{getFieldError('android', 'sdkPath')}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Path to your Android SDK installation
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label>AVD Refresh Interval</Label>
            <div className="space-y-2">
              <Slider
                value={[settings.android.avdRefreshInterval]}
                onValueChange={([value]) => updateSettings('android', { avdRefreshInterval: value })}
                min={10}
                max={300}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>10s</span>
                <span className="font-medium">{settings.android.avdRefreshInterval}s</span>
                <span>300s</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              How often to check for available Android Virtual Devices
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
