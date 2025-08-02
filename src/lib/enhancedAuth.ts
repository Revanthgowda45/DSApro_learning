/**
 * Enhanced Authentication Utilities for DSA Project
 * Implements CityFixApp's robust authentication patterns
 */

import { safeGetItem, safeSetItem, setCookie, getCookie, deleteCookie } from './storageUtils';

// Authentication constants
export const AUTH_KEYS = {
  USER_DATA: 'dsa_user',
  SESSION_ACTIVE: 'dsa-session-active',
  USER_ID_COOKIE: 'dsa-user-id',
  AUTH_STATE_COOKIE: 'dsa-auth-state'
};

// User type definition
interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  is_admin?: boolean;
  learning_pace?: string;
  daily_time_limit?: number;
  difficulty_preferences?: string[];
  adaptive_difficulty?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Quick authentication check for instant UI response
export const quickAuthCheck = (): User | null => {
  const userData = safeGetItem<User | null>(AUTH_KEYS.USER_DATA, null);
  const hasSession = localStorage.getItem(AUTH_KEYS.SESSION_ACTIVE) === 'true';
  const hasCookie = getCookie(AUTH_KEYS.AUTH_STATE_COOKIE)?.includes('authenticated');
  
  if (userData && userData.id && userData.email && (hasSession || hasCookie)) {
    console.log('✅ Quick auth: User found in cache');
    return userData;
  }
  
  return null;
};

// Set authentication state across all storage mechanisms
export const setAuthState = (user: User) => {
  safeSetItem(AUTH_KEYS.USER_DATA, user);
  localStorage.setItem(AUTH_KEYS.SESSION_ACTIVE, 'true');
  setCookie(AUTH_KEYS.USER_ID_COOKIE, user.id, 30);
  setCookie(AUTH_KEYS.AUTH_STATE_COOKIE, 'authenticated', 30);
};

// Clear all authentication data
export const clearAuthState = () => {
  localStorage.removeItem(AUTH_KEYS.USER_DATA);
  localStorage.removeItem(AUTH_KEYS.SESSION_ACTIVE);
  deleteCookie(AUTH_KEYS.USER_ID_COOKIE);
  deleteCookie(AUTH_KEYS.AUTH_STATE_COOKIE);
};

// Check if user has any active session indicators
export const hasAnyAuthIndicators = (): boolean => {
  return !!(
    localStorage.getItem(AUTH_KEYS.SESSION_ACTIVE) ||
    getCookie(AUTH_KEYS.USER_ID_COOKIE) ||
    getCookie(AUTH_KEYS.AUTH_STATE_COOKIE) ||
    safeGetItem<User | null>(AUTH_KEYS.USER_DATA, null)
  );
};

// Export User type for use in other files
export type { User };
