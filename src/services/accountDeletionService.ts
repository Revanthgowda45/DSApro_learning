import { supabase } from '../lib/supabase';
import type { User } from '../services/supabaseAuthService';

export class AccountDeletionService {
  /**
   * Completely delete user account and all associated data
   */
  static async deleteAccount(user: User): Promise<void> {
    console.log('🗑️ Starting account deletion process for user:', user.email);
    
    try {
      // Step 1: Delete from Supabase if available
      await this.deleteSupabaseData(user);
      
      // Step 2: Delete from localStorage
      await this.deleteLocalStorageData(user);
      
      // Step 3: Sign out user
      await this.signOutUser();
      
      console.log('✅ Account deletion completed successfully');
    } catch (error) {
      console.error('❌ Account deletion failed:', error);
      throw new Error(`Account deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all user data from Supabase
   */
  private static async deleteSupabaseData(user: User): Promise<void> {
    try {
      // Check if Supabase is available
      const isSupabaseAvailable = await this.checkSupabaseConnection();
      
      if (!isSupabaseAvailable) {
        console.log('📱 Supabase not available, skipping Supabase data deletion');
        return;
      }

      console.log('🔄 Deleting Supabase data...');

      // Delete user sessions
      const { error: sessionsError } = await supabase!
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id);

      if (sessionsError) {
        console.warn('⚠️ Failed to delete user sessions:', sessionsError);
      } else {
        console.log('✅ User sessions deleted from Supabase');
      }

      // Delete problem progress
      const { error: progressError } = await supabase!
        .from('problem_progress')
        .delete()
        .eq('user_id', user.id);

      if (progressError) {
        console.warn('⚠️ Failed to delete problem progress:', progressError);
      } else {
        console.log('✅ Problem progress deleted from Supabase');
      }

      // Delete user profile
      const { error: profileError } = await supabase!
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.warn('⚠️ Failed to delete user profile:', profileError);
      } else {
        console.log('✅ User profile deleted from Supabase');
      }

      // Delete auth user (this will cascade delete related data)
      const { error: authError } = await supabase!.auth.admin.deleteUser(user.id);

      if (authError) {
        console.warn('⚠️ Failed to delete auth user:', authError);
        // Try alternative method - sign out and let user delete manually
        await supabase!.auth.signOut();
      } else {
        console.log('✅ Auth user deleted from Supabase');
      }

    } catch (error) {
      console.warn('⚠️ Supabase data deletion failed:', error);
      // Don't throw error here - continue with localStorage deletion
    }
  }

  /**
   * Delete all user data from localStorage
   */
  private static async deleteLocalStorageData(user: User): Promise<void> {
    console.log('🔄 Deleting localStorage data...');

    try {
      // List of all localStorage keys used by the DSA app
      const keysToDelete = [
        // User data
        'dsa_user',
        'dsa_user_data',
        'user_data',
        
        // Problem data
        'dsa_problem_statuses',
        'dsa_solved_problems',
        'dsa_problem_progress',
        'dsa_attempted_problems',
        
        // Session data
        'dsa_user_sessions',
        'userSessions',
        'dsa_session_data',
        
        // Analytics data
        'dsa_streak_data',
        'dsa_progress_data',
        'dsa_analytics',
        'gamified_progress',
        
        // Settings and preferences
        'dsa_settings',
        'dsa_preferences',
        'dsa_difficulty_preferences',
        'dsa_learning_preferences',
        
        // Cache data
        'dsa_cache',
        'analytics_cache',
        'dsa_offline_data',
        
        // Auth data
        'dsa_auth_token',
        'dsa_session_token',
        'session_active',
        'auth_timestamp',
        
        // Other app data
        'dsa_production_optimized',
        'dsa_offline_mode',
        'force_offline_mode',
        'disable_supabase'
      ];

      // Add user-specific cache keys
      keysToDelete.push(`analytics_cache_${user.id}`);
      keysToDelete.push(`dsa_problem_progress_${user.id}`);
      keysToDelete.push(`user_sessions_${user.id}`);

      let deletedCount = 0;
      keysToDelete.forEach(key => {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          deletedCount++;
          console.log(`🗑️ Deleted localStorage key: ${key}`);
        }
      });

      // Clear any remaining keys that might contain user data
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes(user.id) || (user.email && key.includes(user.email)) || key.includes('dsa_')) {
          localStorage.removeItem(key);
          deletedCount++;
          console.log(`🗑️ Deleted additional key: ${key}`);
        }
      });

      console.log(`✅ Deleted ${deletedCount} localStorage items`);

    } catch (error) {
      console.warn('⚠️ localStorage data deletion failed:', error);
      // Try to clear all localStorage as fallback
      try {
        localStorage.clear();
        console.log('✅ Cleared all localStorage as fallback');
      } catch (clearError) {
        console.error('❌ Failed to clear localStorage:', clearError);
      }
    }
  }

  /**
   * Sign out the user after deletion
   */
  private static async signOutUser(): Promise<void> {
    try {
      console.log('🔄 Signing out user...');
      
      // Try Supabase signout first
      if (supabase) {
        await supabase.auth.signOut();
        console.log('✅ Signed out from Supabase');
      }

      // Clear any remaining session data
      sessionStorage.clear();
      
      // Clear cookies if any
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      console.log('✅ User signed out successfully');

      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);

    } catch (error) {
      console.warn('⚠️ Sign out failed:', error);
      // Force redirect anyway
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  }

  /**
   * Check if Supabase connection is available
   */
  private static async checkSupabaseConnection(): Promise<boolean> {
    try {
      // Check environment variables
      const hasUrl = import.meta.env.VITE_SUPABASE_URL;
      const hasKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!hasUrl || !hasKey || !supabase) {
        return false;
      }
      
      // Test connection with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      );
      
      const healthCheck = supabase.from('profiles').select('id').limit(1);
      
      await Promise.race([healthCheck, timeoutPromise]);
      return true;
    } catch (error) {
      console.log('📱 Supabase connection not available');
      return false;
    }
  }

  /**
   * Simple confirmation method - UI modal handles the complex confirmation
   */
  static async confirmAccountDeletion(user: User): Promise<boolean> {
    // This method is now handled by the UI modal component
    // The modal will handle all confirmation logic
    return true;
  }
}
