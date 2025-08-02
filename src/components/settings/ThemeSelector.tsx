import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeSelector: React.FC = () => {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Light theme'
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Dark theme'
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Follow system preference'
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Theme Preference
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Choose your preferred theme or follow your system setting
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`
                  p-2 rounded-full transition-colors
                  ${isSelected 
                    ? 'bg-blue-100 dark:bg-blue-800/50' 
                    : 'bg-gray-100 dark:bg-gray-700'
                  }
                `}>
                  <Icon className={`
                    h-5 w-5 transition-colors
                    ${isSelected 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400'
                    }
                  `} />
                </div>
                
                <div className="text-center">
                  <div className={`
                    text-sm font-medium transition-colors
                    ${isSelected 
                      ? 'text-blue-900 dark:text-blue-100' 
                      : 'text-gray-900 dark:text-gray-100'
                    }
                  `}>
                    {option.label}
                  </div>
                  <div className={`
                    text-xs transition-colors
                    ${isSelected 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {option.description}
                  </div>
                  
                  {/* System theme indicator */}
                  {option.value === 'system' && theme === 'system' && (
                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      Currently: {effectiveTheme}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Current effective theme display */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Active theme:
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
            {effectiveTheme}
            {theme === 'system' && (
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                (from system)
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
