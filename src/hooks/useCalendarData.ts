import { useState, useEffect, useCallback } from 'react'
import { CalendarDataService, type CalendarDay, type CalendarStats } from '../services/calendarDataService'
import { useAuth } from '../context/AuthContext'

export interface UseCalendarDataOptions {
  period?: 'week' | 'month' | 'quarter'
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseCalendarDataReturn {
  calendarDays: CalendarDay[]
  stats: CalendarStats | null
  isLoading: boolean
  error: string | null
  currentDate: Date
  setCurrentDate: (date: Date) => void
  refreshData: () => Promise<void>
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToToday: () => void
  selectDay: (day: CalendarDay | null) => void
  selectedDay: CalendarDay | null
  hasRealData: boolean
  dataSource: 'supabase' | 'localStorage' | 'empty'
}

export function useCalendarData(options: UseCalendarDataOptions = {}): UseCalendarDataReturn {
  const { user } = useAuth()
  const {
    period = 'month',
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options

  // State
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [stats, setStats] = useState<CalendarStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [hasRealData, setHasRealData] = useState(false)
  const [dataSource, setDataSource] = useState<'supabase' | 'localStorage' | 'empty'>('empty')

  // Load calendar data
  const loadCalendarData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false)
      setError('No user authenticated')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log('📅 Loading calendar data for:', {
        userId: user.id,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth(),
        period
      })

      const startTime = Date.now()
      
      const days = await CalendarDataService.getCalendarData(
        user.id,
        currentDate.getFullYear(),
        currentDate.getMonth(),
        period
      )

      const loadTime = Date.now() - startTime
      console.log(`⏱️ Calendar data loaded in ${loadTime}ms`)

      // Determine data source and quality
      const activeDays = days.filter(day => day.hasPracticed)
      const hasSupabaseData = activeDays.some(day => day.sessionData)
      const hasLocalData = activeDays.length > 0 && !hasSupabaseData
      
      if (hasSupabaseData) {
        setDataSource('supabase')
        setHasRealData(true)
        console.log('✅ Using real Supabase data')
      } else if (hasLocalData) {
        setDataSource('localStorage')
        setHasRealData(true)
        console.log('📱 Using localStorage data')
      } else {
        setDataSource('empty')
        setHasRealData(false)
        console.log('📭 No practice data found')
      }

      setCalendarDays(days)

      // Calculate statistics
      const calculatedStats = CalendarDataService.calculateCalendarStats(days)
      setStats(calculatedStats)

      console.log('📊 Calendar stats:', {
        totalProblems: calculatedStats.totalProblems,
        activeDays: calculatedStats.activeDays,
        currentStreak: calculatedStats.currentStreak,
        dataSource
      })

    } catch (err) {
      console.error('❌ Failed to load calendar data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load calendar data')
      setHasRealData(false)
      setDataSource('empty')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, currentDate, period])

  // Refresh data manually
  const refreshData = useCallback(async () => {
    console.log('🔄 Manually refreshing calendar data...')
    await loadCalendarData()
  }, [loadCalendarData])

  // Navigation functions
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }, [])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // Day selection
  const selectDay = useCallback((day: CalendarDay | null) => {
    setSelectedDay(day)
  }, [])

  // Load data when dependencies change
  useEffect(() => {
    loadCalendarData()
  }, [loadCalendarData])

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !user?.id) return

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing calendar data...')
      loadCalendarData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadCalendarData, user?.id])

  // Real-time subscription for Supabase updates (if available)
  useEffect(() => {
    if (!user?.id || dataSource !== 'supabase') return

    console.log('🔔 Setting up real-time calendar subscription')

    // Subscribe to user sessions changes
    const sessionSubscription = import('../services/userSessionService').then(({ UserSessionService }) => {
      return UserSessionService.subscribeToSessions(user.id, (payload) => {
        console.log('🔔 Real-time session update:', payload)
        // Refresh data when sessions change
        setTimeout(loadCalendarData, 1000) // Small delay to ensure data consistency
      })
    })

    // Subscribe to problem progress changes
    const progressSubscription = import('../services/problemProgressService').then(({ ProblemProgressService }) => {
      return ProblemProgressService.subscribeToProgress(user.id, (payload) => {
        console.log('🔔 Real-time progress update:', payload)
        // Refresh data when progress changes
        setTimeout(loadCalendarData, 1000)
      })
    })

    return () => {
      // Cleanup subscriptions
      sessionSubscription.then(sub => sub?.unsubscribe())
      progressSubscription.then(sub => sub?.unsubscribe())
    }
  }, [user?.id, dataSource, loadCalendarData])

  return {
    calendarDays,
    stats,
    isLoading,
    error,
    currentDate,
    setCurrentDate,
    refreshData,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDay,
    selectedDay,
    hasRealData,
    dataSource
  }
}

// Additional utility hooks

/**
 * Hook for getting calendar data for a specific date range
 */
export function useCalendarDateRange(startDate: Date, endDate: Date) {
  const { user } = useAuth()
  const [data, setData] = useState<CalendarDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const days = await CalendarDataService.getDateRangeData(user.id, startDate, endDate)
        setData(days)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load date range data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.id, startDate, endDate])

  return { data, isLoading, error }
}

/**
 * Hook for getting calendar statistics only
 */
export function useCalendarStats(period: 'week' | 'month' | 'quarter' = 'month') {
  const { user } = useAuth()
  const [stats, setStats] = useState<CalendarStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    const loadStats = async () => {
      try {
        setIsLoading(true)
        
        const today = new Date()
        const days = await CalendarDataService.getCalendarData(
          user.id,
          today.getFullYear(),
          today.getMonth(),
          period
        )
        
        const calculatedStats = CalendarDataService.calculateCalendarStats(days)
        setStats(calculatedStats)
      } catch (err) {
        console.error('Failed to load calendar stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [user?.id, period])

  return { stats, isLoading }
}
