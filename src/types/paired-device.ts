export interface PairedDevice {
  id: string
  name: string
  ip: string
  port: number
  lastConnected: number // timestamp
  pairingMethod: 'qr-code' | 'pairing-code'
}

export interface PairingSession {
  ip: string
  port: number
  expiresAt: number // timestamp
}