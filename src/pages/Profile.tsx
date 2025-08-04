import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Clock, Zap, Target, Save, Edit, CheckCircle, XCircle, Calendar, TrendingUp, Camera } from 'lucide-react';
import { useOptimizedAnalytics } from '../hooks/useOptimizedAnalytics';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import EnhancedCalendar from '../components/profile/EnhancedCalendar';
import AvatarUpload from '../components/ui/AvatarUpload';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { metrics } = useOptimizedAnalytics();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Performance monitoring
  useEffect(() => {
    const monitor = PerformanceMonitor.monitorComponent('Profile');
    const endRender = monitor.onRenderStart();
    
    return () => {
      endRender();
    };
  }, []);
  
  // Memoized form data initialization
  const initialFormData = useMemo(() => ({
    name: user?.full_name || user?.username || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    dailyTimeLimit: user?.daily_time_limit || 120,
    learningPace: user?.learning_pace || 'slow'
  }), [user]);
  
  const [formData, setFormData] = useState(initialFormData);
  const [originalData, setOriginalData] = useState(initialFormData);
  
  // Optimized stats from analytics
  const stats = useMemo(() => ({
    totalSolved: metrics?.solvedProblems || 0,
    currentStreak: metrics?.currentStreak || 0,
    longestStreak: metrics?.longestStreak || 0,
    memberSince: 'March 2024' // This could be dynamic based on first session
  }), [metrics]);
  
  // Update form data when user changes
  useEffect(() => {
    setFormData(initialFormData);
    setOriginalData(initialFormData);
  }, [initialFormData]);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleSave = useCallback(() => {
    const timer = PerformanceMonitor.startTimer('profile_save');
    
    try {
      // Update user data using AuthContext
      if (user && updateUser) {
        updateUser({
          full_name: formData.name,
          daily_time_limit: formData.dailyTimeLimit,
          learning_pace: formData.learningPace as 'slow' | 'medium' | 'fast'
        });
        
        // Trigger AI recommendation system update
        const event = new CustomEvent('learningPreferencesUpdated', {
          detail: {
            dailyTimeLimit: formData.dailyTimeLimit,
            learningPace: formData.learningPace
          }
        });
        window.dispatchEvent(event);
        
        setOriginalData({ ...formData });
        setIsEditing(false);
        showNotification('Profile updated successfully!', 'success');
        timer();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Failed to update profile. Please try again.', 'error');
      timer();
    }
  }, [user, updateUser, formData, showNotification]);

  const handleCancel = useCallback(() => {
    setFormData({ ...originalData });
    setIsEditing(false);
  }, [originalData]);



  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dailyTimeLimit' ? parseInt(value) : value
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account information and learning preferences
          </p>
        </div>

        {/* User Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-lg">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user?.full_name || user?.username || 'User'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to User icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                      }
                    }}
                  />
                ) : (
                  <User className="h-10 w-10 text-white" />
                )}
              </div>
              {/* Edit Avatar Button - Always Visible */}
              <button
                onClick={() => setShowAvatarUpload(true)}
                className="absolute -bottom-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-all duration-200"
                title="Edit Profile Picture"
              >
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold mb-2">{user?.full_name || user?.username || 'User'}</h2>
              <p className="text-blue-100 dark:text-blue-200 text-lg">{user?.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  {stats.totalSolved} Problems Solved
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  {stats.currentStreak} Day Streak
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  Active Learner
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Account Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Information</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Update your personal details and preferences</p>
                </div>
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400' : ''
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled={true}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dailyTimeLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Daily Time Limit (minutes)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="dailyTimeLimit"
                      name="dailyTimeLimit"
                      type="number"
                      min="30"
                      max="480"
                      value={formData.dailyTimeLimit}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400' : ''
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {formData.dailyTimeLimit <= 60 ? 'Light practice session' :
                     formData.dailyTimeLimit <= 120 ? 'Recommended for consistent progress' :
                     formData.dailyTimeLimit <= 180 ? 'Intensive learning session' :
                     'Extended practice session'}
                  </p>
                </div>

                <div>
                  <label htmlFor="learningPace" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Learning Pace
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Zap className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <select
                      id="learningPace"
                      name="learningPace"
                      value={formData.learningPace}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400' : ''
                      }`}
                    >
                      <option value="slow">Slow & Steady (2-3 problems/day)</option>
                      <option value="medium">Medium (4-5 problems/day)</option>
                      <option value="fast">Fast Track (6+ problems/day)</option>
                    </select>
                  </div>
                </div>

                {/* AI Impact Notice */}
                {isEditing && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">AI System Update</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Changes to your learning preferences will update your AI recommendations and daily problem suggestions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>


          </div>
          {/* Right Column - Stats & Info */}
          <div className="space-y-8">
            {/* Achievement Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Achievement Overview</h3>
                <TrendingUp className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalSolved}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Problems Solved</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-700">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.currentStreak}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Member since</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats.memberSince}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Best streak</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats.longestStreak} days</span>
                </div>
              </div>
            </div>

            {/* Learning Preferences */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Learning Preferences</h3>
               <div className="space-y-3">
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Daily Goal</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">{formData.dailyTimeLimit} minutes</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Learning Pace</p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400 capitalize">{formData.learningPace}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Calendar Section */}
        <EnhancedCalendar />
      </div>
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}
      
      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Update Profile Picture
              </h3>
              <button
                onClick={() => setShowAvatarUpload(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <AvatarUpload
                currentAvatarUrl={user?.avatar_url}
                onAvatarUpdate={() => {
                  showNotification('Profile picture updated successfully!', 'success');
                  setShowAvatarUpload(false);
                }}
                size="large"
              />
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAvatarUpload(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}