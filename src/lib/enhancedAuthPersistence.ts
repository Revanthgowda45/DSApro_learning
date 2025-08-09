/**
 * Enhanced Authentication Persistence for DSAproject
 * Based on CityFix's robust session management approach
 * Ensures seamless page reloads with instant UI response
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { User } from '../services/supabaseAuthService';
import { supabaseHealthManager } from '../utils/supabaseHealthManager';
import { shouldUseOfflineMode } from '../utils/productionOptimizer';
import { clearAllAppCookies } from './storageUtils';

// Storage keys for multi-layer persistence
const SESSION_STORAGE_KEY = 'dsa-session-active';
const USER_ID_COOKIE_KEY = 'dsa-user-id';
const AUTH_STATE_COOKIE_KEY = 'dsa-auth-state';
const USER_DATA_STORAGE_KEY = 'dsa_user';
const SESSION_TIMESTAMP_KEY = 'dsa-session-timestamp';

// Cookie helper functions (enhanced from CityFix)
export const setCookie = (name: string, value: string, days = 30) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax;Secure=${location.protocol === 'https:'}`;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax`;
};

/**
 * Enhanced session validation with multiple checks
 */
export const hasActiveSession = (): boolean => {
  try {
    // Check multiple indicators for robust session detection
    const hasLocalStorage = localStorage.getItem(USER_DATA_STORAGE_KEY) !== null;
    const hasSessionStorage = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
    const hasUserCookie = getCookie(USER_ID_COOKIE_KEY) !== null;
    const hasAuthCookie = getCookie(AUTH_STATE_COOKIE_KEY) === 'authenticated';
    
    // Check session timestamp (expire after 7 days)
    const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
    const isSessionFresh = timestamp ? (Date.now() - parseInt(timestamp)) < (7 * 24 * 60 * 60 * 1000) : false;
    
    console.log('📊 Session check:', {
      hasLocalStorage,
      hasSessionStorage,
      hasUserCookie,
      hasAuthCookie,
      isSessionFresh
    });
    
    // Session is active if we have localStorage data and at least one other indicator
    return hasLocalStorage && isSessionFresh && (hasSessionStorage || hasUserCookie || hasAuthCookie);
  } catch (error) {
    console.warn('⚠️ Error checking session:', error);
    return false;
  }
};

/**
 * Get cached user data for instant UI response
 */
export const getCachedUserData = (): User | null => {
  try {
    const userData = localStorage.getItem(USER_DATA_STORAGE_KEY);
    if (userData) {
      const user = JSON.parse(userData);
      if (user && user.id && user.email) {
        console.log('✅ Found cached user data:', user.email);
        return user;
      }
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Error getting cached user data:', error);
    return null;
  }
};

/**
 * Store user data with multi-layer persistence
 */
export const storeUserData = (user: User): void => {
  try {
    const timestamp = Date.now().toString();
    
    // Store in localStorage
    localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_TIMESTAMP_KEY, timestamp);
    
    // Store in sessionStorage for tab-specific tracking
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    
    // Store in cookies for cross-tab and API requests
    setCookie(USER_ID_COOKIE_KEY, user.id, 7);
    setCookie(AUTH_STATE_COOKIE_KEY, 'authenticated', 7);
    
    console.log('✅ User data stored with multi-layer persistence');
  } catch (error) {
    console.error('❌ Error storing user data:', error);
  }
};

/**
 * Clear all authentication persistence data
 */
export const clearAuthPersistence = (): void => {
  try {
    console.log('🧹 Starting comprehensive logout cleanup...');
    
    // Clear localStorage - all auth related data
    localStorage.removeItem(USER_DATA_STORAGE_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
    localStorage.removeItem('dsa_offline_mode');
    localStorage.removeItem('dsa_production_optimized');
    
    // Clear additional localStorage items that might contain user data
    localStorage.removeItem('dsa_user');
    localStorage.removeItem('dsa-user-data');
    localStorage.removeItem('user_preferences');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('session_data');
    
    // Clear sessionStorage
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem('dsa-session');
    sessionStorage.removeItem('user_session');
    sessionStorage.removeItem('auth_session');
    
    // Clear all application cookies comprehensively
    clearAllAppCookies();
    
    // Also clear individual cookies as fallback
    deleteCookie(USER_ID_COOKIE_KEY);
    deleteCookie(AUTH_STATE_COOKIE_KEY);
    deleteCookie('auth_session');
    
    console.log('✅ Comprehensive logout cleanup completed - all cookies and storage cleared');
  } catch (error) {
    console.error('❌ Error clearing auth persistence:', error);
  }
};

/**
 * Initialize authentication persistence - call once at app startup
 * This is the main function that ensures session survives page reloads
 */
export const initAuthPersistence = async (): Promise<User | null> => {
  console.log('🚀 Initializing enhanced auth persistence...');
  
  try {
    // First check if we're in offline mode
    if (shouldUseOfflineMode()) {
      console.log('📱 Offline mode detected - using cached data only');
      return getCachedUserData();
    }
    
    // Check if we have cached data for instant response
    const cachedUser = getCachedUserData();
    if (cachedUser && hasActiveSession()) {
      console.log('⚡ Using cached user data for instant response');
      // Still return cached data, but we'll validate in background
    }
    
    // Only attempt Supabase if configured and healthy
    if (!isSupabaseConfigured() || !supabaseHealthManager.shouldUseSupabase() || !supabase) {
      console.log('📱 Supabase not available - using cached data only');
      return cachedUser;
    }
    
    // Attempt to restore session from Supabase
    console.log('🔄 Checking Supabase session...');
    const { data, error } = await supabase!.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting Supabase session:', error);
      supabaseHealthManager.markConnectionFailed(error);
      return cachedUser; // Fallback to cached data
    }
    
    if (data?.session?.user) {
      console.log('✅ Active Supabase session found:', data.session.user.email);
      supabaseHealthManager.markConnectionSuccessful();
      
      try {
        // Try to get additional user data from profiles table
        const { data: profile } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        const userData: User = {
          id: data.session.user.id,
          email: data.session.user.email!,
          username: profile?.username || data.session.user.email?.split('@')[0] || 'user',
          full_name: profile?.full_name || profile?.username || data.session.user.email?.split('@')[0] || 'User',
          avatar_url: profile?.avatar_url || null,
          learning_pace: profile?.learning_pace || 'medium',
          daily_time_limit: profile?.daily_time_limit || 120,
          difficulty_preferences: profile?.difficulty_preferences || ['Easy', 'Medium'],
          adaptive_difficulty: profile?.adaptive_difficulty ?? true,
          created_at: profile?.created_at || new Date().toISOString(),
          updated_at: profile?.updated_at || new Date().toISOString()
        };
        
        // Store with multi-layer persistence
        storeUserData(userData);
        
        return userData;
      } catch (profileError) {
        console.warn('⚠️ Error fetching profile, using basic user data:', profileError);
        
        // Create basic user data from session
        const basicUserData: User = {
          id: data.session.user.id,
          email: data.session.user.email!,
          username: data.session.user.email?.split('@')[0] || 'user',
          full_name: data.session.user.email?.split('@')[0] || 'User',
          avatar_url: null,
          learning_pace: 'medium',
          daily_time_limit: 120,
          difficulty_preferences: ['Easy', 'Medium'],
          adaptive_difficulty: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        storeUserData(basicUserData);
        return basicUserData;
      }
    } else {
      console.log('ℹ️ No active Supabase session found');
      
      // If we have cached data but no Supabase session, keep using cached data
      // This handles cases where Supabase is temporarily unavailable
      if (cachedUser && hasActiveSession()) {
        console.log('📱 Keeping cached session (Supabase unavailable)');
        return cachedUser;
      }
      
      // No session anywhere - clear everything
      clearAuthPersistence();
      return null;
    }
  } catch (error) {
    console.error('❌ Error initializing auth persistence:', error);
    supabaseHealthManager.markConnectionFailed(error as Error);
    
    // Fallback to cached data if available
    const cachedUser = getCachedUserData();
    if (cachedUser && hasActiveSession()) {
      console.log('📱 Using cached data as fallback');
      return cachedUser;
    }
    
    clearAuthPersistence();
    return null;
  }
};

/**
 * Refresh user session in background (non-blocking)
 */
export const refreshUserSession = async (): Promise<void> => {
  try {
    if (!isSupabaseConfigured() || !supabaseHealthManager.shouldUseSupabase()) {
      console.log('📱 Skipping session refresh - Supabase not available');
      return;
    }
    
    const { data, error } = await supabase!.auth.refreshSession();
    
    if (error) {
      console.warn('⚠️ Session refresh failed:', error);
      supabaseHealthManager.markConnectionFailed(error);
      return;
    }
    
    if (data?.session?.user) {
      console.log('✅ Session refreshed successfully');
      supabaseHealthManager.markConnectionSuccessful();
    }
  } catch (error) {
    console.warn('⚠️ Error refreshing session:', error);
    supabaseHealthManager.markConnectionFailed(error as Error);
  }
};

/**
 * Validate current session (for periodic checks)
 */
export const validateSession = async (): Promise<boolean> => {
  try {
    if (!hasActiveSession()) {
      return false;
    }
    
    if (!isSupabaseConfigured() || !supabaseHealthManager.shouldUseSupabase()) {
      // If Supabase is not available but we have cached data, consider it valid
      return getCachedUserData() !== null;
    }
    
    const { data, error } = await supabase!.auth.getUser();
    
    if (error || !data?.user) {
      console.log('ℹ️ Session validation failed');
      return false;
    }
    
    console.log('✅ Session validation successful');
    supabaseHealthManager.markConnectionSuccessful();
    return true;
  } catch (error) {
    console.warn('⚠️ Error validating session:', error);
    supabaseHealthManager.markConnectionFailed(error as Error);
    return getCachedUserData() !== null; // Fallback to cached data
  }
};
