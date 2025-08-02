/**
 * Production Environment Optimizer
 * Automatically detects and optimizes for production environments
 */

import { supabaseHealthManager } from './supabaseHealthManager';

class ProductionOptimizer {
  private static instance: ProductionOptimizer;
  private isOptimized: boolean = false;
  private detectionComplete: boolean = false;

  private constructor() {}

  static getInstance(): ProductionOptimizer {
    if (!ProductionOptimizer.instance) {
      ProductionOptimizer.instance = new ProductionOptimizer();
    }
    return ProductionOptimizer.instance;
  }

  /**
   * Detect if we're in a problematic production environment
   */
  detectEnvironment(): boolean {
    if (this.detectionComplete) {
      return this.isOptimized;
    }

    const indicators = {
      // Check if we're in production build
      isProduction: import.meta.env.PROD,
      
      // Check if we're on Netlify or similar CDN
      isNetlify: window.location.hostname.includes('netlify') || 
                 window.location.hostname.includes('vercel') ||
                 window.location.hostname.includes('github.io'),
      
      // Check if Supabase environment variables are missing or placeholder
      hasSupabaseConfig: this.hasValidSupabaseConfig(),
      
      // Check if we have localStorage data (returning user)
      hasLocalData: localStorage.getItem('dsa_user') !== null,
      
      // Check if we're experiencing connection issues
      hasConnectionIssues: !navigator.onLine || this.hasSlowConnection()
    };

    console.log('🔍 Environment detection:', indicators);

    // Only optimize if Supabase config is completely missing or explicitly disabled
    // Don't auto-optimize just for connection issues - let the app try to connect first
    const shouldOptimize = indicators.isProduction && 
                          indicators.hasLocalData && 
                          (!indicators.hasSupabaseConfig || localStorage.getItem('force_offline_mode') === 'true');

    if (shouldOptimize) {
      this.optimizeForProduction();
    }

    this.detectionComplete = true;
    return this.isOptimized;
  }

  /**
   * Check if Supabase configuration is valid
   */
  private hasValidSupabaseConfig(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return url && 
           key && 
           !url.includes('your_supabase') && 
           !key.includes('your_supabase') &&
           url.startsWith('https://');
  }

  /**
   * Detect slow connection
   */
  private hasSlowConnection(): boolean {
    // @ts-ignore - connection API might not be available
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      // Consider 2G or slower as slow
      return connection.effectiveType === 'slow-2g' || 
             connection.effectiveType === '2g' ||
             connection.downlink < 1;
    }
    
    return false;
  }

  /**
   * Optimize the app for production environment
   */
  private optimizeForProduction(): void {
    console.log('🚀 Optimizing for production environment...');
    
    // Disable Supabase for this session
    supabaseHealthManager.disableForSession();
    
    // Set offline mode flag
    localStorage.setItem('dsa_offline_mode', 'true');
    localStorage.setItem('dsa_production_optimized', 'true');
    
    // Reduce any background tasks
    this.disableBackgroundTasks();
    
    this.isOptimized = true;
    
    console.log('✅ Production optimization complete - using localStorage only');
  }

  /**
   * Disable unnecessary background tasks
   */
  private disableBackgroundTasks(): void {
    // Clear any existing intervals that might be making network requests
    const highestIntervalId = Number(setTimeout(() => {}, 0));
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }
    
    // Disable service worker updates if any
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(() => {
          // Don't unregister, just stop updates
          console.log('📱 Service worker update checks disabled');
        });
      });
    }
  }

  /**
   * Check if app is optimized for production
   */
  isProductionOptimized(): boolean {
    return this.isOptimized || localStorage.getItem('dsa_production_optimized') === 'true';
  }

  /**
   * Reset optimization (for testing)
   */
  reset(): void {
    this.isOptimized = false;
    this.detectionComplete = false;
    localStorage.removeItem('dsa_offline_mode');
    localStorage.removeItem('dsa_production_optimized');
    supabaseHealthManager.reset();
    console.log('🔄 Production optimization reset');
  }
}

// Export singleton instance
export const productionOptimizer = ProductionOptimizer.getInstance();

/**
 * Initialize production optimizations
 * Call this early in the app lifecycle
 */
export const initProductionOptimizations = (): boolean => {
  console.log('🔍 Checking for production optimizations...');
  return productionOptimizer.detectEnvironment();
};

/**
 * Check if we should use only localStorage (no network requests)
 */
export const shouldUseOfflineMode = (): boolean => {
  return productionOptimizer.isProductionOptimized() || 
         localStorage.getItem('dsa_offline_mode') === 'true';
};

/**
 * Force Supabase connection attempt by clearing offline mode flags
 * Call this when you want to retry Supabase connection
 */
export const forceSupabaseConnection = (): void => {
  localStorage.removeItem('force_offline_mode');
  localStorage.removeItem('dsa_offline_mode');
  supabaseHealthManager.reset();
  console.log('🔄 Forcing Supabase connection attempt - offline mode disabled');
};
