import { useState, useEffect, useMemo } from 'react';
import { Timer, Clock, BarChart3, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { timeTrackingService, ProblemTimeEntry } from '../services/timeTrackingService';
import Stopwatch from '../components/ui/Stopwatch';

export default function StopwatchPage() {
  const { user } = useAuth();
  const [recentSessions, setRecentSessions] = useState<ProblemTimeEntry[]>([]);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [averageSession, setAverageSession] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUserStats();
    } else {
      setIsLoading(false);
    }
    // Clean up any orphaned timers on page load (non-blocking)
    setTimeout(() => timeTrackingService.cleanupOrphanedTimers(), 0);
  }, [user?.id]);

  const loadUserStats = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Get recent time entries with reduced limit for faster loading
      const entries = await timeTrackingService.getUserTimeEntries(user.id, 5);
      setRecentSessions(entries);

      // Use memoized calculations
      const stats = calculateStats(entries);
      setTotalTimeToday(stats.todayTotal);
      setTotalSessions(stats.totalSessions);
      setAverageSession(stats.averageSession);
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Set default values on error
      setRecentSessions([]);
      setTotalTimeToday(0);
      setTotalSessions(0);
      setAverageSession(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized stats calculation
  const calculateStats = useMemo(() => (entries: ProblemTimeEntry[]) => {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(entry => 
      entry.created_at && new Date(entry.created_at).toDateString() === today
    );
    
    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
    const totalSessions = entries.length;
    const totalTime = entries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
    const averageSession = totalSessions > 0 ? Math.floor(totalTime / totalSessions) : 0;
    
    return { todayTotal, totalSessions, averageSession };
  }, []);

  const handleTimeUpdate = (timeInSeconds: number) => {
    setCurrentTime(timeInSeconds);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'solved':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'mastered':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'attempted':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header - Show immediately */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Timer className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Problem Timer
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Track your problem-solving sessions and analyze your performance
            </p>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading your time tracking data...</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Timer className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Problem Timer
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track your problem-solving sessions and analyze your performance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stopwatch */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Current Session
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <Stopwatch 
                    size="lg"
                    onTimeUpdate={handleTimeUpdate}
                    className="justify-center"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-400">Current</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {timeTrackingService.formatDuration(currentTime)}
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Target className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-400">Today</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {timeTrackingService.formatDuration(totalTimeToday)}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {timeTrackingService.formatDuration(averageSession)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p className="mb-2">💡 <strong>Pro Tip:</strong> Use the timer while solving problems to track your progress!</p>
                <p>Visit the Problems page and click "Show Timer" on any problem card to start tracking.</p>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Your Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{totalSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Today's Time</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {timeTrackingService.formatDuration(totalTimeToday)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Session</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {timeTrackingService.formatDuration(averageSession)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Recent Sessions
              </h3>
              {recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Timer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No sessions yet. Start solving problems to see your history!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentSessions.map((session, index) => (
                    <div 
                      key={session.id || index}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          Problem #{session.problem_id.slice(-6)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {session.created_at && formatDate(session.created_at)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {timeTrackingService.formatDuration(session.duration_seconds)}
                        </span>
                        {session.status_at_end && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status_at_end)}`}>
                            {session.status_at_end}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📚 How to Use the Timer
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="space-y-2">
              <p><strong>1. Problem-Specific Timing:</strong> Go to the Problems page and expand any problem card to find the timer.</p>
              <p><strong>2. Auto-Stop:</strong> Timers automatically stop when you mark a problem as "Solved" or "Mastered".</p>
            </div>
            <div className="space-y-2">
              <p><strong>3. Session Tracking:</strong> Each timing session is saved with your problem progress.</p>
              <p><strong>4. Performance Analytics:</strong> View your solving patterns and improve your speed over time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
