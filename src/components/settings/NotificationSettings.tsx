import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationService, type NotificationSettings } from '../../services/notificationService';

export default function NotificationSettings() {
  // Get default settings to ensure clean state
  const getDefaultSettings = (): NotificationSettings => ({
    ...NotificationService.getSettings(),
    morningStartTime: '09:00',
    afternoonBoostTime: '14:00', 
    eveningPracticeTime: '18:00',
    nightReflectionTime: '21:00',
    enableNightReflection: true
  });
  
  const [settings, setSettings] = useState<NotificationSettings>(getDefaultSettings());
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Reset to default timing on component mount
    const resetSettings = NotificationService.resetTimingToDefaults();
    setSettings(resetSettings);
  }, []);

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    NotificationService.saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    setIsResetting(true);
    
    // Use service method to reset timing
    const resetSettings = NotificationService.resetTimingToDefaults();
    setSettings(resetSettings);
    
    // Reset visual feedback after a short delay
    setTimeout(() => setIsResetting(false), 1000);
  };

  if (!NotificationService.isSupported()) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <span className="text-yellow-800 dark:text-yellow-200 font-medium">
            Notifications Not Supported
          </span>
        </div>
        <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
          Your browser doesn't support notifications. Please use a modern browser for the best experience.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Notification Settings
        </h3>
        <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </div>



      {/* Main Toggle */}
      <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Enable Notifications
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive reminders and updates
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleSettingChange('enabled', e.target.checked)}
            className="sr-only peer"

          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600 peer-disabled:opacity-50"></div>
        </label>
      </div>

      {/* Individual Settings */}
      {settings.enabled && (
        <div className="space-y-4">
          {/* Daily Reminder */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <label className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 block">
                  Professional Daily Reminders
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Receive 3-4 strategic reminders throughout the day
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('dailyReminder', !settings.dailyReminder)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800 shadow-sm ${
                  settings.dailyReminder
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200 dark:shadow-blue-900/50'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 shadow-md ${
                    settings.dailyReminder ? 'translate-x-5 shadow-lg' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {settings.dailyReminder && (
                <div className="ml-2 sm:ml-3 space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-lg">
                    {/* Mobile-optimized header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <h4 className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
                        📅 Customize Your Schedule
                      </h4>
                      <button
                        onClick={resetToDefaults}
                        disabled={isResetting}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors font-medium min-h-[36px] ${
                          isResetting
                            ? 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200'
                            : 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 hover:bg-blue-300 dark:hover:bg-blue-600 active:bg-blue-400 dark:active:bg-blue-500'
                        }`}
                      >
                        {isResetting ? '✓ Reset!' : '🔄 Reset'}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {/* Morning Start */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">🌅 Morning Start</span>
                        </div>
                        <div 
                          className="relative cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-md p-1.5 transition-colors w-full sm:w-auto"
                          onClick={() => {
                            const input = document.getElementById('morningStartTime') as HTMLInputElement;
                            if (input) {
                              input.focus();
                              try {
                                input.showPicker?.();
                              } catch (error) {
                                // Fallback to click if showPicker fails
                                input.click();
                              }
                            }
                          }}
                        >
                          <input
                            id="morningStartTime"
                            type="time"
                            value={settings.morningStartTime || '09:00'}
                            onChange={(e) => handleSettingChange('morningStartTime', e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 text-sm border border-blue-200 dark:border-blue-700 rounded-md bg-white dark:bg-blue-800 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-h-[36px] text-center"
                          />
                        </div>
                      </div>
                      
                      {/* Afternoon Boost */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">🎯 Afternoon Boost</span>
                        </div>
                        <div 
                          className="relative cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-md p-1.5 transition-colors w-full sm:w-auto"
                          onClick={() => {
                            const input = document.getElementById('afternoonBoostTime') as HTMLInputElement;
                            if (input) {
                              input.focus();
                              try {
                                input.showPicker?.();
                              } catch (error) {
                                // Fallback to click if showPicker fails
                                input.click();
                              }
                            }
                          }}
                        >
                          <input
                            id="afternoonBoostTime"
                            type="time"
                            value={settings.afternoonBoostTime || '14:00'}
                            onChange={(e) => handleSettingChange('afternoonBoostTime', e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 text-sm border border-blue-200 dark:border-blue-700 rounded-md bg-white dark:bg-blue-800 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-h-[36px] text-center"
                          />
                        </div>
                      </div>
                      
                      {/* Evening Practice */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">🌆 Evening Practice</span>
                        </div>
                        <div 
                          className="relative cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-md p-1.5 transition-colors w-full sm:w-auto"
                          onClick={() => {
                            const input = document.getElementById('eveningPracticeTime') as HTMLInputElement;
                            if (input) {
                              input.focus();
                              try {
                                input.showPicker?.();
                              } catch (error) {
                                // Fallback to click if showPicker fails
                                input.click();
                              }
                            }
                          }}
                        >
                          <input
                            id="eveningPracticeTime"
                            type="time"
                            value={settings.eveningPracticeTime || '18:00'}
                            onChange={(e) => handleSettingChange('eveningPracticeTime', e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 text-sm border border-blue-200 dark:border-blue-700 rounded-md bg-white dark:bg-blue-800 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-h-[36px] text-center"
                          />
                        </div>
                      </div>
                      
                      {/* Night Reflection Toggle */}
                      <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">🌙 Night Reflection</span>
                            <button
                              onClick={() => handleSettingChange('enableNightReflection', !settings.enableNightReflection)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ml-2 ${
                                settings.enableNightReflection !== false
                                  ? 'bg-blue-600'
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  settings.enableNightReflection !== false ? 'translate-x-4' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                          <div 
                            className={`relative rounded-md p-1.5 transition-colors w-full sm:w-auto ${
                              !settings.enableNightReflection 
                                ? 'cursor-not-allowed opacity-50' 
                                : 'cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/50'
                            }`}
                            onClick={() => {
                              if (settings.enableNightReflection) {
                                const input = document.getElementById('nightReflectionTime') as HTMLInputElement;
                                if (input) {
                                  input.focus();
                                  try {
                                    input.showPicker?.();
                                  } catch (error) {
                                    // Fallback to click if showPicker fails
                                    input.click();
                                  }
                                }
                              }
                            }}
                          >
                            <input
                              id="nightReflectionTime"
                              type="time"
                              value={settings.nightReflectionTime || '21:00'}
                              onChange={(e) => handleSettingChange('nightReflectionTime', e.target.value)}
                              disabled={!settings.enableNightReflection}
                              className="w-full sm:w-auto px-3 py-2 text-sm border border-blue-200 dark:border-blue-700 rounded-md bg-white dark:bg-blue-800 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[36px] text-center"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-100 dark:bg-blue-800/30 rounded-md p-2 mt-3">
                        <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                          ℹ️ Night reflections are automatically skipped on weekday nights after 10 PM
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}


    </div>
  );
}
