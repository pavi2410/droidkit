import { useState, useEffect, useCallback } from 'react';
import { Store } from '@tauri-apps/plugin-store';
import { AppSettings, AppSettingsSchema, DEFAULT_SETTINGS } from '@/lib/settings-schema';

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
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<SettingsError[]>([]);
  const [store, setStore] = useState<Store | null>(null);

  // Initialize store and load settings
  useEffect(() => {
    async function initStore() {
      try {
        const storeInstance = await Store.load('settings.json', { autoSave: false });
        setStore(storeInstance);
        
        const savedSettings = await storeInstance.get('app-settings');
        if (savedSettings) {
          // Validate and merge with defaults
          const validated = AppSettingsSchema.safeParse(savedSettings);
          if (validated.success) {
            setSettings(validated.data);
          } else {
            console.warn('Invalid settings found, using defaults:', validated.error);
            setSettings(DEFAULT_SETTINGS);
          }
        }
      } catch (error) {
        console.error('Failed to initialize settings store:', error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    }
    initStore();
  }, []);

  // Update specific setting category with validation
  const updateSettings = useCallback(async <K extends keyof AppSettings>(
    category: K,
    updates: Partial<AppSettings[K]>
  ): Promise<UpdateResult> => {
    if (!store) return { success: false, error: 'Store not initialized' };

    try {
      // Get the schema for this category
      const categorySchema = AppSettingsSchema.shape[category];
      const currentCategorySettings = settings[category];
      const newCategorySettings = { ...currentCategorySettings, ...updates };
      
      // Validate the updated category
      const validationResult = categorySchema.safeParse(newCategorySettings);
      
      if (!validationResult.success) {
        const validationErrors: SettingsError[] = validationResult.error.issues.map((err: any) => ({
          category,
          field: err.path.join('.'),
          message: err.message
        }));
        
        setErrors(prev => [
          ...prev.filter(e => e.category !== category),
          ...validationErrors
        ]);
        
        return { success: false, error: 'Validation failed', details: validationErrors };
      }

      // Clear any previous errors for this category
      setErrors(prev => prev.filter(e => e.category !== category));

      // Update settings state
      const newSettings = {
        ...settings,
        [category]: validationResult.data
      };
      
      setSettings(newSettings);
      
      // Persist to store
      await store.set('app-settings', newSettings);
      await store.save();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update settings:', error);
      return { success: false, error: 'Failed to save settings' };
    }
  }, [store, settings]);

  // Validate specific field
  const validateField = useCallback(<K extends keyof AppSettings>(
    category: K,
    field: keyof AppSettings[K],
    value: any
  ): ValidationResult => {
    try {
      const categorySchema = AppSettingsSchema.shape[category];
      // For field validation, we'll validate the entire category object
      const currentCategorySettings = settings[category];
      const newCategorySettings = { ...currentCategorySettings, [field]: value };
      
      const result = categorySchema.safeParse(newCategorySettings);
      if (result.success) {
        return { isValid: true, error: null };
      } else {
        const fieldError = result.error.issues.find((err: any) => err.path.includes(field as string));
        return {
          isValid: false,
          error: fieldError?.message || 'Validation error'
        };
      }
    } catch {
      return { isValid: false, error: 'Unknown validation error' };
    }
  }, [settings]);

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<UpdateResult> => {
    if (!store) return { success: false, error: 'Store not initialized' };
    
    try {
      setSettings(DEFAULT_SETTINGS);
      setErrors([]);
      await store.set('app-settings', DEFAULT_SETTINGS);
      await store.save();
      return { success: true };
    } catch (error) {
      console.error('Failed to reset settings:', error);
      return { success: false, error: 'Failed to reset settings' };
    }
  }, [store]);

  // Get specific category
  const getCategory = useCallback(<K extends keyof AppSettings>(category: K): AppSettings[K] => {
    return settings[category];
  }, [settings]);

  // Get errors for a specific category
  const getCategoryErrors = useCallback((category: keyof AppSettings) => {
    return errors.filter(e => e.category === category);
  }, [errors]);

  // Check if category has errors
  const hasCategoryErrors = useCallback((category: keyof AppSettings) => {
    return errors.some(e => e.category === category);
  }, [errors]);

  // Get field error
  const getFieldError = useCallback((category: keyof AppSettings, field: string) => {
    return errors.find(e => e.category === category && e.field === field)?.message || null;
  }, [errors]);

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