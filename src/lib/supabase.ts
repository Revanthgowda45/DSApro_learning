import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Create Supabase client only if configured
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Log configuration status
if (isSupabaseConfigured()) {
  console.log('✅ Supabase configured successfully');
} else {
  console.warn('⚠️ Supabase not configured - using local authentication only');
}

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          learning_pace: string
          daily_time_limit: number
          difficulty_preferences: string[]
          adaptive_difficulty: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          learning_pace?: string
          daily_time_limit?: number
          difficulty_preferences?: string[]
          adaptive_difficulty?: boolean
        }
        Update: {
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          learning_pace?: string
          daily_time_limit?: number
          difficulty_preferences?: string[]
          adaptive_difficulty?: boolean
          updated_at?: string
        }
      }
      problem_progress: {
        Row: {
          id: string
          user_id: string
          problem_id: string
          status: string
          notes: string | null
          rating: number | null
          time_spent: number
          attempts: number
          is_bookmarked: boolean
          solved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          problem_id: string
          status: string
          notes?: string | null
          rating?: number | null
          time_spent?: number
          attempts?: number
          is_bookmarked?: boolean
          solved_at?: string | null
        }
        Update: {
          status?: string
          notes?: string | null
          rating?: number | null
          time_spent?: number
          attempts?: number
          is_bookmarked?: boolean
          solved_at?: string | null
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_date: string
          problems_solved: number
          time_spent: number
          topics_covered: string[]
          streak_day: number
          created_at: string
        }
        Insert: {
          user_id: string
          session_date: string
          problems_solved?: number
          time_spent?: number
          topics_covered?: string[]
          streak_day?: number
        }
        Update: {
          problems_solved?: number
          time_spent?: number
          topics_covered?: string[]
          streak_day?: number
        }
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          insight_type: string
          data: any
          confidence_score: number
          created_at: string
        }
        Insert: {
          user_id: string
          insight_type: string
          data: any
          confidence_score?: number
        }
        Update: {
          data?: any
          confidence_score?: number
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          type: string
          title: string
          message?: string | null
          is_read?: boolean
        }
        Update: {
          is_read?: boolean
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
