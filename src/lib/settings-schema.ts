import { z } from 'zod';

export const AppearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system')
});

export const AndroidSchema = z.object({
  sdkPath: z.string().default(''),
  avdRefreshInterval: z.number().min(10).max(300).default(30)
});

export const DevicesSchema = z.object({
  pollingInterval: z.number().min(1).max(10).default(3),
  autoRefresh: z.boolean().default(true),
  connectionTimeout: z.number().min(1000).max(30000).default(5000),
  autoReconnectPaired: z.boolean().default(false),
  autoDiscoverUSB: z.boolean().default(true),
  autoDiscoverWireless: z.boolean().default(false),
  wirelessDiscoveryInterval: z.number().min(10).max(300).default(30),
  showUnpairedDevices: z.boolean().default(true)
});

export const FilesSchema = z.object({
  downloadPath: z.string().default(''),
  showHidden: z.boolean().default(false),
  transferChunkSize: z.number().min(512).max(10240).default(1024)
});

export const LogcatSchema = z.object({
  defaultLevel: z.enum(['verbose', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  bufferSize: z.number().min(100).max(10000).default(1000),
  autoScroll: z.boolean().default(true)
});

export const AppSettingsSchema = z.object({
  appearance: AppearanceSchema,
  android: AndroidSchema,
  devices: DevicesSchema,
  files: FilesSchema,
  logcat: LogcatSchema
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const DEFAULT_SETTINGS: AppSettings = AppSettingsSchema.parse({
  appearance: {},
  android: {},
  devices: {},
  files: {},
  logcat: {}
});