import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { useAppSettings } from "@/hooks/useAppSettings"

export function DeviceSettings() {
  const { settings, updateSettings } = useAppSettings()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Device Connection & Discovery</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Control how DroidKit monitors, discovers, and connects to your Android devices.
        </p>
        
        <div className="space-y-6">
          {/* USB Device Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-foreground">USB Device Management</h4>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label htmlFor="autoDiscoverUSB">Auto-discover USB devices</Label>
                <p className="text-sm text-muted-foreground">
                  Continuously scan for USB Android devices when connected
                </p>
              </div>
              <Switch
                id="autoDiscoverUSB"
                checked={settings.devices.autoDiscoverUSB}
                onCheckedChange={(checked) => updateSettings('devices', { autoDiscoverUSB: checked })}
              />
            </div>
            
          </div>

          <Separator />

          {/* Wireless Device Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-foreground">Wireless Device Management</h4>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label htmlFor="autoDiscoverWireless">Auto-discover wireless devices</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically scan for wireless Android devices on your network
                </p>
              </div>
              <Switch
                id="autoDiscoverWireless"
                checked={settings.devices.autoDiscoverWireless}
                onCheckedChange={(checked) => updateSettings('devices', { autoDiscoverWireless: checked })}
              />
            </div>
            
            <div className="space-y-3">
              <Label>Wireless Discovery Interval</Label>
              <div className="space-y-2">
                <Slider
                  value={[settings.devices.wirelessDiscoveryInterval]}
                  onValueChange={([value]) => updateSettings('devices', { wirelessDiscoveryInterval: value })}
                  min={10}
                  max={300}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>10s</span>
                  <span className="font-medium">{settings.devices.wirelessDiscoveryInterval}s</span>
                  <span>300s</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                How often to scan for new wireless devices
              </p>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label htmlFor="showUnpairedDevices">Show unpaired devices</Label>
                <p className="text-sm text-muted-foreground">
                  Display discovered wireless devices that haven't been paired yet
                </p>
              </div>
              <Switch
                id="showUnpairedDevices"
                checked={settings.devices.showUnpairedDevices}
                onCheckedChange={(checked) => updateSettings('devices', { showUnpairedDevices: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label htmlFor="autoReconnectPaired">Auto-reconnect to paired devices</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically reconnect to the most recently used paired wireless device on startup
                </p>
              </div>
              <Switch
                id="autoReconnectPaired"
                checked={settings.devices.autoReconnectPaired}
                onCheckedChange={(checked) => updateSettings('devices', { autoReconnectPaired: checked })}
              />
            </div>
          </div>

          <Separator />

          {/* General Device Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-foreground">General Device Monitoring</h4>
            
            <div className="space-y-3">
              <Label>Device Polling Interval</Label>
              <div className="space-y-2">
                <Slider
                  value={[settings.devices.pollingInterval]}
                  onValueChange={([value]) => updateSettings('devices', { pollingInterval: value })}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1s</span>
                  <span className="font-medium">{settings.devices.pollingInterval}s</span>
                  <span>10s</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                How often to check for connected devices
              </p>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label htmlFor="autoRefresh">Auto-refresh device list</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically detect device connections and disconnections
                </p>
              </div>
              <Switch
                id="autoRefresh"
                checked={settings.devices.autoRefresh}
                onCheckedChange={(checked) => updateSettings('devices', { autoRefresh: checked })}
              />
            </div>
            
            <div className="space-y-3">
              <Label>Connection Timeout</Label>
              <div className="space-y-2">
                <Slider
                  value={[settings.devices.connectionTimeout]}
                  onValueChange={([value]) => updateSettings('devices', { connectionTimeout: value })}
                  min={1000}
                  max={30000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1s</span>
                  <span className="font-medium">{settings.devices.connectionTimeout / 1000}s</span>
                  <span>30s</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Maximum time to wait for device responses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
