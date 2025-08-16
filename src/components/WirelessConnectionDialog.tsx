import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPairingQrData, pairWirelessDevice, connectWirelessDevice, type DeviceInfo, type PairingData } from "@/tauri-commands"
import { PairedDevice } from "@/types/paired-device"
import { usePairedDevices } from "@/hooks/usePairedDevices"
import { QRCodeSVG } from "qrcode.react"
import { WirelessPairingSchema } from "@/lib/wireless-pairing-schema"
import { Wifi, Loader2, AlertCircle, QrCode, Smartphone, Clock, Trash2 } from "lucide-react"

interface WirelessConnectionDialogProps {
  onDeviceConnected: (device: DeviceInfo) => void
  children: React.ReactNode
}

export function WirelessConnectionDialog({ onDeviceConnected, children }: WirelessConnectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("qr-code")
  
  // Manual pairing state
  const [ipAddress, setIpAddress] = useState("")
  const [port, setPort] = useState("5555")
  const [pairingCode, setPairingCode] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPairing, setIsPairing] = useState(false)
  const [error, setError] = useState("")
  
  // QR pairing state
  const [pairingData, setPairingData] = useState<PairingData | null>(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  
  // Device name for saving
  const [deviceName, setDeviceName] = useState("")
  
  // Paired devices
  const { devices: pairedDevices, addDevice, removeDevice, updateLastConnected } = usePairedDevices()

  // Generate QR code data for pairing
  const generateQRCode = async () => {
    setIsGeneratingQR(true)
    setError("")
    
    try {
      const data = await getPairingQrData()
      setPairingData(data)
    } catch (err) {
      setError(err as string || "Failed to generate QR code")
    } finally {
      setIsGeneratingQR(false)
    }
  }

  // Handle manual pairing with code
  const handlePairDevice = async () => {
    setError("")
    
    // Validate using Zod schema
    const validationResult = WirelessPairingSchema.safeParse({
      deviceName: deviceName.trim(),
      ipAddress: ipAddress.trim(),
      port: port,
      pairingCode: pairingCode.trim()
    })
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      setError(firstError.message)
      return
    }

    const validatedData = validationResult.data
    setIsPairing(true)
    
    try {
      const device = await pairWirelessDevice(
        validatedData.ipAddress, 
        validatedData.port, 
        validatedData.pairingCode
      )
      
      // Save paired device
      const name = validatedData.deviceName || `${device.model} (${validatedData.ipAddress})`
      await addDevice({
        name,
        ip: validatedData.ipAddress,
        port: validatedData.port,
        pairingMethod: 'pairing-code'
      })
      
      onDeviceConnected(device)
      setOpen(false)
      resetForm()
    } catch (err) {
      setError(err as string || "Failed to pair device")
    } finally {
      setIsPairing(false)
    }
  }

  // Handle quick connect to saved device
  const handleQuickConnect = async (device: PairedDevice) => {
    setIsConnecting(true)
    setError("")
    
    try {
      const deviceInfo = await connectWirelessDevice(device.ip, device.port)
      
      // Update last connected time
      await updateLastConnected(device.id)
      
      onDeviceConnected(deviceInfo)
      setOpen(false)
    } catch (err) {
      setError(err as string || "Failed to connect to device")
    } finally {
      setIsConnecting(false)
    }
  }

  // Handle removing a paired device
  const handleForgetDevice = async (deviceId: string) => {
    await removeDevice(deviceId)
  }

  // Reset form
  const resetForm = () => {
    setIpAddress("")
    setPort("5555")
    setPairingCode("")
    setDeviceName("")
    setError("")
    setPairingData(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isConnecting && !isPairing && !isGeneratingQR) {
      setOpen(newOpen)
      if (!newOpen) {
        resetForm()
      }
    }
  }

  // Generate QR code when QR tab is activated
  useEffect(() => {
    if (open && activeTab === "qr-code" && !pairingData) {
      generateQRCode()
    }
  }, [open, activeTab, pairingData])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Wireless Device Connection
          </DialogTitle>
          <DialogDescription>
            Connect to an Android device over Wi-Fi using ADB pairing or connect to previously paired devices.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="qr-code" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Pairing
            </TabsTrigger>
            <TabsTrigger value="pairing-code" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Manual Pairing
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Saved Devices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr-code" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">QR Code Pairing</CardTitle>
                <CardDescription>
                  Scan this QR code with your Android device to pair automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isGeneratingQR ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Generating QR code...</span>
                  </div>
                ) : pairingData ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-white rounded-lg">
                      <QRCodeSVG 
                        value={pairingData.qr_data}
                        size={200}
                        level="M"
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Host: {pairingData.ip}:{pairingData.port}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Make sure your Android device is on the same Wi-Fi network
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={generateQRCode}
                      disabled={isGeneratingQR}
                    >
                      Refresh QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8">
                    <Button onClick={generateQRCode} disabled={isGeneratingQR}>
                      Generate QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pairing-code" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manual Pairing</CardTitle>
                <CardDescription>
                  Enter the IP address, port, and 6-digit pairing code from your Android device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="device-name" className="text-right">
                      Device Name
                    </Label>
                    <Input
                      id="device-name"
                      placeholder="My Android Device"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="col-span-3"
                      disabled={isPairing}
                    />
                  </div>
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
                      disabled={isPairing}
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
                      disabled={isPairing}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pairing-code" className="text-right">
                      Pairing Code
                    </Label>
                    <Input
                      id="pairing-code"
                      placeholder="123456"
                      value={pairingCode}
                      onChange={(e) => setPairingCode(e.target.value)}
                      className="col-span-3"
                      disabled={isPairing}
                      maxLength={6}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handlePairDevice} disabled={isPairing}>
                    {isPairing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPairing ? "Pairing..." : "Pair Device"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saved Devices</CardTitle>
                <CardDescription>
                  Quick connect to previously paired devices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pairedDevices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No paired devices found</p>
                    <p className="text-sm">Pair a device using QR code or manual pairing first</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pairedDevices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{device.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {device.pairingMethod}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {device.ip}:{device.port}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last connected: {new Date(device.lastConnected).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleQuickConnect(device)}
                            disabled={isConnecting}
                          >
                            {isConnecting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Connect"
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleForgetDevice(device.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isConnecting || isPairing || isGeneratingQR}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}