import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Tables, Inserts, Updates } from '../lib/supabase'

type ProfileInsert = Inserts<'profiles'>
type ProfileUpdate = Updates<'profiles'>

export interface User {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  learning_pace: string
  daily_time_limit: number
  difficulty_preferences: string[]
  adaptive_difficulty: boolean
  email?: string
  created_at: string
  updated_at: string
  is_admin?: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  username?: string
}

export class SupabaseAuthService {
  // Helper method to check if Supabase is available
  private static checkSupabaseAvailable(): void {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }
  }

  // Register new user
  static async register(userData: RegisterData): Promise<{ user: User; session: any }> {
    try {
      this.checkSupabaseAvailable();
      
      console.log('🔄 Attempting Supabase registration for:', userData.email);
      
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase!.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            username: userData.username
          }
        }
      });

      if (authError) {
        console.error('❌ Supabase auth error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user - no user data returned');
      }

      console.log('✅ Supabase user created:', authData.user.email);

      // Create profile
      const profileData: ProfileInsert = {
        id: authData.user.id,
        username: userData.username || null,
        full_name: userData.full_name,
        avatar_url: null,
        learning_pace: 'medium',
        daily_time_limit: 120,
        difficulty_preferences: ['Easy', 'Medium'],
        adaptive_difficulty: true
      };

      console.log('🔄 Creating user profile...');
      
      const { data: profile, error: profileError } = await supabase!
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('✅ User profile created successfully');

      const user: User = {
        ...profile,
        email: authData.user.email || userData.email,
        is_admin: false
      };

      return { user, session: authData.session };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<{ user: User; session: any }> {
    try {
      this.checkSupabaseAvailable();
      
      console.log('🔄 Attempting Supabase login for:', credentials.email);
      
      const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Login failed')

      const user = await this.getProfile(authData.user.id)
      
      return { user, session: authData.session }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    this.checkSupabaseAvailable();
    const { error } = await supabase!.auth.signOut();
    if (error) throw error;
  }

  // Get current session
  static async getCurrentSession() {
    this.checkSupabaseAvailable();
    const { data: { session }, error } = await supabase!.auth.getSession();
    if (error) throw error;
    return session;
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      this.checkSupabaseAvailable();
      const session = await this.getCurrentSession();
      if (!session?.user) return null;

      return await this.getProfile(session.user.id);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get user profile
  static async getProfile(userId: string): Promise<User> {
    this.checkSupabaseAvailable();
    const { data: profile, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Get email from auth user
    const { data: { user: authUser } } = await supabase!.auth.getUser();
    
    return {
      ...profile,
      email: authUser?.email,
      is_admin: profile.is_admin || false
    };
  }

  // Update user profile
  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<User> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    // Get email from auth user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    return {
      ...profile,
      email: authUser?.email
    }
  }

  // Update user password
  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  }

  // Update user email
  static async updateEmail(newEmail: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    })

    if (error) throw error
  }

  // Update user profile
  static async updateUser(userData: Partial<User>): Promise<User> {
    try {
      this.checkSupabaseAvailable();
      
      const session = await this.getCurrentSession();
      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      // Update profile in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          username: userData.username,
          learning_pace: userData.learning_pace,
          daily_time_limit: userData.daily_time_limit,
          difficulty_preferences: userData.difficulty_preferences,
          adaptive_difficulty: userData.adaptive_difficulty,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // If email is being updated, update auth user as well
      if (userData.email && userData.email !== session.user.email) {
        await this.updateEmail(userData.email);
      }

      // Get the updated user data
      const updatedUser = await this.getCurrentUser();
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user data');
      }

      console.log('✅ User profile updated successfully in Supabase');
      return updatedUser;
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      throw error;
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error
  }

  // Subscribe to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Check if user exists
  static async userExists(email: string): Promise<boolean> {
    try {
      // This is a workaround since Supabase doesn't provide a direct way to check if user exists
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password'
      })

      // If error is invalid_credentials, user exists but password is wrong
      // If error is invalid_login_credentials, user doesn't exist
      return error?.message !== 'Invalid login credentials'
    } catch {
      return false
    }
  }

  // Get user by email (admin function)
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)

      if (error) throw error

      // This is a simplified approach - in a real app, you'd need admin privileges
      // to search users by email
      return null
    } catch (error) {
      console.error('Error getting user by email:', error)
      return null
    }
  }

  // Delete user account
  static async deleteAccount(): Promise<void> {
    try {
      const session = await this.getCurrentSession()
      if (!session?.user) throw new Error('No authenticated user')

      // Delete profile first (due to foreign key constraints)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', session.user.id)

      if (profileError) throw profileError

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(session.user.id)
      if (authError) throw authError

    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  }

  // Upload avatar
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      await this.updateProfile(userId, {
        avatar_url: data.publicUrl
      })

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw error
    }
  }

  // Get user statistics
  static async getUserStats(userId: string) {
    try {
      // Get problem progress stats
      const { data: progressStats, error: progressError } = await supabase
        .rpc('get_user_progress_stats', { user_id: userId })

      if (progressError) throw progressError

      // Get session stats
      const { data: sessionStats, error: sessionError } = await supabase
        .rpc('get_user_session_stats', { user_id: userId })

      if (sessionError) throw sessionError

      return {
        progress: progressStats,
        sessions: sessionStats
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return null
    }
  }

  // Migrate localStorage data to Supabase
  static async migrateLocalStorageData(userId: string): Promise<void> {
    try {
      // Migrate problem progress
      const problemStatuses = localStorage.getItem('dsa_problem_statuses')
      if (problemStatuses) {
        const statuses = JSON.parse(problemStatuses)
        const progressData = Object.entries(statuses).map(([problemId, status]) => ({
          user_id: userId,
          problem_id: problemId,
          status: status as string
        }))

        const { error } = await supabase
          .from('problem_progress')
          .upsert(progressData, { onConflict: 'user_id,problem_id' })

        if (error) throw error
      }

      // Migrate user sessions
      const userSessions = localStorage.getItem('userSessions')
      if (userSessions) {
        const sessions = JSON.parse(userSessions)
        const sessionData = sessions.map((session: any) => ({
          user_id: userId,
          session_date: session.date,
          problems_solved: session.problemsSolved,
          time_spent: session.timeSpent,
          topics_covered: session.topicsCovered || [],
          streak_day: session.streakDay || 0
        }))

        const { error } = await supabase
          .from('user_sessions')
          .upsert(sessionData, { onConflict: 'user_id,session_date' })

        if (error) throw error
      }

      console.log('Successfully migrated localStorage data to Supabase')
    } catch (error) {
      console.error('Error migrating localStorage data:', error)
      throw error
    }
  }

  // Google OAuth Login
  static async signInWithGoogle(): Promise<{ user: User | null; session: any }> {
    try {
      this.checkSupabaseAvailable();
      
      console.log('🔄 Attempting Google OAuth login...');
      
      const { data, error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('❌ Google OAuth error:', error);
        throw error;
      }
      
      console.log('✅ Google OAuth initiated successfully');
      
      // The actual user data will be available after redirect
      return { user: null, session: null };
    } catch (error: any) {
      console.error('❌ Google OAuth failed:', error);
      throw new Error(error.message || 'Google login failed. Please try again.');
    }
  }

  // Handle OAuth callback and create profile
  static async handleOAuthCallback(): Promise<{ user: User; session: any } | null> {
    try {
      this.checkSupabaseAvailable();
      
      console.log('🔄 Handling OAuth callback...');
      
      const { data: { session }, error: sessionError } = await supabase!.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw sessionError;
      }
      
      if (!session || !session.user) {
        console.log('📱 No active session found');
        return null;
      }
      
      console.log('✅ OAuth session found:', session.user.email);
      
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Profile lookup error:', profileError);
        throw profileError;
      }
      
      let profile;
      
      if (!existingProfile) {
        // Create new profile for OAuth user
        console.log('🔄 Creating new profile for OAuth user');
        
        const profileData: ProfileInsert = {
          id: session.user.id,
          username: session.user.user_metadata?.preferred_username || 
                   session.user.user_metadata?.name?.toLowerCase().replace(/\s+/g, '_') || 
                   session.user.email?.split('@')[0] || null,
          full_name: session.user.user_metadata?.full_name || 
                    session.user.user_metadata?.name || null,
          avatar_url: session.user.user_metadata?.avatar_url || 
                     session.user.user_metadata?.picture || null,
          learning_pace: 'moderate',
          daily_time_limit: 120,
          difficulty_preferences: ['Easy', 'Medium'],
          adaptive_difficulty: true
        };
        
        const { data: newProfile, error: insertError } = await supabase!
          .from('profiles')
          .insert(profileData)
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ Profile creation error:', insertError);
          throw insertError;
        }
        
        profile = newProfile;
        console.log('✅ Profile created successfully');
      } else {
        profile = existingProfile;
        console.log('✅ Existing profile found');
      }
      
      const user: User = {
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        learning_pace: profile.learning_pace,
        daily_time_limit: profile.daily_time_limit,
        difficulty_preferences: profile.difficulty_preferences,
        adaptive_difficulty: profile.adaptive_difficulty,
        email: session.user.email || undefined,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };
      
      return { user, session };
    } catch (error: any) {
      console.error('❌ OAuth callback handling failed:', error);
      throw new Error(error.message || 'OAuth authentication failed. Please try again.');
    }
  }

  // Sign out (works for both email and OAuth)
  static async signOut(): Promise<void> {
    try {
      this.checkSupabaseAvailable();
      
      console.log('🔄 Signing out...');
      
      const { error } = await supabase!.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      
      console.log('✅ Signed out successfully');
    } catch (error: any) {
      console.error('❌ Sign out failed:', error);
      throw new Error(error.message || 'Sign out failed. Please try again.');
    }
  }
}
