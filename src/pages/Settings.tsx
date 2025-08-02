import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeSelector from '../components/settings/ThemeSelector';
import LearningPreferences from '../components/settings/LearningPreferences';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell,
  Shield,
  Download,
  Trash2
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    dailyReminders: true,
    streakAlerts: true,
    achievements: true
  });
  
  // Performance monitoring
  useEffect(() => {
    const monitor = PerformanceMonitor.monitorComponent('Settings');
    const endRender = monitor.onRenderStart();
    
    return () => {
      endRender();
    };
  }, []);

  // Optimized notification change handler
  const handleNotificationChange = useCallback((key: string) => {
    const timer = PerformanceMonitor.startTimer('settings_notification_change');
    
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
    
    // Save to localStorage or API
    try {
      localStorage.setItem('notifications', JSON.stringify({
        ...notifications,
        [key]: !notifications[key as keyof typeof notifications]
      }));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
    
    timer();
  }, [notifications]);
  
  // Optimized data export handler
  const handleDataExport = useCallback(async () => {
    const timer = PerformanceMonitor.startTimer('settings_data_export');
    
    try {
      // Implement data export logic
      console.log('Exporting user data...');
      // This would typically call an API to generate and download data
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      timer();
    }
  }, []);
  
  // Optimized account deletion handler
  const handleAccountDeletion = useCallback(async () => {
    const timer = PerformanceMonitor.startTimer('settings_account_deletion');
    
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // Implement account deletion logic
        console.log('Deleting account...');
        // This would typically call an API to delete the account
      } catch (error) {
        console.error('Failed to delete account:', error);
      } finally {
        timer();
      }
    } else {
      timer();
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Customize your DSA learning experience
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={user?.full_name || user?.username || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <SettingsIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
          </div>
          
          <ThemeSelector />
        </div>

        {/* Learning Preferences */}
        <LearningPreferences onPreferencesUpdate={() => {
          // Refresh the page or update local state when preferences change
          window.location.reload();
        }} />

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {key === 'dailyReminders' && 'Daily Study Reminders'}
                    {key === 'streakAlerts' && 'Streak Alerts'}
                    {key === 'achievements' && 'Achievement Notifications'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {key === 'dailyReminders' && 'Get reminded to practice daily'}
                    {key === 'streakAlerts' && 'Alerts when your streak is at risk'}
                    {key === 'achievements' && 'Celebrate your milestones'}
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationChange(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 ${
                    value ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Data & Privacy</h2>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={handleDataExport}
              className="flex items-center space-x-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Export Data
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Download your progress and statistics
                </p>
              </div>
            </button>
            
            <button 
              onClick={handleAccountDeletion}
              className="flex items-center space-x-3 w-full text-left p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Delete Account
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Permanently delete your account and data
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
