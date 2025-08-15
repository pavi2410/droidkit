import { useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DeviceInfo } from "@/types/device"
import { Wifi, Loader2, AlertCircle } from "lucide-react"

interface WirelessConnectionDialogProps {
  onDeviceConnected: (device: DeviceInfo) => void
  children: React.ReactNode
}

export function WirelessConnectionDialog({ onDeviceConnected, children }: WirelessConnectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [ipAddress, setIpAddress] = useState("")
  const [port, setPort] = useState("5555")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")

  const validateIpAddress = (ip: string): boolean => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) return false
    
    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }

  const validatePort = (portStr: string): boolean => {
    const portNum = parseInt(portStr, 10)
    return !isNaN(portNum) && portNum > 0 && portNum <= 65535
  }

  const handleConnect = async () => {
    setError("")
    
    // Validation
    if (!ipAddress.trim()) {
      setError("IP address is required")
      return
    }
    
    if (!validateIpAddress(ipAddress.trim())) {
      setError("Invalid IP address format")
      return
    }
    
    if (!validatePort(port)) {
      setError("Port must be between 1 and 65535")
      return
    }

    setIsConnecting(true)
    
    try {
      const device = await invoke<DeviceInfo>("connect_wireless_device", {
        ip: ipAddress.trim(),
        port: parseInt(port, 10)
      })
      
      onDeviceConnected(device)
      setOpen(false)
      setIpAddress("")
      setPort("5555")
      setError("")
    } catch (err) {
      setError(err as string || "Failed to connect to device")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isConnecting) {
      setOpen(newOpen)
      if (!newOpen) {
        setError("")
        setIpAddress("")
        setPort("5555")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Connect Wireless Device
          </DialogTitle>
          <DialogDescription>
            Connect to an Android device over Wi-Fi using ADB TCP/IP mode.
            Make sure the device is on the same network and ADB over Wi-Fi is enabled.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ip-address" className="text-right">
              IP Address
            </Label>
            <Input
              id="ip-address"
              placeholder="192.168.1.100"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="col-span-3"
              disabled={isConnecting}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="port" className="text-right">
              Port
            </Label>
            <Input
              id="port"
              placeholder="5555"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="col-span-3"
              disabled={isConnecting}
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isConnecting}
          >
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}