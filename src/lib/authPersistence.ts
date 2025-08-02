import { supabase } from './supabase';
import { safeGetItem, safeSetItem, setCookie, getCookie, deleteCookie } from './storageUtils';

/**
 * Enhanced authentication persistence utility for DSA Project
 * Based on CityFixApp's robust authentication system
 * Ensures smooth page reloads and session management
 */

// Keys used for storing session information
const SESSION_STORAGE_KEY = 'dsa-session-active';
const USER_ID_COOKIE_KEY = 'dsa-user-id';
const AUTH_STATE_COOKIE_KEY = 'dsa-auth-state';
const USER_DATA_STORAGE_KEY = 'dsa_user';

/**
 * Initializes authentication persistence to ensure session isn't lost on reload
 */
export const initAuthPersistence = async () => {
  console.log('🔄 Initializing DSA auth persistence...');
  
  try {
    // Check if Supabase is configured
    const isSupabaseConfigured = !!(
      import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    if (!isSupabaseConfigured) {
      console.log('📱 Supabase not configured, using local authentication only');
      return checkLocalSession();
    }

    // Attempt to restore session from Supabase storage
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
      clearAuthPersistence();
      return checkLocalSession();
    }
    
    if (data?.session?.user) {
      console.log('✅ Supabase session found, user:', data.session.user.email);
      
      // Store session markers for redundant auth checks
      localStorage.setItem(SESSION_STORAGE_KEY, 'true');
      setCookie(USER_ID_COOKIE_KEY, data.session.user.id, 30);
      setCookie(AUTH_STATE_COOKIE_KEY, 'authenticated', 30);
      
      // Try to get user profile data
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        const userData = {
          id: data.session.user.id,
          email: data.session.user.email,
          username: profile?.username || data.session.user.email?.split('@')[0] || 'User',
          full_name: profile?.full_name || profile?.username || data.session.user.email?.split('@')[0] || 'User',
          avatar_url: profile?.avatar_url,
          learning_pace: profile?.learning_pace || 'medium',
          daily_time_limit: profile?.daily_time_limit || 120,
          difficulty_preferences: profile?.difficulty_preferences || ['Easy', 'Medium'],
          adaptive_difficulty: profile?.adaptive_difficulty ?? true,
          created_at: profile?.created_at || data.session.user.created_at,
          updated_at: profile?.updated_at || new Date().toISOString()
        };
        
        safeSetItem(USER_DATA_STORAGE_KEY, userData);
        return userData;
      } catch (e) {
        console.warn('⚠️ Error fetching profile for persistence:', e);
        
        // Still save basic user info from session
        const basicUserData = {
          id: data.session.user.id,
          email: data.session.user.email,
          username: data.session.user.email?.split('@')[0] || 'User',
          full_name: data.session.user.email?.split('@')[0] || 'User',
          avatar_url: null,
          learning_pace: 'medium',
          daily_time_limit: 120,
          difficulty_preferences: ['Easy', 'Medium'],
          adaptive_difficulty: true,
          created_at: data.session.user.created_at,
          updated_at: new Date().toISOString()
        };
        
        safeSetItem(USER_DATA_STORAGE_KEY, basicUserData);
        return basicUserData;
      }
    } else {
      console.log('📭 No active Supabase session found');
      return checkLocalSession();
    }
  } catch (e) {
    console.error('❌ Error initializing auth persistence:', e);
    return checkLocalSession();
  }
};

/**
 * Check for local session when Supabase is not available
 */
const checkLocalSession = () => {
  const userData = safeGetItem(USER_DATA_STORAGE_KEY, null);
  
  if (userData && userData.id && userData.email) {
    console.log('✅ Local session found:', userData.email);
    localStorage.setItem(SESSION_STORAGE_KEY, 'true');
    setCookie(AUTH_STATE_COOKIE_KEY, 'authenticated-local', 30);
    return userData;
  }
  
  console.log('📭 No local session found');
  clearAuthPersistence();
  return null;
};

/**
 * Checks if the user has an active session using multiple methods
 */
export const hasActiveSession = (): boolean => {
  const hasSessionStorage = localStorage.getItem(SESSION_STORAGE_KEY) === 'true';
  const hasUserIdCookie = !!getCookie(USER_ID_COOKIE_KEY);
  const hasAuthStateCookie = getCookie(AUTH_STATE_COOKIE_KEY)?.includes('authenticated');
  const hasUserData = !!safeGetItem(USER_DATA_STORAGE_KEY, null);
  
  return hasSessionStorage || hasUserIdCookie || hasAuthStateCookie || hasUserData;
};

/**
 * Clears all authentication persistence data
 */
export const clearAuthPersistence = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(USER_DATA_STORAGE_KEY);
  deleteCookie(USER_ID_COOKIE_KEY);
  deleteCookie(AUTH_STATE_COOKIE_KEY);
};

/**
 * Enhanced session validation with timeout and retry logic
 */
export const validateSession = async (retries = 3, timeout = 10000): Promise<any> => {
  const isSupabaseConfigured = !!(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  if (!isSupabaseConfigured) {
    return checkLocalSession();
  }

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Validating session (attempt ${i + 1}/${retries})`);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session validation timeout')), timeout)
      );
      
      const sessionPromise = supabase.auth.getSession();
      const { data, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
      
      if (error) throw error;
      
      if (data?.session?.user) {
        console.log('✅ Session validation successful');
        return data.session.user;
      } else {
        console.log('📭 No valid session found');
        return null;
      }
    } catch (error) {
      console.warn(`⚠️ Session validation attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        console.log('🔄 All session validation attempts failed, falling back to local');
        return checkLocalSession();
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  return null;
};
