/**
 * Global Supabase Health Manager
 * Prevents excessive connection attempts across the entire application
 */

class SupabaseHealthManager {
  private static instance: SupabaseHealthManager;
  private isHealthy: boolean = true;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds
  private consecutiveFailures: number = 0;
  private maxFailures: number = 2;
  private disabledUntil: number = 0;

  private constructor() {}

  static getInstance(): SupabaseHealthManager {
    if (!SupabaseHealthManager.instance) {
      SupabaseHealthManager.instance = new SupabaseHealthManager();
    }
    return SupabaseHealthManager.instance;
  }

  /**
   * Check if Supabase should be used for operations
   */
  shouldUseSupabase(): boolean {
    const now = Date.now();
    
    // If disabled due to consecutive failures, check if cooldown period is over
    if (this.disabledUntil > now) {
      console.log('📱 Supabase temporarily disabled due to connection issues');
      return false;
    }

    // If we recently checked and it was unhealthy, don't retry immediately
    if (!this.isHealthy && (now - this.lastHealthCheck) < this.healthCheckInterval) {
      console.log('📱 Supabase marked as unhealthy, using localStorage fallback');
      return false;
    }

    return true;
  }

  /**
   * Mark a connection attempt as failed
   */
  markConnectionFailed(error: Error): void {
    console.log('❌ Supabase connection failed:', error.message);
    
    this.isHealthy = false;
    this.lastHealthCheck = Date.now();
    this.consecutiveFailures++;

    // If too many consecutive failures, disable for a longer period
    if (this.consecutiveFailures >= this.maxFailures) {
      this.disabledUntil = Date.now() + (5 * 60 * 1000); // 5 minutes
      console.log('🚫 Supabase disabled for 5 minutes due to consecutive failures');
    }
  }

  /**
   * Mark a connection attempt as successful
   */
  markConnectionSuccessful(): void {
    this.isHealthy = true;
    this.lastHealthCheck = Date.now();
    this.consecutiveFailures = 0;
    this.disabledUntil = 0;
    console.log('✅ Supabase connection healthy');
  }

  /**
   * Force disable Supabase for this session
   */
  disableForSession(): void {
    this.isHealthy = false;
    this.disabledUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    console.log('🚫 Supabase disabled for this session');
  }

  /**
   * Get current health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    consecutiveFailures: number;
    disabledUntil: number;
    shouldUse: boolean;
  } {
    return {
      isHealthy: this.isHealthy,
      consecutiveFailures: this.consecutiveFailures,
      disabledUntil: this.disabledUntil,
      shouldUse: this.shouldUseSupabase()
    };
  }

  /**
   * Reset health status (for testing or manual override)
   */
  reset(): void {
    this.isHealthy = true;
    this.lastHealthCheck = 0;
    this.consecutiveFailures = 0;
    this.disabledUntil = 0;
    console.log('🔄 Supabase health status reset');
  }
}

// Export singleton instance
export const supabaseHealthManager = SupabaseHealthManager.getInstance();

/**
 * Wrapper function for Supabase operations with health checking
 */
export const withSupabaseHealthCheck = async <T>(
  operation: () => Promise<T>,
  fallback: () => T,
  operationName: string = 'operation'
): Promise<T> => {
  const healthManager = supabaseHealthManager;

  // Check if we should even attempt Supabase
  if (!healthManager.shouldUseSupabase()) {
    console.log(`📱 Skipping Supabase ${operationName}, using fallback`);
    return fallback();
  }

  try {
    const result = await operation();
    healthManager.markConnectionSuccessful();
    return result;
  } catch (error) {
    healthManager.markConnectionFailed(error as Error);
    console.log(`📱 ${operationName} failed, using fallback:`, (error as Error).message);
    return fallback();
  }
};

/**
 * Quick check if Supabase is configured and healthy
 */
export const isSupabaseAvailable = (): boolean => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isConfigured = supabaseUrl && 
                      supabaseKey && 
                      !supabaseUrl.includes('your_supabase') && 
                      !supabaseKey.includes('your_supabase');

  return isConfigured && supabaseHealthManager.shouldUseSupabase();
};
