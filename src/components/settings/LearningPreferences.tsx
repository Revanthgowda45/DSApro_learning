import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Target, Clock, Zap, Save, RotateCcw, CheckCircle, XCircle, Settings, BarChart3 } from 'lucide-react';

interface LearningPreferencesProps {
  onPreferencesUpdate?: () => void;
}

export default function LearningPreferences({ onPreferencesUpdate }: LearningPreferencesProps) {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Initialize preferences from user data and localStorage
  const initializePreferences = () => {
    const defaultDifficultyPrefs = {
      easy: true,
      medium: true,
      hard: false,
      veryHard: false
    };
    
    // Try to get difficulty preferences from localStorage first
    let difficultyPrefs = defaultDifficultyPrefs;
    let adaptiveDifficulty = true;
    
    try {
      const storedDifficultyPrefs = localStorage.getItem('dsa_difficulty_preferences');
      if (storedDifficultyPrefs) {
        const parsed = JSON.parse(storedDifficultyPrefs);
        difficultyPrefs = parsed.difficulties || defaultDifficultyPrefs;
        adaptiveDifficulty = parsed.adaptive !== undefined ? parsed.adaptive : true;
      } else if (user?.difficulty_preferences) {
        // Convert array to object format
        const userDiffPrefs = user.difficulty_preferences;
        if (Array.isArray(userDiffPrefs)) {
          difficultyPrefs = {
            easy: userDiffPrefs.includes('easy'),
            medium: userDiffPrefs.includes('medium'),
            hard: userDiffPrefs.includes('hard'),
            veryHard: userDiffPrefs.includes('very_hard')
          };
        }
        adaptiveDifficulty = user.adaptive_difficulty !== undefined ? user.adaptive_difficulty : true;
      }
    } catch (error) {
      console.warn('Error loading difficulty preferences:', error);
    }
    
    return {
      dailyTimeLimit: user?.daily_time_limit || 120,
      learningPace: user?.learning_pace || 'slow' as 'slow' | 'medium' | 'fast',
      difficultyPreferences: difficultyPrefs,
      adaptiveDifficulty
    };
  };
  
  const [preferences, setPreferences] = useState(initializePreferences);
  const [originalPreferences, setOriginalPreferences] = useState(initializePreferences);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setOriginalPreferences({
      dailyTimeLimit: user?.daily_time_limit || 120,
      learningPace: user?.learning_pace || 'slow',
      difficultyPreferences: { ...preferences.difficultyPreferences },
      adaptiveDifficulty: preferences.adaptiveDifficulty
    });
  };

  const handleCancel = () => {
    setPreferences(originalPreferences);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      if (user) {
        // Convert difficulty preferences object to array format for User interface
        const difficultyArray: string[] = [];
        if (preferences.difficultyPreferences.easy) difficultyArray.push('easy');
        if (preferences.difficultyPreferences.medium) difficultyArray.push('medium');
        if (preferences.difficultyPreferences.hard) difficultyArray.push('hard');
        if (preferences.difficultyPreferences.veryHard) difficultyArray.push('very_hard');
        
        // Update user data using AuthContext updateUser method
        const userData = {
          daily_time_limit: preferences.dailyTimeLimit,
          learning_pace: preferences.learningPace,
          difficulty_preferences: difficultyArray,
          adaptive_difficulty: preferences.adaptiveDifficulty
        };
        
        // Use AuthContext updateUser method for real-time updates
        await updateUser(userData);
        
        // Also save difficulty preferences separately for AI system
        localStorage.setItem('dsa_difficulty_preferences', JSON.stringify({
          difficulties: preferences.difficultyPreferences,
          adaptive: preferences.adaptiveDifficulty
        }));
        
        // Trigger AI recommendation system update
        const event = new CustomEvent('learningPreferencesUpdated', {
          detail: {
            dailyTimeLimit: preferences.dailyTimeLimit,
            learningPace: preferences.learningPace,
            difficultyPreferences: preferences.difficultyPreferences,
            adaptiveDifficulty: preferences.adaptiveDifficulty
          }
        });
        window.dispatchEvent(event);
        
        setIsEditing(false);
        // Show success notification
        showNotification('Learning preferences updated successfully!', 'success');
        
        // Call the callback to update parent component
        if (onPreferencesUpdate) {
          onPreferencesUpdate();
        }
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showNotification('Failed to save preferences. Please try again.', 'error');
    }
  };

  const getPaceDescription = (pace: string) => {
    switch (pace) {
      case 'slow':
        return '2-3 problems per day, focus on understanding';
      case 'medium':
        return '4-5 problems per day, balanced approach';
      case 'fast':
        return '6+ problems per day, intensive practice';
      default:
        return '';
    }
  };

  const getPaceColor = (pace: string) => {
    switch (pace) {
      case 'slow':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
      case 'fast':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300';
    }
  };

  const getTimeLimitRecommendation = (timeLimit: number) => {
    if (timeLimit <= 60) return 'Light practice session';
    if (timeLimit <= 120) return 'Recommended for consistent progress';
    if (timeLimit <= 180) return 'Intensive learning session';
    return 'Extended practice session';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Learning Preferences</h2>
        </div>
        
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <span>Edit</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancel}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Time Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Daily Time Limit
          </label>
          
          {!isEditing ? (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {preferences.dailyTimeLimit} minutes
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="15"
                  value={preferences.dailyTimeLimit}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    dailyTimeLimit: parseInt(e.target.value)
                  }))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[4rem]">
                  {preferences.dailyTimeLimit} min
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getTimeLimitRecommendation(preferences.dailyTimeLimit)}
              </p>
            </div>
          )}
        </div>
        
        {/* Learning Pace */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Learning Pace
          </label>
          
          {!isEditing ? (
            <div className="space-y-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaceColor(preferences.learningPace)}`}>
                <Zap className="h-3 w-3 mr-1" />
                {preferences.learningPace}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getPaceDescription(preferences.learningPace)}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(['slow', 'medium', 'fast'] as const).map((pace) => (
                <label key={pace} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="learningPace"
                    value={pace}
                    checked={preferences.learningPace === pace}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      learningPace: e.target.value as 'slow' | 'medium' | 'fast'
                    }))}
                    className="h-4 w-4 text-green-600 dark:text-green-500 focus:ring-green-500 dark:focus:ring-green-400 border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPaceColor(pace)}`}>
                        <Zap className="h-3 w-3 mr-1" />
                        {pace}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getPaceDescription(pace)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Difficulty Preferences Section */}
      <div className="mt-8">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Problem Difficulty Preferences</h3>
        </div>
        
        <div className="space-y-4">
          {/* Adaptive Difficulty Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Adaptive Difficulty</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Let AI automatically adjust difficulty based on your progress
              </p>
            </div>
            <button
              onClick={() => setPreferences(prev => ({
                ...prev,
                adaptiveDifficulty: !prev.adaptiveDifficulty
              }))}
              disabled={!isEditing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 ${
                preferences.adaptiveDifficulty ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
              } ${!isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.adaptiveDifficulty ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Manual Difficulty Selection */}
          {!preferences.adaptiveDifficulty && (
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Select Problem Difficulties
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'easy', label: 'Easy', color: 'green', description: 'Beginner friendly' },
                  { key: 'medium', label: 'Medium', color: 'yellow', description: 'Moderate challenge' },
                  { key: 'hard', label: 'Hard', color: 'orange', description: 'Advanced level' },
                  { key: 'veryHard', label: 'Very Hard', color: 'red', description: 'Expert level' }
                ].map((difficulty) => (
                  <label key={difficulty.key} className="flex flex-col space-y-2 cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={preferences.difficultyPreferences[difficulty.key as keyof typeof preferences.difficultyPreferences]}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          difficultyPreferences: {
                            ...prev.difficultyPreferences,
                            [difficulty.key]: e.target.checked
                          }
                        }))}
                        disabled={!isEditing}
                        className="h-4 w-4 text-green-600 dark:text-green-500 focus:ring-green-500 dark:focus:ring-green-400 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        difficulty.color === 'green' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                        difficulty.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' :
                        difficulty.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' :
                        'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                      }`}>
                        {difficulty.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                      {difficulty.description}
                    </p>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* Default Settings */}
          {isEditing && (
            <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Reset to Defaults
                  </h4>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Restore recommended settings for optimal learning
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreferences({
                    dailyTimeLimit: 120,
                    learningPace: 'slow',
                    difficultyPreferences: {
                      easy: true,
                      medium: true,
                      hard: false,
                      veryHard: false
                    },
                    adaptiveDifficulty: true
                  });
                }}
                className="px-3 py-1.5 text-sm font-medium text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors"
              >
                Reset Defaults
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* AI Impact Notice */}
      {isEditing && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                AI Recommendation Impact
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Changing these preferences will update your AI-powered daily recommendations, 
                problem difficulty progression, and learning path optimization to match your new goals.
              </p>
            </div>
          </div>
        </div>
      )}
      
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
    </div>
  );
}
