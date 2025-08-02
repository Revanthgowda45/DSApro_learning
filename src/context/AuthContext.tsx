import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../services/supabaseAuthService';
import { SupabaseAuthService } from '../services/supabaseAuthService';
import { SimpleDataSync } from '../services/simpleDataSync';
import { safeSetItem, cleanupLocalStorage, setCookie } from '../lib/storageUtils';
import { getCachedUserData, storeUserData, clearAuthPersistence } from '../lib/enhancedAuthPersistence';
import { initProductionOptimizations } from '../utils/productionOptimizer';
import { validateLocalCredentials, isValidEmail, validatePassword } from '../lib/authValidation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialAuthComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthComplete, setInitialAuthComplete] = useState(false);

  // Initialize production optimizations
  useEffect(() => {
    initProductionOptimizations();
  }, []);

  // Initialize authentication state - CityFix pattern
  useEffect(() => {
    console.log('=== AUTH CONTEXT INITIALIZED ===');
    // Clean up localStorage first (non-blocking)
    try {
      cleanupLocalStorage();
    } catch (error) {
      console.warn('Error cleaning localStorage:', error);
    }
    
    let isMounted = true;
    let authAttempted = false;

    // Try to restore from cached data (synchronous)
    const attemptQuickAuth = (): boolean => {
      try {
        const userData = getCachedUserData();
        if (userData && userData.id && userData.email) {
          // Set cached user data for immediate UI render
          console.log('Using cached user data for quick auth');
          setUser(userData);
          setLoading(false);
          
          // Ensure we have cookies too for API requests
          setCookie('dsa-user-id', userData.id, 30);
          setCookie('dsa-auth-state', 'authenticated', 30);
          
          return true; // Successfully restored from cache
        }
        return false; // No cache or invalid cache
      } catch (e) {
        console.warn('Error during quick auth:', e);
        return false;
      }
    };
    
    // Load session from Supabase (CityFix pattern)
    const loadSupabaseSession = async () => {
      if (authAttempted || !isMounted) return;
      authAttempted = true;

      try {
        console.log('🔄 Getting Supabase session...');
        const currentUser = await SupabaseAuthService.getCurrentUser();
        
        if (currentUser && isMounted) {
          console.log('✅ Supabase user found:', currentUser.email);
          
          // Update user state if different or if no local user was found
          if (!user || user.id !== currentUser.id) {
            setUser(currentUser);
            storeUserData(currentUser);
            console.log('🔄 User state updated from Supabase');
          }
          
          // Background sync (non-blocking)
          setTimeout(async () => {
            try {
              console.log('🔄 Background syncing Supabase data...');
              await SimpleDataSync.syncOnLogin(currentUser.id);
              console.log('✅ Background data sync completed');
            } catch (syncError) {
              console.error('⚠️ Background data sync failed:', syncError);
            }
          }, 2000);
          
        } else {
          console.log('📱 No active Supabase session found');
          // Clear state just to be safe
          if (!user) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('⚠️ Supabase session load failed:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialAuthComplete(true);
        }
      }
    };
    
    // Try quick auth first (synchronous) - CityFix pattern
    const quickAuthSuccessful = attemptQuickAuth();
    
    // Then try loading from Supabase (async, but only if quick auth failed)
    if (!quickAuthSuccessful) {
      console.log('Quick auth failed or not available, trying Supabase session');
      // Add slight delay to allow React to render with current state first
      setTimeout(loadSupabaseSession, 50);
    } else {
      // Still check Supabase session in background to ensure token freshness
      setTimeout(loadSupabaseSession, 1000);
      // Mark initialization as complete
      setInitialAuthComplete(true);
    }

    // Set up auth state listener for Supabase changes
    const { data: { subscription } } = SupabaseAuthService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        console.log('🔄 Auth state changed: User signed out');
        setUser(null);
        clearAuthPersistence();
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔄 Auth state changed: User signed in');
        // Will be handled by the session load above
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔄 AuthContext: Starting login process for:', email);
      
      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      console.log('✅ AuthContext: Input validation passed');
      
      // Try Supabase login first
      try {
        console.log('🔄 AuthContext: Attempting Supabase login...');
        const { user: supabaseUser } = await SupabaseAuthService.login({ email, password });
        
        console.log('✅ AuthContext: Supabase login successful!');
        setUser(supabaseUser);
        storeUserData(supabaseUser);
        
        // Background sync (non-blocking)
        setTimeout(async () => {
          try {
            console.log('🔄 Syncing data after login...');
            await SimpleDataSync.syncOnLogin(supabaseUser.id);
            console.log('✅ Data sync completed after login');
          } catch (syncError) {
            console.error('⚠️ Data sync failed after login:', syncError);
          }
        }, 1000);
        
        console.log('✅ AuthContext: Login completed successfully!');
        return;
        
      } catch (supabaseError) {
        console.warn('⚠️ Supabase login failed, trying local auth:', supabaseError);
        
        // Try local authentication as fallback
        const localUser = validateLocalCredentials(email, password);
        if (localUser) {
          console.log('✅ Local authentication successful');
          setUser(localUser);
          storeUserData(localUser);
          return;
        }
        
        // If both fail, throw the original Supabase error
        throw supabaseError;
      }
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      console.log('🔄 AuthContext: Starting registration process for:', userData.email);
      
      // Input validation
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }
      
      if (!isValidEmail(userData.email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!validatePassword(userData.password)) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      console.log('✅ AuthContext: Input validation passed');
      console.log('🔄 AuthContext: Attempting Supabase registration...');
      
      try {
        // Try Supabase registration first
        await SupabaseAuthService.register(userData);
        console.log('✅ Supabase registration successful');
      } catch (supabaseError) {
        console.warn('⚠️ Supabase registration failed, creating local account:', supabaseError);
        // For local registration, we'll create a demo account
        console.log('📱 Creating local demo account for:', userData.email);
        
        const localUser: User = {
          id: 'local-user-' + Date.now(),
          email: userData.email,
          username: userData.username || userData.email.split('@')[0],
          full_name: userData.full_name || userData.username || userData.email.split('@')[0],
          avatar_url: null,
          learning_pace: 'medium',
          daily_time_limit: 120,
          difficulty_preferences: ['Easy', 'Medium'],
          adaptive_difficulty: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        storeUserData(localUser);
        console.log('✅ Local registration completed successfully!');
        // Don't set user state - redirect to login page instead
        return;
      }
    } catch (error) {
      console.error('❌ AuthContext: Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SupabaseAuthService.logout();
      clearAuthPersistence();
      setUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Clear local state anyway
      clearAuthPersistence();
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    try {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      storeUserData(updatedUser);
      
      // Try to update in Supabase if available
      try {
        await SupabaseAuthService.updateUser(updatedUser);
        console.log('✅ User updated in Supabase');
      } catch (error) {
        console.warn('⚠️ Failed to update user in Supabase, using local only:', error);
      }
    } catch (error) {
      console.error('❌ User update failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    initialAuthComplete,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
