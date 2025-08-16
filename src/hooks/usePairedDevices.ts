import { useState, useEffect, useCallback } from 'react';
import { pairedDevicesStore } from '@/store/paired-devices-store';
import { PairedDevice } from '@/types/paired-device';

export function usePairedDevices() {
  const [devices, setDevices] = useState<PairedDevice[]>(pairedDevicesStore.getDevices());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeStore() {
      await pairedDevicesStore.initialize();
      setDevices(pairedDevicesStore.getDevices());
      setIsLoading(false);
    }
    initializeStore();
  }, []);

  const addDevice = useCallback(async (device: Omit<PairedDevice, 'id' | 'lastConnected'>): Promise<PairedDevice | null> => {
    const result = await pairedDevicesStore.addDevice(device);
    setDevices(pairedDevicesStore.getDevices());
    return result;
  }, []);

  const updateDevice = useCallback(async (id: string, updates: Partial<PairedDevice>): Promise<PairedDevice | null> => {
    const result = await pairedDevicesStore.updateDevice(id, updates);
    setDevices(pairedDevicesStore.getDevices());
    return result;
  }, []);

  const removeDevice = useCallback(async (id: string): Promise<boolean> => {
    const result = await pairedDevicesStore.removeDevice(id);
    setDevices(pairedDevicesStore.getDevices());
    return result;
  }, []);

  const updateLastConnected = useCallback(async (id: string): Promise<boolean> => {
    const result = await pairedDevicesStore.updateLastConnected(id);
    setDevices(pairedDevicesStore.getDevices());
    return result;
  }, []);

  const getDeviceByAddress = useCallback((ip: string, port: number): PairedDevice | undefined => {
    return pairedDevicesStore.getDeviceByAddress(ip, port);
  }, []);

  return {
    devices,
    isLoading,
    addDevice,
    updateDevice,
    removeDevice,
    updateLastConnected,
    getDeviceByAddress
  };
}