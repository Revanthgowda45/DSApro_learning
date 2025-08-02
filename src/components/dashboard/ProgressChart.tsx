import { useState, useEffect } from 'react';
import { UserSessionService } from '../../services/userSessionService';
import { useAuth } from '../../context/AuthContext';
import { useOptimizedAnalytics } from '../../hooks/useOptimizedAnalytics';

export default function ProgressChart() {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<Array<{ day: string; problems: number; time: number }>>([]);
  const [loading, setLoading] = useState(true);
  
  // Use optimized analytics for better performance
  const { metrics } = useOptimizedAnalytics();
  
  useEffect(() => {
    if (user?.id) {
      loadWeeklyData();
    }
  }, [user?.id, metrics]); // Reload when metrics change
  
  const loadWeeklyData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);
      
      const startDate = weekAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      console.log('📈 Loading weekly chart data from Supabase:', { userId: user.id, startDate, endDate });
      
      // Get user sessions from Supabase for the last 7 days
      const sessions = await UserSessionService.getUserSessions(user.id, startDate, endDate);
      
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Get last 7 days of data
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        // Find sessions for this day
        const daySessions = sessions.filter((session: any) => 
          session.session_date === dateString
        );
        
        const problems = daySessions.reduce((sum: number, session: any) => 
          sum + (session.problems_solved || 0), 0
        );
        const time = daySessions.reduce((sum: number, session: any) => 
          sum + Math.round((session.time_spent || 0) / 60), 0 // Convert seconds to minutes
        );
        
        weeklyData.push({
          day: weekDays[date.getDay()],
          problems,
          time
        });
      }
      
      console.log('✅ Weekly chart data loaded:', weeklyData);
      setWeekData(weeklyData);
      
    } catch (error) {
      console.error('❌ Error loading weekly chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxProblems = Math.max(...weekData.map(d => d.problems));

  if (loading) {
    return (
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Problems Solved</h3>
        <div className="flex items-end space-x-2 h-32">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-md relative flex-1 animate-pulse">
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">-</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Problems Solved Chart */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Problems Solved</h3>
        <div className="flex items-end space-x-2 h-32">
          {weekData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-md relative flex-1 flex items-end">
                <div
                  className="w-full bg-green-500 dark:bg-green-400 rounded-t-md transition-all duration-300 hover:bg-green-600 dark:hover:bg-green-500"
                  style={{
                    height: `${maxProblems > 0 ? (data.problems / maxProblems) * 100 : 0}%`,
                    minHeight: data.problems > 0 ? '8px' : '0px'
                  }}
                  title={`${data.problems} problems`}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{data.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}