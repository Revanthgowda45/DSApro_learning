import { useState, useEffect } from 'react';
import { Flame, TrendingUp, Calendar, Award, Target } from 'lucide-react';
import { UserSessionService } from '../../services/userSessionService';
import { useAuth } from '../../context/AuthContext';
import { useOptimizedAnalytics } from '../../hooks/useOptimizedAnalytics';

export default function StreakTracker() {
  const { user } = useAuth();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  
  // Use optimized analytics for better performance
  const { metrics: progressMetrics, loading } = useOptimizedAnalytics();

  // Generate last 35 days for a 5x7 calendar grid using real Supabase data
  const generateCalendarDays = async () => {
    if (!user?.id) return [];
    
    try {
      const days = [];
      const today = new Date();
      
      // Get sessions for the last 35 days from Supabase
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 34);
      
      const sessions = await UserSessionService.getUserSessions(
        user.id,
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      
      for (let i = 34; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        // Find sessions for this date
        const daySession = sessions.find((session: any) => 
          session.session_date === dateString
        );
        
        const problemCount = daySession ? (daySession.problems_solved || 0) : 0;
        const hasPracticed = problemCount > 0;
        
        days.push({
          date,
          hasPracticed,
          problemCount,
          isToday: i === 0,
          timeSpent: daySession ? Math.round((daySession.time_spent || 0) / 60) : 0 // Convert seconds to minutes
        });
      }
      
      return days;
    } catch (error) {
      console.error('❌ Error generating calendar days:', error);
      return [];
    }
  };

  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Load calendar days when component mounts or metrics change
  useEffect(() => {
    const loadCalendarDays = async () => {
      const days = await generateCalendarDays();
      setCalendarDays(days);
    };
    
    if (user?.id && progressMetrics) {
      loadCalendarDays();
    }
  }, [user?.id, progressMetrics]);

  const getIntensityColor = (problemCount: number, isHovered: boolean = false) => {
    const baseClasses = 'transition-all duration-300 ease-out';
    const hoverEffect = isHovered ? 'scale-110 shadow-lg' : '';
    
    if (problemCount === 0) {
      return `bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 ${baseClasses} ${hoverEffect}`;
    }
    if (problemCount <= 1) {
      return `bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 ${baseClasses} ${hoverEffect}`;
    }
    if (problemCount <= 2) {
      return `bg-green-200 dark:bg-green-800/60 border border-green-300 dark:border-green-700 ${baseClasses} ${hoverEffect}`;
    }
    if (problemCount <= 3) {
      return `bg-green-400 dark:bg-green-600 border border-green-500 dark:border-green-500 ${baseClasses} ${hoverEffect}`;
    }
    return `bg-green-500 dark:bg-green-500 border border-green-600 dark:border-green-400 ${baseClasses} ${hoverEffect}`;
  };

  const getTodayRingColor = (problemCount: number) => {
    if (problemCount === 0) return 'ring-blue-400 dark:ring-blue-500';
    return 'ring-green-500 dark:ring-green-400';
  };

  const formatTooltip = (day: any) => {
    const dateStr = day.date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (day.problemCount === 0) {
      return `${dateStr}: No practice`;
    }
    
    const problemText = day.problemCount === 1 ? 'problem' : 'problems';
    const timeText = day.timeSpent > 0 ? ` • ${day.timeSpent}min` : '';
    return `${dateStr}: ${day.problemCount} ${problemText}${timeText}`;
  };

  const currentStreak = progressMetrics?.currentStreak || 0;
  const longestStreak = progressMetrics?.longestStreak || 0;
  const totalDays = calendarDays.filter(day => day.hasPracticed).length;
  const totalProblems = calendarDays.reduce((sum, day) => sum + day.problemCount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
        
        {/* Loading Calendar */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, index) => (
            <div key={index} className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2">
            <Flame className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Current</span>
          </div>
          <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
            {currentStreak} days
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Best</span>
          </div>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {longestStreak} days
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-3">
        {/* Month indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Last 5 weeks
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {totalDays} active days
          </div>
        </div>
        
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
          {weekDays.map((day, index) => (
            <div key={index} className="py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                w-7 h-7 rounded-md cursor-pointer relative group
                ${getIntensityColor(day.problemCount, hoveredDay === index)}
                ${day.isToday ? `ring-2 ${getTodayRingColor(day.problemCount)}` : ''}
              `}
              onMouseEnter={() => setHoveredDay(index)}
              onMouseLeave={() => setHoveredDay(null)}
              title={formatTooltip(day)}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                {formatTooltip(day)}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
              </div>
              
              {/* Today indicator */}
              {day.isToday && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60"></div>
                </div>
              )}
              
              {/* Problem count indicator for high activity */}
              {day.problemCount > 3 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-900 dark:text-yellow-100">
                    {day.problemCount > 9 ? '9+' : day.problemCount}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">Less</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-200 dark:bg-green-800/60 border border-green-300 dark:border-green-700 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 dark:bg-green-600 border border-green-500 dark:border-green-500 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-500 dark:bg-green-500 border border-green-600 dark:border-green-400 rounded-sm"></div>
          </div>
          <span className="font-medium">More</span>
        </div>
        
        {/* Activity Summary */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Target className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Problems</span>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{totalProblems}</p>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Calendar className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Active Days</span>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{totalDays}</p>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <TrendingUp className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Consistency</span>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {Math.round((totalDays / 35) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}