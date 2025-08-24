import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { useAppSettings } from "@/hooks/useAppSettings"

export function FileSettings() {
  const { settings, updateSettings, getFieldError } = useAppSettings()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">File Operations</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure how files are handled when browsing device storage.
        </p>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="downloadPath">Default Download Path</Label>
            <Input
              id="downloadPath"
              value={settings.files.downloadPath}
              onChange={(e) => updateSettings('files', { downloadPath: e.target.value })}
              placeholder="/Users/username/Downloads"
              className={getFieldError('files', 'downloadPath') ? 'border-red-500' : ''}
            />
            <p className="text-sm text-muted-foreground">
              Where files from device will be saved by default
            </p>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label htmlFor="showHidden">Show hidden files</Label>
              <p className="text-sm text-muted-foreground">
                Display files and folders that start with a dot
              </p>
            </div>
            <Switch
              id="showHidden"
              checked={settings.files.showHidden}
              onCheckedChange={(checked) => updateSettings('files', { showHidden: checked })}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label>Transfer Chunk Size</Label>
            <div className="space-y-2">
              <Slider
                value={[settings.files.transferChunkSize]}
                onValueChange={([value]) => updateSettings('files', { transferChunkSize: value })}
                min={512}
                max={10240}
                step={512}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>512B</span>
                <span className="font-medium">{settings.files.transferChunkSize}B</span>
                <span>10KB</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Size of data chunks for file transfers (larger = faster, more memory)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
