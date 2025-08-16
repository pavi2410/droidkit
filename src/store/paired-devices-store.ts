import { Store } from '@tauri-apps/plugin-store';
import { PairedDevice } from '@/types/paired-device';

class PairedDevicesStore {
  private store: Store | null = null;
  private devices: PairedDevice[] = [];

  async initialize(): Promise<void> {
    try {
      this.store = await Store.load('paired-devices.json', { autoSave: false });
      
      const savedDevices = await this.store.get('devices');
      if (savedDevices && Array.isArray(savedDevices)) {
        this.devices = savedDevices as PairedDevice[];
      }
    } catch (error) {
      console.error('Failed to initialize paired devices store:', error);
      this.devices = [];
    }
  }

  getDevices(): PairedDevice[] {
    return this.devices;
  }

  getDeviceByAddress(ip: string, port: number): PairedDevice | undefined {
    return this.devices.find(d => d.ip === ip && d.port === port);
  }

  private async saveDevices(newDevices: PairedDevice[]): Promise<boolean> {
    if (!this.store) return false;
    
    try {
      await this.store.set('devices', newDevices);
      await this.store.save();
      this.devices = newDevices;
      return true;
    } catch (error) {
      console.error('Failed to save paired devices:', error);
      return false;
    }
  }

  async addDevice(device: Omit<PairedDevice, 'id' | 'lastConnected'>): Promise<PairedDevice | null> {
    const newDevice: PairedDevice = {
      ...device,
      id: crypto.randomUUID(),
      lastConnected: Date.now()
    };

    const existingDevice = this.devices.find(d => d.ip === device.ip && d.port === device.port);
    if (existingDevice) {
      return this.updateDevice(existingDevice.id, { 
        name: device.name, 
        pairingMethod: device.pairingMethod,
        lastConnected: Date.now() 
      });
    }

    const newDevices = [...this.devices, newDevice];
    const saved = await this.saveDevices(newDevices);
    
    return saved ? newDevice : null;
  }

  async updateDevice(id: string, updates: Partial<PairedDevice>): Promise<PairedDevice | null> {
    const deviceIndex = this.devices.findIndex(d => d.id === id);
    if (deviceIndex === -1) return null;

    const updatedDevice = { ...this.devices[deviceIndex], ...updates };
    const newDevices = [...this.devices];
    newDevices[deviceIndex] = updatedDevice;

    const saved = await this.saveDevices(newDevices);
    
    return saved ? updatedDevice : null;
  }

  async removeDevice(id: string): Promise<boolean> {
    const newDevices = this.devices.filter(d => d.id !== id);
    return this.saveDevices(newDevices);
  }

  async updateLastConnected(id: string): Promise<boolean> {
    return !!(await this.updateDevice(id, { lastConnected: Date.now() }));
  }
}

export const pairedDevicesStore = new PairedDevicesStore();