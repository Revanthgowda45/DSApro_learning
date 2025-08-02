import { useState, useEffect, useCallback } from 'react'
import { ProblemProgressService } from '../services/problemProgressService'
import { UserSessionService } from '../services/userSessionService'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import type { Tables } from '../lib/supabase'

type ProblemProgress = Tables<'problem_progress'>
type UserSession = Tables<'user_sessions'>

// Hook for real-time problem progress
export function useProblemProgress() {
  const { user } = useSupabaseAuth()
  const [progress, setProgress] = useState<ProblemProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProgress = useCallback(async () => {
    if (!user) {
      setProgress([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const userProgress = await ProblemProgressService.getUserProgress(user.id)
      setProgress(userProgress)
      setError(null)
    } catch (err) {
      console.error('Error loading progress:', err)
      setError(err instanceof Error ? err.message : 'Failed to load progress')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  useEffect(() => {
    if (!user) return

    // Subscribe to real-time updates
    const subscription = ProblemProgressService.subscribeToProgress(
      user.id,
      (payload) => {
        console.log('Progress update received:', payload)
        
        if (payload.eventType === 'INSERT') {
          setProgress(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setProgress(prev => 
            prev.map(p => p.id === payload.new.id ? payload.new : p)
          )
        } else if (payload.eventType === 'DELETE') {
          setProgress(prev => 
            prev.filter(p => p.id !== payload.old.id)
          )
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const updateProblemStatus = useCallback(async (
    problemId: string,
    updates: Partial<ProblemProgress>
  ) => {
    if (!user) return

    try {
      await ProblemProgressService.updateProblemStatus(user.id, problemId, updates)
      // Real-time subscription will handle the UI update
    } catch (err) {
      console.error('Error updating problem status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update problem')
    }
  }, [user])

  const getProblemProgress = useCallback((problemId: string) => {
    return progress.find(p => p.problem_id === problemId)
  }, [progress])

  return {
    progress,
    loading,
    error,
    updateProblemStatus,
    getProblemProgress,
    refetch: loadProgress
  }
}

// Hook for real-time user sessions
export function useUserSessions(days?: number) {
  const { user } = useSupabaseAuth()
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    if (!user) {
      setSessions([])
      setAnalytics(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Calculate date range
      const endDate = new Date()
      const startDate = days ? new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000) : undefined
      
      const userSessions = await UserSessionService.getUserSessions(
        user.id,
        startDate?.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      
      setSessions(userSessions)
      
      // Load analytics
      const sessionAnalytics = await UserSessionService.getSessionAnalytics(user.id, days)
      setAnalytics(sessionAnalytics)
      
      setError(null)
    } catch (err) {
      console.error('Error loading sessions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [user, days])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (!user) return

    // Subscribe to real-time session updates
    const subscription = UserSessionService.subscribeToSessions(
      user.id,
      (payload) => {
        console.log('Session update received:', payload)
        
        if (payload.eventType === 'INSERT') {
          setSessions(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setSessions(prev => 
            prev.map(s => s.id === payload.new.id ? payload.new : s)
          )
        } else if (payload.eventType === 'DELETE') {
          setSessions(prev => 
            prev.filter(s => s.id !== payload.old.id)
          )
        }
        
        // Reload analytics when sessions change
        loadSessions()
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [user, loadSessions])

  const updateTodaySession = useCallback(async (updates: {
    problemsSolved?: number
    timeSpent?: number
    topicsCovered?: string[]
    streakDay?: number
  }) => {
    if (!user) return

    try {
      await UserSessionService.updateTodaySession(user.id, updates)
      // Real-time subscription will handle the UI update
    } catch (err) {
      console.error('Error updating today session:', err)
      setError(err instanceof Error ? err.message : 'Failed to update session')
    }
  }, [user])

  const recordProblemSolved = useCallback(async (
    problemId: string,
    topic: string,
    timeSpent: number = 0
  ) => {
    if (!user) return

    try {
      await UserSessionService.recordProblemSolved(user.id, problemId, topic, timeSpent)
      // Real-time subscription will handle the UI update
    } catch (err) {
      console.error('Error recording problem solved:', err)
      setError(err instanceof Error ? err.message : 'Failed to record problem')
    }
  }, [user])

  const getTodaySession = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return sessions.find(s => s.session_date === today)
  }, [sessions])

  return {
    sessions,
    analytics,
    loading,
    error,
    updateTodaySession,
    recordProblemSolved,
    getTodaySession,
    refetch: loadSessions
  }
}

// Hook for user statistics
export function useUserStats() {
  const { user } = useSupabaseAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    if (!user) {
      setStats(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const userStats = await ProblemProgressService.getUserStats(user.id)
      setStats(userStats)
      setError(null)
    } catch (err) {
      console.error('Error loading stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  }
}

// Hook for real-time problem status
export function useProblemStatus(problemId: string) {
  const { progress, updateProblemStatus } = useProblemProgress()
  
  const problemProgress = progress.find(p => p.problem_id === problemId)
  
  const updateStatus = useCallback(async (status: string) => {
    await updateProblemStatus(problemId, { 
      status,
      solved_at: (status === 'solved' || status === 'mastered') 
        ? new Date().toISOString() 
        : null
    })
  }, [problemId, updateProblemStatus])

  const updateNotes = useCallback(async (notes: string, rating?: number) => {
    await updateProblemStatus(problemId, { notes, rating })
  }, [problemId, updateProblemStatus])

  const toggleBookmark = useCallback(async () => {
    const currentBookmark = problemProgress?.is_bookmarked || false
    await updateProblemStatus(problemId, { is_bookmarked: !currentBookmark })
  }, [problemId, problemProgress?.is_bookmarked, updateProblemStatus])

  return {
    status: problemProgress?.status || 'not-started',
    notes: problemProgress?.notes || '',
    rating: problemProgress?.rating || 0,
    isBookmarked: problemProgress?.is_bookmarked || false,
    timeSpent: problemProgress?.time_spent || 0,
    attempts: problemProgress?.attempts || 0,
    solvedAt: problemProgress?.solved_at,
    updateStatus,
    updateNotes,
    toggleBookmark
  }
}

// Hook for session heatmap
export function useSessionHeatmap(year?: number) {
  const { user } = useSupabaseAuth()
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHeatmap = useCallback(async () => {
    if (!user) {
      setHeatmapData({})
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await UserSessionService.getSessionHeatmap(user.id, year)
      setHeatmapData(data)
      setError(null)
    } catch (err) {
      console.error('Error loading heatmap:', err)
      setError(err instanceof Error ? err.message : 'Failed to load heatmap')
    } finally {
      setLoading(false)
    }
  }, [user, year])

  useEffect(() => {
    loadHeatmap()
  }, [loadHeatmap])

  return {
    heatmapData,
    loading,
    error,
    refetch: loadHeatmap
  }
}

// Hook for recent activity
export function useRecentActivity(limit: number = 10) {
  const { user } = useSupabaseAuth()
  const [activity, setActivity] = useState<ProblemProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadActivity = useCallback(async () => {
    if (!user) {
      setActivity([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const recentActivity = await ProblemProgressService.getRecentActivity(user.id, limit)
      setActivity(recentActivity)
      setError(null)
    } catch (err) {
      console.error('Error loading recent activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }, [user, limit])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  return {
    activity,
    loading,
    error,
    refetch: loadActivity
  }
}
