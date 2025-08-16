import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pairWirelessDevice, type DeviceInfo } from "@/tauri-commands"
import { Loader2 } from "lucide-react"

interface PairingDialogProps {
  children: React.ReactNode
  device: {
    name: string
    addresses: string[]
    port: number
  }
  onDevicePaired?: (deviceInfo: DeviceInfo) => void
}

export function PairingDialog({ children, device, onDevicePaired }: PairingDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pairingCode, setPairingCode] = useState("")
  const [pairingPort, setPairingPort] = useState(device.port.toString())
  const [isPairing, setIsPairing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePair = async () => {
    if (!pairingCode.trim()) {
      setError("Please enter a pairing code")
      return
    }

    const portNumber = parseInt(pairingPort)
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      setError("Please enter a valid port number (1-65535)")
      return
    }

    setIsPairing(true)
    setError(null)

    try {
      // Filter for IPv4 addresses only (IPv6 addresses contain colons)
      const ipv4Addresses = device.addresses.filter(addr => !addr.includes(':'))
      
      if (ipv4Addresses.length === 0) {
        throw new Error("No IPv4 addresses found for this device")
      }
      
      // Use the first available IPv4 address
      const ipAddress = ipv4Addresses[0]
      
      const deviceInfo = await pairWirelessDevice(ipAddress, portNumber, pairingCode.trim())

      console.log("Device paired successfully:", deviceInfo)
      
      // Notify parent component about successful pairing
      onDevicePaired?.(deviceInfo)
      
      // Close dialog and reset state
      setIsOpen(false)
      setPairingCode("")
      setPairingPort(device.port.toString())
      setError(null)
    } catch (error) {
      console.error("Pairing failed:", error)
      setError(error as string || "Failed to pair device")
    } finally {
      setIsPairing(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset state when dialog closes
      setPairingCode("")
      setPairingPort(device.port.toString())
      setError(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pair with {device.name}</DialogTitle>
          <DialogDescription>
            Enter the 6-digit pairing code shown on your Android device's wireless debugging screen.
            Make sure you're using the pairing port (usually 37xxx), not the connection port (5555).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="device-info">Device Information</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium">Name:</span> {device.name}</p>
              <p><span className="font-medium">IP:</span> {device.addresses[0]}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pairing-port">Pairing Port</Label>
              <Input
                id="pairing-port"
                placeholder="37851"
                value={pairingPort}
                onChange={(e) => setPairingPort(e.target.value)}
                disabled={isPairing}
                className="text-center"
              />
              <p className="text-xs text-muted-foreground">
                Check your device's pairing screen for the correct port
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pairing-code">Pairing Code</Label>
              <Input
                id="pairing-code"
                placeholder="123456"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                disabled={isPairing}
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isPairing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePair}
            disabled={isPairing || !pairingCode.trim()}
          >
            {isPairing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pairing...
              </>
            ) : (
              "Pair Device"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
