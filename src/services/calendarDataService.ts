import { supabase } from '../lib/supabase'
import { UserSessionService } from './userSessionService'
import { LocalStorageAnalytics } from './localStorageAnalytics'
import { getCachedProblems, type Problem } from '../data/dsaDatabase'

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  hasPracticed: boolean
  problemCount: number
  timeSpent: number
  isWeekend: boolean
  solvedProblems: SolvedProblem[]
  sessionData?: UserSessionData
}

export interface SolvedProblem {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard'
  category: string
  timeSpent: number
  solvedAt: string
  rating?: number
  attempts?: number
}

export interface UserSessionData {
  id: string
  sessionDate: string
  problemsSolved: number
  timeSpent: number
  topicsCovered: string[]
  streakDay: number
}

export interface CalendarStats {
  totalProblems: number
  activeDays: number
  totalTime: number
  averageProblems: number
  bestDay: CalendarDay | null
  consistencyPercentage: number
  currentStreak: number
  longestStreak: number
  topCategories: Array<{ category: string; count: number }>
  difficultyBreakdown: Record<string, number>
}

export class CalendarDataService {
  private static problemsMap: Record<string, Problem> = {}
  
  // Helper function to format date as YYYY-MM-DD in local timezone
  private static formatDateLocal(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Initialize problems map for quick lookups
  private static initializeProblemsMap() {
    if (Object.keys(this.problemsMap).length === 0) {
      const allProblems = getCachedProblems()
      this.problemsMap = allProblems.reduce((acc, problem) => {
        acc[problem.id] = problem
        return acc
      }, {} as Record<string, Problem>)
    }
  }

  /**
   * Detect and fetch real calendar data from Supabase with local fallback
   */
  static async getCalendarData(
    userId: string,
    year: number,
    month: number,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<CalendarDay[]> {
    this.initializeProblemsMap()
    
    console.log('📅 Fetching calendar data for:', { userId, year, month, period })
    
    // Generate empty calendar structure first
    const calendarDays = this.generateEmptyCalendarStructure(year, month, period)
    
    if (!userId) {
      console.log('📱 No user ID, returning empty calendar')
      return calendarDays
    }

    try {
      // Try to fetch real data from Supabase
      const realData = await this.fetchSupabaseCalendarData(userId, year, month, period)
      
      if (realData && (realData.sessions.length > 0 || realData.problemProgress.length > 0)) {
        console.log('✅ Using real Supabase calendar data:', realData.sessions.length, 'sessions,', realData.problemProgress.length, 'progress entries')
        return this.mergeSupabaseDataWithCalendar(calendarDays, realData)
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch Supabase calendar data:', error)
    }

    // Fallback to localStorage data
    console.log('📱 Falling back to localStorage calendar data')
    return this.mergeLocalStorageDataWithCalendar(calendarDays, userId)
  }

  /**
   * Generate empty calendar structure for the specified period
   */
  private static generateEmptyCalendarStructure(
    year: number,
    month: number,
    period: 'week' | 'month' | 'quarter'
  ): CalendarDay[] {
    const days: CalendarDay[] = []
    const today = new Date()
    
    let startDate: Date
    let daysToGenerate: number
    
    if (period === 'week') {
      // Generate current week
      startDate = new Date(today)
      startDate.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
      daysToGenerate = 7
    } else if (period === 'quarter') {
      // Generate last 90 days
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 89)
      daysToGenerate = 90
    } else {
      // Generate calendar month view (6 weeks = 42 days)
      const firstDay = new Date(year, month, 1)
      startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())
      daysToGenerate = 42
    }
    
    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i)
      
      const isCurrentMonth = period === 'month' ? date.getMonth() === month : true
      const isToday = date.toDateString() === today.toDateString()
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        hasPracticed: false,
        problemCount: 0,
        timeSpent: 0,
        isWeekend,
        solvedProblems: []
      })
    }
    
    return days
  }

  /**
   * Fetch real calendar data from Supabase
   */
  private static async fetchSupabaseCalendarData(
    userId: string,
    year: number,
    month: number,
    period: 'week' | 'month' | 'quarter'
  ) {
    const today = new Date()
    let startDate: string
    let endDate: string
    
    if (period === 'week') {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      startDate = weekStart.toISOString().split('T')[0]
      endDate = weekEnd.toISOString().split('T')[0]
    } else if (period === 'quarter') {
      const quarterStart = new Date(today)
      quarterStart.setDate(today.getDate() - 89)
      
      startDate = quarterStart.toISOString().split('T')[0]
      endDate = today.toISOString().split('T')[0]
    } else {
      // Month view - get data for the entire month plus adjacent days
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0)
      
      // Extend to cover calendar view (previous and next month days)
      const calendarStart = new Date(monthStart)
      calendarStart.setDate(calendarStart.getDate() - monthStart.getDay())
      const calendarEnd = new Date(monthEnd)
      calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()))
      
      startDate = calendarStart.toISOString().split('T')[0]
      endDate = calendarEnd.toISOString().split('T')[0]
    }

    console.log('🔍 Fetching Supabase data for date range:', { startDate, endDate })

    // Fetch user sessions and problem progress in parallel
    const [sessions, problemProgress] = await Promise.all([
      UserSessionService.getUserSessions(userId, startDate, endDate),
      this.fetchProblemProgressInDateRange(userId, startDate, endDate)
    ])

    return {
      sessions: sessions || [],
      problemProgress: problemProgress || []
    }
  }

  /**
   * Fetch problem progress within date range
   */
  private static async fetchProblemProgressInDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      if (!supabase) return []
      
      const { data, error } = await supabase
        .from('problem_progress')
        .select('*')
        .eq('user_id', userId)
        .not('solved_at', 'is', null)
        .gte('solved_at', startDate)
        .lte('solved_at', endDate + 'T23:59:59')
        .order('solved_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching problem progress:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.warn('Failed to fetch problem progress:', error)
      return []
    }
  }

  /**
   * Merge Supabase data with calendar structure
   */
  private static mergeSupabaseDataWithCalendar(
    calendarDays: CalendarDay[],
    supabaseData: { sessions: any[], problemProgress: any[] }
  ): CalendarDay[] {
    const { sessions, problemProgress } = supabaseData
    
    // Create maps for quick lookups
    const sessionsMap = new Map<string, any>()
    sessions.forEach(session => {
      sessionsMap.set(session.session_date, session)
    })
    
    const problemsByDate = new Map<string, any[]>()
    problemProgress.forEach(progress => {
      if (progress.solved_at) {
        const date = progress.solved_at.split('T')[0]
        if (!problemsByDate.has(date)) {
          problemsByDate.set(date, [])
        }
        problemsByDate.get(date)!.push(progress)
      }
    })
    
    // Merge data with calendar days
    return calendarDays.map(day => {
      const dateStr = this.formatDateLocal(day.date)
      const session = sessionsMap.get(dateStr)
      const dayProblems = problemsByDate.get(dateStr) || []
      
      const solvedProblems: SolvedProblem[] = dayProblems.map(progress => {
        const problem = this.problemsMap[progress.problem_id]
        return {
          id: progress.problem_id,
          title: problem?.title || `Problem ${progress.problem_id}`,
          difficulty: (problem?.difficulty as any) || 'Medium',
          category: problem?.category || 'Unknown',
          timeSpent: progress.time_spent || 0,
          solvedAt: progress.solved_at,
          rating: progress.rating,
          attempts: progress.attempts
        }
      })
      
      return {
        ...day,
        hasPracticed: dayProblems.length > 0 || (session ? session.problems_solved > 0 : false),
        problemCount: dayProblems.length, // Always use actual problem progress count
        timeSpent: solvedProblems.reduce((sum, p) => sum + p.timeSpent, 0) || (session ? session.time_spent : 0),
        solvedProblems,
        sessionData: session ? {
          id: session.id,
          sessionDate: session.session_date,
          problemsSolved: session.problems_solved,
          timeSpent: session.time_spent,
          topicsCovered: session.topics_covered || [],
          streakDay: session.streak_day || 0
        } : undefined
      }
    })
  }

  /**
   * Merge localStorage data with calendar structure (fallback)
   */
  private static mergeLocalStorageDataWithCalendar(
    calendarDays: CalendarDay[],
    userId: string
  ): CalendarDay[] {
    const localSessions = LocalStorageAnalytics.getUserSessions()
    const localProgress = this.getLocalProblemProgress(userId)
    
    // Create maps for quick lookups
    const sessionsByDate = new Map<string, any>()
    localSessions.forEach(session => {
      sessionsByDate.set(session.date, session)
    })
    
    const problemsByDate = new Map<string, any[]>()
    localProgress.forEach((progress: any) => {
      if (progress.solvedAt) {
        const date = progress.solvedAt.split('T')[0]
        if (!problemsByDate.has(date)) {
          problemsByDate.set(date, [])
        }
        problemsByDate.get(date)!.push(progress)
      }
    })
    
    return calendarDays.map(day => {
      const dateStr = this.formatDateLocal(day.date)
      const session = sessionsByDate.get(dateStr)
      const dayProblems = problemsByDate.get(dateStr) || []
      
      const solvedProblems: SolvedProblem[] = dayProblems.map(progress => {
        const problem = this.problemsMap[progress.problemId]
        return {
          id: progress.problemId,
          title: problem?.title || `Problem ${progress.problemId}`,
          difficulty: (problem?.difficulty as any) || 'Medium',
          category: problem?.category || 'Unknown',
          timeSpent: progress.timeSpent || 0,
          solvedAt: progress.solvedAt,
          rating: progress.rating,
          attempts: progress.attempts
        }
      })
      
      return {
        ...day,
        hasPracticed: dayProblems.length > 0 || (session ? session.problemCount > 0 : false),
        problemCount: dayProblems.length, // Always use actual problem progress count
        timeSpent: solvedProblems.reduce((sum, p) => sum + p.timeSpent, 0) || (session ? session.timeSpent : 0),
        solvedProblems
      }
    })
  }

  /**
   * Get local problem progress from localStorage
   */
  private static getLocalProblemProgress(userId: string): any[] {
    try {
      const stored = localStorage.getItem(`dsa_problem_progress_${userId}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Calculate comprehensive calendar statistics
   */
  static calculateCalendarStats(calendarDays: CalendarDay[]): CalendarStats {
    const activeDays = calendarDays.filter(day => day.hasPracticed)
    const totalProblems = activeDays.reduce((sum, day) => sum + day.problemCount, 0)
    const totalTime = activeDays.reduce((sum, day) => sum + day.timeSpent, 0)
    
    // Find best day
    const bestDay = activeDays.reduce((best, day) => 
      day.problemCount > (best?.problemCount || 0) ? day : best, null as CalendarDay | null
    )
    
    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(calendarDays)
    
    // Calculate category breakdown
    const categoryCount = new Map<string, number>()
    const difficultyCount = new Map<string, number>()
    
    activeDays.forEach(day => {
      day.solvedProblems.forEach(problem => {
        categoryCount.set(problem.category, (categoryCount.get(problem.category) || 0) + 1)
        difficultyCount.set(problem.difficulty, (difficultyCount.get(problem.difficulty) || 0) + 1)
      })
    })
    
    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    const difficultyBreakdown = Object.fromEntries(difficultyCount)
    
    return {
      totalProblems,
      activeDays: activeDays.length,
      totalTime,
      averageProblems: activeDays.length > 0 ? Math.round((totalProblems / activeDays.length) * 10) / 10 : 0,
      bestDay,
      consistencyPercentage: Math.round((activeDays.length / calendarDays.length) * 100),
      currentStreak,
      longestStreak,
      topCategories,
      difficultyBreakdown
    }
  }

  /**
   * Calculate current and longest streaks
   */
  private static calculateStreaks(calendarDays: CalendarDay[]): { currentStreak: number, longestStreak: number } {
    const sortedDays = [...calendarDays].sort((a, b) => a.date.getTime() - b.date.getTime())
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Calculate current streak (from today backwards)
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const day = sortedDays[i]
      const dayDate = new Date(day.date)
      dayDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === currentStreak && day.hasPracticed) {
        currentStreak++
      } else if (daysDiff === currentStreak && daysDiff === 0) {
        // Today with no practice - check yesterday
        continue
      } else {
        break
      }
    }
    
    // Calculate longest streak
    for (const day of sortedDays) {
      if (day.hasPracticed) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }
    
    return { currentStreak, longestStreak }
  }

  /**
   * Get calendar data for a specific date range
   */
  static async getDateRangeData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarDay[]> {
    this.initializeProblemsMap()
    
    const days: CalendarDay[] = []
    const today = new Date()
    
    // Generate days for the range
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const isToday = currentDate.toDateString() === today.toDateString()
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: true,
        isToday,
        hasPracticed: false,
        problemCount: 0,
        timeSpent: 0,
        isWeekend,
        solvedProblems: []
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    if (!userId) return days
    
    try {
      // Fetch data for the range
      const supabaseData = await this.fetchSupabaseCalendarData(
        userId, 
        startDate.getFullYear(), 
        startDate.getMonth(), 
        'quarter'
      )
      
      if (supabaseData && (supabaseData.sessions.length > 0 || supabaseData.problemProgress.length > 0)) {
        return this.mergeSupabaseDataWithCalendar(days, supabaseData)
      }
    } catch (error) {
      console.warn('Failed to fetch date range data from Supabase:', error)
    }
    
    // Fallback to localStorage
    return this.mergeLocalStorageDataWithCalendar(days, userId)
  }
}
