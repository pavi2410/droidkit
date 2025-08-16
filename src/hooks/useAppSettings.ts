import { useState, useEffect, useCallback } from 'react';
import { settingsStore } from '@/store/settings-store';
import { AppSettings } from '@/lib/settings-schema';

interface SettingsError {
  category: keyof AppSettings;
  field: string;
  message: string;
}

interface UpdateResult {
  success: boolean;
  error?: string;
  details?: SettingsError[];
}

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(settingsStore.getSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<SettingsError[]>(settingsStore.getErrors());

  useEffect(() => {
    async function initializeStore() {
      await settingsStore.initialize();
      setSettings(settingsStore.getSettings());
      setErrors(settingsStore.getErrors());
      setIsLoading(false);
    }
    initializeStore();
  }, []);

  const updateSettings = useCallback(async <K extends keyof AppSettings>(
    category: K,
    updates: Partial<AppSettings[K]>
  ): Promise<UpdateResult> => {
    const result = await settingsStore.updateSettings(category, updates);
    setSettings(settingsStore.getSettings());
    setErrors(settingsStore.getErrors());
    return result;
  }, []);

  const validateField = useCallback(<K extends keyof AppSettings>(
    category: K,
    field: keyof AppSettings[K],
    value: any
  ): ValidationResult => {
    return settingsStore.validateField(category, field, value);
  }, []);

  const resetToDefaults = useCallback(async (): Promise<UpdateResult> => {
    const result = await settingsStore.resetToDefaults();
    setSettings(settingsStore.getSettings());
    setErrors(settingsStore.getErrors());
    return result;
  }, []);

  const getCategory = useCallback(<K extends keyof AppSettings>(category: K): AppSettings[K] => {
    return settingsStore.getCategory(category);
  }, []);

  const getCategoryErrors = useCallback((category: keyof AppSettings) => {
    return settingsStore.getCategoryErrors(category);
  }, []);

  const hasCategoryErrors = useCallback((category: keyof AppSettings) => {
    return settingsStore.hasCategoryErrors(category);
  }, []);

  const getFieldError = useCallback((category: keyof AppSettings, field: string) => {
    return settingsStore.getFieldError(category, field);
  }, []);

  return {
    settings,
    isLoading,
    errors,
    updateSettings,
    validateField,
    resetToDefaults,
    getCategory,
    getCategoryErrors,
    hasCategoryErrors,
    getFieldError
  };
}