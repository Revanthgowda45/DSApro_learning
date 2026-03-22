import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../services/SupabaseAuthService';
import { SupabaseAuthService } from '../services/SupabaseAuthService';
import { SimpleDataSync } from '../services/SimpleDataSync';
import { TimeTrackingService } from '../services/TimeTrackingService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialAuthComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  handleOAuthCallback: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
    // Clean up any orphaned timers on app start
    TimeTrackingService.cleanupOrphanedTimers();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔄 AuthContext: Initializing authentication...');
      setLoading(true);

      // Try to get cached user data first
      const cachedUser = await getCachedUserData();
      if (cachedUser) {
        console.log('📱 AuthContext: Found cached user data');
        setUser(cachedUser);
        setInitialAuthComplete(true);
        
        // Sync in background
        syncUserDataInBackground(cachedUser);
      }

      // Check Supabase session
      const supabaseUser = await SupabaseAuthService.getCurrentUser();
      if (supabaseUser) {
        console.log('✅ AuthContext: Supabase session found');
        setUser(supabaseUser);
        await storeUserData(supabaseUser);
        
        // Initialize data sync
        await SimpleDataSync.initialize(supabaseUser.id);
      } else if (!cachedUser) {
        console.log('❌ AuthContext: No authentication found');
        setUser(null);
      }

    } catch (error) {
      console.error('❌ AuthContext: Error initializing auth:', error);
      // Try to use cached data as fallback
      const cachedUser = await getCachedUserData();
      if (cachedUser) {
        setUser(cachedUser);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
      setInitialAuthComplete(true);
    }
  };

  const syncUserDataInBackground = async (userData: User) => {
    try {
      // Verify Supabase connection and sync data
      const supabaseUser = await SupabaseAuthService.getCurrentUser();
      if (supabaseUser && supabaseUser.id === userData.id) {
        await SimpleDataSync.initialize(userData.id);
      }
    } catch (error) {
      console.warn('⚠️ AuthContext: Background sync failed:', error);
    }
  };

  const getCachedUserData = async (): Promise<User | null> => {
    try {
      const userData = await AsyncStorage.getItem('dsa_user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ AuthContext: Error getting cached user data:', error);
      return null;
    }
  };

  const storeUserData = async (userData: User) => {
    try {
      await AsyncStorage.setItem('dsa_user_data', JSON.stringify(userData));
      await AsyncStorage.setItem('dsa_user_id', userData.id);
      await AsyncStorage.setItem('dsa_auth_timestamp', Date.now().toString());
    } catch (error) {
      console.error('❌ AuthContext: Error storing user data:', error);
    }
  };

  const clearAuthPersistence = async () => {
    try {
      const keysToRemove = [
        'dsa_user_data',
        'dsa_user_id', 
        'dsa_auth_timestamp',
        'dsa_session_data',
        'dsa_problem_statuses',
        'dsa_problem_bookmarks',
        'dsa_user_preferences',
        'dsa_notification_settings'
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ AuthContext: Cleared auth persistence');
    } catch (error) {
      console.error('❌ AuthContext: Error clearing auth persistence:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔄 AuthContext: Logging in...');
      setLoading(true);

      const userData = await SupabaseAuthService.signIn(email, password);
      console.log('✅ AuthContext: Login successful');
      
      setUser(userData);
      await storeUserData(userData);
      
      // Initialize data sync
      await SimpleDataSync.initialize(userData.id);
      
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      console.log('🔄 AuthContext: Registering...');
      setLoading(true);

      const newUser = await SupabaseAuthService.signUp(userData);
      console.log('✅ AuthContext: Registration successful');
      
      setUser(newUser);
      await storeUserData(newUser);
      
      // Initialize data sync
      await SimpleDataSync.initialize(newUser.id);
      
    } catch (error) {
      console.error('❌ AuthContext: Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 AuthContext: Logging out...');
      setLoading(true);

      // Logout from Supabase
      await SupabaseAuthService.signOut();
      
      // Clear all local data
      await clearAuthPersistence();
      
      setUser(null);
      console.log('✅ AuthContext: Logout successful');
      
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
      // Always clear local state even if Supabase logout fails
      await clearAuthPersistence();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      console.log('🔄 AuthContext: Updating user...');
      
      // Update in Supabase
      const updatedUser = await SupabaseAuthService.updateUser(userData);
      
      // Update local state
      setUser(updatedUser);
      await storeUserData(updatedUser);
      
      console.log('✅ AuthContext: User updated successfully');
      
    } catch (error) {
      console.error('❌ AuthContext: Update user error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔄 AuthContext: Google sign in...');
      setLoading(true);

      const userData = await SupabaseAuthService.signInWithGoogle();
      console.log('✅ AuthContext: Google sign in successful');
      
      setUser(userData);
      await storeUserData(userData);
      
      // Initialize data sync
      await SimpleDataSync.initialize(userData.id);
      
    } catch (error) {
      console.error('❌ AuthContext: Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthCallback = async () => {
    try {
      console.log('🔄 AuthContext: Handling OAuth callback...');
      
      const userData = await SupabaseAuthService.handleOAuthCallback();
      if (userData) {
        setUser(userData);
        await storeUserData(userData);
        await SimpleDataSync.initialize(userData.id);
      }
      
    } catch (error) {
      console.error('❌ AuthContext: OAuth callback error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('🔄 AuthContext: Resetting password...');
      await SupabaseAuthService.resetPassword(email);
      console.log('✅ AuthContext: Password reset email sent');
    } catch (error) {
      console.error('❌ AuthContext: Reset password error:', error);
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
    updateUser,
    signInWithGoogle,
    handleOAuthCallback,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
