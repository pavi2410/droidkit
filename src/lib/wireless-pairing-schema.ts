import { z } from "zod"

export const WirelessPairingSchema = z.object({
  deviceName: z.string().optional(),
  ipAddress: z.ipv4(),
  port: z.coerce.number()
    .int("Port must be an integer")
    .min(1, "Port must be at least 1")
    .max(65535, "Port must be at most 65535"),
  pairingCode: z.string().length(6, "Pairing code must be 6 digits")
})

export type WirelessPairingForm = z.infer<typeof WirelessPairingSchema>