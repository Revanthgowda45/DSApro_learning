import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  borderLight: string;
  cardBackground: string;
  navBackground: string;
  inputBackground: string;
  hoverBackground: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  effectiveTheme: 'light' | 'dark';
}

const lightTheme: ThemeColors = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  accent: '#FF9800',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  cardBackground: '#FFFFFF',
  navBackground: '#FFFFFF',
  inputBackground: '#FFFFFF',
  hoverBackground: '#F8FAFC'
};

const darkTheme: ThemeColors = {
  primary: '#22C55E',
  secondary: '#3B82F6',
  accent: '#F59E0B',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  border: '#334155',
  borderLight: '#475569',
  cardBackground: '#1E293B',
  navBackground: '#1E293B',
  inputBackground: '#334155',
  hoverBackground: '#334155'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('dsa-tracker-theme');
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      return savedTheme;
    }
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determine the effective theme
  const effectiveTheme: 'light' | 'dark' = 
    theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;
  
  const isDark = effectiveTheme === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('dsa-tracker-theme', newTheme);
  };

  const toggleTheme = () => {
    const themeOrder: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    setTheme(nextTheme);
  };

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const value: ThemeContextType = {
    theme,
    colors,
    setTheme,
    toggleTheme,
    isDark,
    effectiveTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}