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

class SettingsStore {
  private store: Store | null = null;
  private settings: AppSettings = DEFAULT_SETTINGS;
  private errors: SettingsError[] = [];

  async initialize(): Promise<void> {
    try {
      this.store = await Store.load('settings.json', { autoSave: false });
      
      const savedSettings = await this.store.get('app-settings');
      if (savedSettings) {
        const validated = AppSettingsSchema.safeParse(savedSettings);
        if (validated.success) {
          this.settings = validated.data;
        } else {
          console.warn('Invalid settings found, using defaults:', validated.error);
          this.settings = DEFAULT_SETTINGS;
        }
      }
    } catch (error) {
      console.error('Failed to initialize settings store:', error);
      this.settings = DEFAULT_SETTINGS;
    }
  }

  getSettings(): AppSettings {
    return this.settings;
  }

  getErrors(): SettingsError[] {
    return this.errors;
  }

  getCategory<K extends keyof AppSettings>(category: K): AppSettings[K] {
    return this.settings[category];
  }

  getCategoryErrors(category: keyof AppSettings): SettingsError[] {
    return this.errors.filter(e => e.category === category);
  }

  hasCategoryErrors(category: keyof AppSettings): boolean {
    return this.errors.some(e => e.category === category);
  }

  getFieldError(category: keyof AppSettings, field: string): string | null {
    return this.errors.find(e => e.category === category && e.field === field)?.message || null;
  }

  validateField<K extends keyof AppSettings>(
    category: K,
    field: keyof AppSettings[K],
    value: any
  ): ValidationResult {
    try {
      const categorySchema = AppSettingsSchema.shape[category];
      const currentCategorySettings = this.settings[category];
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
  }

  async updateSettings<K extends keyof AppSettings>(
    category: K,
    updates: Partial<AppSettings[K]>
  ): Promise<UpdateResult> {
    if (!this.store) return { success: false, error: 'Store not initialized' };

    try {
      const categorySchema = AppSettingsSchema.shape[category];
      const currentCategorySettings = this.settings[category];
      const newCategorySettings = { ...currentCategorySettings, ...updates };
      
      const validationResult = categorySchema.safeParse(newCategorySettings);
      
      if (!validationResult.success) {
        const validationErrors: SettingsError[] = validationResult.error.issues.map((err: any) => ({
          category,
          field: err.path.join('.'),
          message: err.message
        }));
        
        this.errors = [
          ...this.errors.filter(e => e.category !== category),
          ...validationErrors
        ];
        
        return { success: false, error: 'Validation failed', details: validationErrors };
      }

      this.errors = this.errors.filter(e => e.category !== category);

      this.settings = {
        ...this.settings,
        [category]: validationResult.data
      };
      
      await this.store.set('app-settings', this.settings);
      await this.store.save();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update settings:', error);
      return { success: false, error: 'Failed to save settings' };
    }
  }

  async resetToDefaults(): Promise<UpdateResult> {
    if (!this.store) return { success: false, error: 'Store not initialized' };
    
    try {
      this.settings = DEFAULT_SETTINGS;
      this.errors = [];
      await this.store.set('app-settings', DEFAULT_SETTINGS);
      await this.store.save();
      return { success: true };
    } catch (error) {
      console.error('Failed to reset settings:', error);
      return { success: false, error: 'Failed to reset settings' };
    }
  }
}

export const settingsStore = new SettingsStore();