import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Target, 
  Clock, 
  Flame, 
  Award, 
  Zap, 
  BookOpen, 
  CheckCircle, 
  X 
} from 'lucide-react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useAuth } from '../../context/AuthContext';
import type { CalendarDay } from '../../services/calendarDataService';

export default function EnhancedCalendar() {
  const { user } = useAuth();
  const {
    calendarDays,
    stats,
    error,
    currentDate,
    refreshData,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDay,
    selectedDay
  } = useCalendarData({ period: 'month', autoRefresh: true });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];



  // Handle day click
  const handleDayClick = (day: CalendarDay) => {
    if (day.hasPracticed) {
      selectDay(selectedDay?.date.getTime() === day.date.getTime() ? null : day);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await refreshData();
  };

  // Format time display
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get activity color based on problem count
  const getActivityColor = (day: CalendarDay) => {
    if (!day.hasPracticed) return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    
    if (day.problemCount >= 5) return 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-500';
    if (day.problemCount >= 3) return 'bg-green-400 dark:bg-green-500 border-green-500 dark:border-green-400';
    if (day.problemCount >= 2) return 'bg-green-300 dark:bg-green-600/70 border-green-400 dark:border-green-500';
    return 'bg-green-200 dark:bg-green-700/50 border-green-300 dark:border-green-600';
  };
  
  // Get day styling
  const getDayStyle = (day: CalendarDay) => {
    let baseStyle = 'relative h-12 w-full border rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ';
    
    if (!day.isCurrentMonth) {
      baseStyle += 'opacity-40 ';
    }
    
    if (day.isToday) {
      baseStyle += 'ring-2 ring-blue-500 dark:ring-blue-400 ';
    }
    
    if (selectedDay && selectedDay.date.getTime() === day.date.getTime()) {
      baseStyle += 'ring-2 ring-purple-500 dark:ring-purple-400 ';
    }
    
    baseStyle += getActivityColor(day);
    
    return baseStyle;
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Please log in to view your calendar
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Smart Calendar
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Refresh calendar data"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-1.5">
            <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Problems</span>
          </div>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-0.5">
            {stats?.totalProblems || 0}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
          <div className="flex items-center space-x-1.5">
            <Flame className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-800 dark:text-green-200">Active Days</span>
          </div>
          <p className="text-lg font-bold text-green-900 dark:text-green-100 mt-0.5">
            {stats?.activeDays || 0}
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Total Time</span>
          </div>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-100 mt-0.5">
            {formatTime(stats?.totalTime || 0)}
          </p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center space-x-1.5">
            <Zap className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Streak</span>
          </div>
          <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mt-0.5">
            {stats?.currentStreak || 0}
          </p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            Today
          </button>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="mb-6">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="h-8 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {day}
              </span>
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={getDayStyle(day)}
              onClick={() => handleDayClick(day)}
              title={day.hasPracticed ? `${day.problemCount} problems, ${formatTime(day.timeSpent)}` : 'No practice'}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                <span className={`text-sm font-medium ${
                  day.isCurrentMonth 
                    ? 'text-gray-900 dark:text-gray-100' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {day.date.getDate()}
                </span>
                {day.hasPracticed && (
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="text-xs font-bold text-current">
                      {day.problemCount}
                    </span>
                    {day.problemCount >= 5 && (
                      <Zap className="h-3 w-3 text-yellow-400" />
                    )}
                  </div>
                )}
              </div>
              
              {day.isToday && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              {selectedDay.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h4>
            <button
              onClick={() => selectDay(null)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Close details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {selectedDay.hasPracticed ? (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedDay.problemCount} problems solved
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formatTime(selectedDay.timeSpent)} spent
                  </span>
                </div>
                {selectedDay.isWeekend && (
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm text-yellow-700 dark:text-yellow-300">
                      Weekend practice!
                    </span>
                  </div>
                )}
              </div>
              
              {/* Solved Problems List */}
              {selectedDay.solvedProblems.length > 0 && (
                <div className="border-t border-blue-200 dark:border-blue-700 pt-4">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Problems Solved Today
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedDay.solvedProblems.map((problem, index) => (
                      <div key={`${problem.id}-${index}`} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {problem.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              problem.difficulty === 'Hard' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                              {problem.difficulty}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {problem.category}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(problem.timeSpent)}m
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(problem.solvedAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <p>No practice recorded for this day</p>
            </div>
          )}
        </div>
      )}

      {/* Best Day Highlight */}
      {stats?.bestDay && stats.bestDay.problemCount > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Best Day This Month: {stats.bestDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
              ({stats.bestDay.problemCount} problems, {formatTime(stats.bestDay.timeSpent)})
            </span>
          </div>
        </div>
      )}


    </div>
  );
}
