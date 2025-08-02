import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SupabaseAuthService, User, RegisterData, LoginCredentials } from '../services/supabaseAuthService'
import { ProblemProgressService } from '../services/problemProgressService'
import { UserSessionService } from '../services/userSessionService'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateEmail: (newEmail: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  deleteAccount: () => Promise<void>
  migrateLocalData: () => Promise<void>
  loading: boolean
  initialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const currentSession = await SupabaseAuthService.getCurrentSession()
        setSession(currentSession)
        
        if (currentSession?.user) {
          const currentUser = await SupabaseAuthService.getProfile(currentSession.user.id)
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setInitialized(true)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = SupabaseAuthService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        setSession(session)
        
        if (session?.user) {
          try {
            const profile = await SupabaseAuthService.getProfile(session.user.id)
            setUser(profile)
          } catch (error) {
            console.error('Error fetching profile:', error)
            setUser(null)
          }
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    setLoading(true)
    try {
      const { user: loggedInUser, session: newSession } = await SupabaseAuthService.login(credentials)
      setUser(loggedInUser)
      setSession(newSession)
      
      // Migrate localStorage data if this is first Supabase login
      const hasSupabaseData = await checkForExistingSupabaseData(loggedInUser.id)
      if (!hasSupabaseData) {
        await migrateLocalStorageData(loggedInUser.id)
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    setLoading(true)
    try {
      const { user: newUser, session: newSession } = await SupabaseAuthService.register(userData)
      setUser(newUser)
      setSession(newSession)
      
      // Migrate any existing localStorage data
      await migrateLocalStorageData(newUser.id)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await SupabaseAuthService.logout()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    if (!user) throw new Error('No authenticated user')
    
    setLoading(true)
    try {
      const updatedUser = await SupabaseAuthService.updateProfile(user.id, userData)
      setUser(updatedUser)
    } catch (error) {
      console.error('Update user error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword: string) => {
    setLoading(true)
    try {
      await SupabaseAuthService.updatePassword(newPassword)
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateEmail = async (newEmail: string) => {
    setLoading(true)
    try {
      await SupabaseAuthService.updateEmail(newEmail)
    } catch (error) {
      console.error('Update email error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    try {
      await SupabaseAuthService.resetPassword(email)
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('No authenticated user')
    
    setLoading(true)
    try {
      const avatarUrl = await SupabaseAuthService.uploadAvatar(user.id, file)
      
      // Update user state with new avatar
      setUser(prev => prev ? { ...prev, avatar_url: avatarUrl } : null)
      
      return avatarUrl
    } catch (error) {
      console.error('Upload avatar error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    if (!user) throw new Error('No authenticated user')
    
    setLoading(true)
    try {
      await SupabaseAuthService.deleteAccount()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Delete account error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const migrateLocalData = async () => {
    if (!user) throw new Error('No authenticated user')
    
    try {
      await migrateLocalStorageData(user.id)
    } catch (error) {
      console.error('Migration error:', error)
      throw error
    }
  }

  // Helper function to check if user has existing Supabase data
  const checkForExistingSupabaseData = async (userId: string): Promise<boolean> => {
    try {
      const progress = await ProblemProgressService.getUserProgress(userId)
      const sessions = await UserSessionService.getUserSessions(userId)
      
      return progress.length > 0 || sessions.length > 0
    } catch (error) {
      console.error('Error checking existing data:', error)
      return false
    }
  }

  // Helper function to migrate localStorage data
  const migrateLocalStorageData = async (userId: string) => {
    try {
      console.log('Starting localStorage migration for user:', userId)
      
      // Migrate problem statuses
      const problemStatuses = localStorage.getItem('dsa_problem_statuses')
      if (problemStatuses) {
        const statuses = JSON.parse(problemStatuses)
        const progressUpdates = Object.entries(statuses).map(([problemId, status]) => ({
          problemId,
          updates: { status: status as string }
        }))
        
        if (progressUpdates.length > 0) {
          await ProblemProgressService.bulkUpdateProblems(userId, progressUpdates)
          console.log(`Migrated ${progressUpdates.length} problem statuses`)
        }
      }

      // Migrate user sessions
      const userSessions = localStorage.getItem('userSessions')
      if (userSessions) {
        const sessions = JSON.parse(userSessions)
        const sessionData = sessions.map((session: any) => ({
          user_id: userId,
          session_date: session.date,
          problems_solved: session.problemsSolved || 0,
          time_spent: session.timeSpent || 0,
          topics_covered: session.topicsCovered || [],
          streak_day: session.streakDay || 0
        }))
        
        if (sessionData.length > 0) {
          await UserSessionService.bulkCreateSessions(sessionData)
          console.log(`Migrated ${sessionData.length} user sessions`)
        }
      }

      // Migrate gamified progress
      const gamifiedProgress = localStorage.getItem('gamifiedProgress')
      if (gamifiedProgress) {
        const progress = JSON.parse(gamifiedProgress)
        
        // Store as AI insight
        await supabase
          .from('ai_insights')
          .upsert({
            user_id: userId,
            insight_type: 'gamified_progress',
            data: progress,
            confidence_score: 1.0
          }, {
            onConflict: 'user_id,insight_type'
          })
        
        console.log('Migrated gamified progress data')
      }

      // Migrate progressive AI data
      const progressiveProgress = localStorage.getItem('progressiveUserProgress')
      if (progressiveProgress) {
        const progress = JSON.parse(progressiveProgress)
        
        // Store as AI insight
        await supabase
          .from('ai_insights')
          .upsert({
            user_id: userId,
            insight_type: 'progressive_progress',
            data: progress,
            confidence_score: 1.0
          }, {
            onConflict: 'user_id,insight_type'
          })
        
        console.log('Migrated progressive AI data')
      }

      // Migrate realistic progress data
      const realisticProgress = localStorage.getItem('realisticProgressData')
      if (realisticProgress) {
        const progress = JSON.parse(realisticProgress)
        
        // Store as AI insight
        await supabase
          .from('ai_insights')
          .upsert({
            user_id: userId,
            insight_type: 'realistic_progress',
            data: progress,
            confidence_score: 1.0
          }, {
            onConflict: 'user_id,insight_type'
          })
        
        console.log('Migrated realistic progress data')
      }

      console.log('Successfully completed localStorage migration')
      
      // Optionally clear localStorage after successful migration
      // localStorage.removeItem('dsa_problem_statuses')
      // localStorage.removeItem('userSessions')
      // localStorage.removeItem('gamifiedProgress')
      // localStorage.removeItem('progressiveUserProgress')
      // localStorage.removeItem('realisticProgressData')
      
    } catch (error) {
      console.error('Error during localStorage migration:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    session,
    login,
    register,
    logout,
    updateUser,
    updatePassword,
    updateEmail,
    resetPassword,
    uploadAvatar,
    deleteAccount,
    migrateLocalData,
    loading,
    initialized
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

export { AuthContext as SupabaseAuthContext }
