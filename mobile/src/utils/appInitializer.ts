import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeTrackingService } from '../services/TimeTrackingService';

export async function initializeApp(): Promise<void> {
  try {
    console.log('🚀 DSA Mobile: Initializing app...');

    // Clean up any orphaned timers
    await TimeTrackingService.cleanupOrphanedTimers();

    // Initialize app-specific settings
    await initializeAppSettings();

    // Clean up old cache data
    await cleanupOldCache();

    console.log('✅ DSA Mobile: App initialized successfully');
  } catch (error) {
    console.error('❌ DSA Mobile: App initialization failed:', error);
  }
}

async function initializeAppSettings(): Promise<void> {
  try {
    // Set default app settings if they don't exist
    const appSettings = await AsyncStorage.getItem('dsa_app_settings');
    
    if (!appSettings) {
      const defaultSettings = {
        theme: 'system', // system, light, dark
        notifications: true,
        analytics: true,
        autoSync: true,
        cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
        initialized: true,
        version: '1.0.0',
      };

      await AsyncStorage.setItem('dsa_app_settings', JSON.stringify(defaultSettings));
      console.log('📱 DSA Mobile: Default app settings initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing app settings:', error);
  }
}

async function cleanupOldCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.includes('_cache_') || key.includes('_temp_'));
    
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    let cleanedCount = 0;

    for (const key of cacheKeys) {
      try {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.timestamp && (now - parsed.timestamp) > maxAge) {
            await AsyncStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        // If we can't parse it, it's probably old/corrupted, remove it
        await AsyncStorage.removeItem(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 DSA Mobile: Cleaned up ${cleanedCount} old cache entries`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up old cache:', error);
  }
}
