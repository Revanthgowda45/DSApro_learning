import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, effectiveTheme } = useTheme();

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light theme';
      case 'dark': return 'Dark theme';
      case 'system': return `System theme (${effectiveTheme})`;
      default: return 'Toggle theme';
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return Monitor;
    }
    return effectiveTheme === 'dark' ? Moon : Sun;
  };

  const Icon = getIcon();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
      aria-label={`Current: ${getThemeLabel()}. Click to cycle themes.`}
      title={`Current: ${getThemeLabel()}. Click to cycle themes.`}
    >
      <Icon 
        className={`w-5 h-5 transition-all duration-300 ${
          theme === 'system' 
            ? 'text-purple-500 dark:text-purple-400'
            : effectiveTheme === 'dark'
            ? 'text-blue-400'
            : 'text-yellow-500'
        }`}
      />
    </button>
  );
}
