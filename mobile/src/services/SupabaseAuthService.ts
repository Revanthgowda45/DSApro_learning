import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  daily_time_limit?: number;
  learning_pace?: string;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

class SupabaseAuthServiceClass {
  private supabase: SupabaseClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '') {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
      this.isConfigured = true;
      console.log('✅ SupabaseAuth: Configured successfully');
    } else {
      console.warn('⚠️ SupabaseAuth: Missing environment variables - running in offline mode');
      this.isConfigured = false;
    }
  }

  private checkConfiguration(): void {
    if (!this.isConfigured || !this.supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }
  }

  async signUp(userData: {
    email: string;
    password: string;
    username: string;
    full_name: string;
    daily_time_limit?: number;
    learning_pace?: string;
  }): Promise<User> {
    try {
      this.checkConfiguration();
      console.log('🔄 SupabaseAuth: Signing up user...');

      const { data, error } = await this.supabase!.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.full_name,
            daily_time_limit: userData.daily_time_limit || 120,
            learning_pace: userData.learning_pace || 'moderate',
          },
        },
      });

      if (error) {
        console.error('❌ SupabaseAuth: Sign up error:', error);
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('No user data returned from signup');
      }

      // Create user profile
      const userProfile: User = {
        id: data.user.id,
        email: data.user.email!,
        username: userData.username,
        full_name: userData.full_name,
        daily_time_limit: userData.daily_time_limit || 120,
        learning_pace: userData.learning_pace || 'moderate',
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert into profiles table
      const { error: profileError } = await this.supabase
        .from('profiles')
        .insert([userProfile]);

      if (profileError) {
        console.error('❌ SupabaseAuth: Profile creation error:', profileError);
        // Don't throw here, user is created but profile might fail
      }

      console.log('✅ SupabaseAuth: User signed up successfully');
      return userProfile;
    } catch (error) {
      console.error('❌ SupabaseAuth: Sign up failed:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('🔄 SupabaseAuth: Signing in user...');

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ SupabaseAuth: Sign in error:', error);
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('No user data returned from signin');
      }

      // Get user profile
      const userProfile = await this.getUserProfile(data.user.id);
      
      console.log('✅ SupabaseAuth: User signed in successfully');
      return userProfile;
    } catch (error) {
      console.error('❌ SupabaseAuth: Sign in failed:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      console.log('🔄 SupabaseAuth: Google sign in...');

      const redirectTo = AuthSession.makeRedirectUri();

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.error('❌ SupabaseAuth: Google sign in error:', error);
        throw new Error(error.message);
      }

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      if (result.type === 'success') {
        // Handle the OAuth callback
        return await this.handleOAuthCallback();
      } else {
        throw new Error('OAuth cancelled or failed');
      }
    } catch (error) {
      console.error('❌ SupabaseAuth: Google sign in failed:', error);
      throw error;
    }
  }

  async handleOAuthCallback(): Promise<User | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session?.user) {
        const userProfile = await this.getUserProfile(session.user.id);
        return userProfile;
      }
      
      return null;
    } catch (error) {
      console.error('❌ SupabaseAuth: OAuth callback error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🔄 SupabaseAuth: Signing out...');

      const { error } = await this.supabase.auth.signOut();

      if (error) {
        console.error('❌ SupabaseAuth: Sign out error:', error);
        throw new Error(error.message);
      }

      console.log('✅ SupabaseAuth: User signed out successfully');
    } catch (error) {
      console.error('❌ SupabaseAuth: Sign out failed:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      const userProfile = await this.getUserProfile(session.user.id);
      return userProfile;
    } catch (error) {
      console.error('❌ SupabaseAuth: Get current user failed:', error);
      return null;
    }
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    try {
      console.log('🔄 SupabaseAuth: Updating user...');

      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      // Update profile in database
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ SupabaseAuth: Update user error:', error);
        throw new Error(error.message);
      }

      console.log('✅ SupabaseAuth: User updated successfully');
      return data;
    } catch (error) {
      console.error('❌ SupabaseAuth: Update user failed:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      console.log('🔄 SupabaseAuth: Resetting password...');

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'your-app://reset-password',
      });

      if (error) {
        console.error('❌ SupabaseAuth: Reset password error:', error);
        throw new Error(error.message);
      }

      console.log('✅ SupabaseAuth: Password reset email sent');
    } catch (error) {
      console.error('❌ SupabaseAuth: Reset password failed:', error);
      throw error;
    }
  }

  private async getUserProfile(userId: string): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ SupabaseAuth: Get user profile error:', error);
        
        // If profile doesn't exist, create a basic one
        if (error.code === 'PGRST116') {
          const { data: { session } } = await this.supabase.auth.getSession();
          if (session?.user) {
            const basicProfile: User = {
              id: session.user.id,
              email: session.user.email!,
              username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
              full_name: session.user.user_metadata?.full_name || 'User',
              daily_time_limit: 120,
              learning_pace: 'moderate',
              is_admin: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Try to create the profile
            const { data: newProfile, error: createError } = await this.supabase
              .from('profiles')
              .insert([basicProfile])
              .select()
              .single();

            if (createError) {
              console.error('❌ SupabaseAuth: Create profile error:', createError);
              return basicProfile; // Return basic profile even if DB insert fails
            }

            return newProfile;
          }
        }
        
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('❌ SupabaseAuth: Get user profile failed:', error);
      throw error;
    }
  }

  // Get Supabase client for direct access
  getClient(): SupabaseClient | null {
    return this.supabase;
  }
}

export const SupabaseAuthService = new SupabaseAuthServiceClass();
