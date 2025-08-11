import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import UserProfileDropdown from '../ui/UserProfileDropdown';
import DSALogo from '../ui/DSALogo';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  BookOpen, 
  TrendingUp, 
  Menu,
  X,
  Settings,
  User,
  LogOut,
  Timer,
  Info,
  GamepadIcon
} from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', description: 'Your learning overview' },
    { path: '/problems', icon: BookOpen, label: 'Problems', description: '375+ DSA problems' },
    { path: '/gaming', icon: GamepadIcon, label: 'Gaming', description: 'AI-powered challenges' },
    { path: '/progress', icon: TrendingUp, label: 'Progress', description: 'Track your journey' },
    { path: '/profile', icon: User, label: 'Profile', description: 'Your account settings' },
    { path: '/timer', icon: Timer, label: 'Timer', description: 'Track solving time' }
  ];

  const quickActions = [
    { path: '/settings', icon: Settings, label: 'Settings', color: 'text-gray-600 dark:text-gray-400' },
    { path: '/about', icon: Info, label: 'About', color: 'text-gray-600 dark:text-gray-400' }
  ];

  const isActive = (path: string) => location.pathname === path;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50'
          : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2 group">
              <div className="p-1 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 group-hover:from-green-200 group-hover:to-blue-200 dark:group-hover:from-green-900/50 dark:group-hover:to-blue-900/50 transition-all duration-300 shadow-sm">
                <DSALogo className="text-green-600 dark:text-green-400" size="md" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent hidden sm:block">
                DSA Tracker
              </span>
              <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent sm:hidden">
                DSA
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(path)
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            {/* Desktop Right Side */}
            <div className="hidden lg:flex items-center space-x-4">
              <ThemeToggle />
              


              <UserProfileDropdown />
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <ThemeToggle />
              

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-out Menu */}
      <div className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
        isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Menu Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 shadow-sm">
                  <DSALogo className="text-green-600 dark:text-green-400" size="md" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                  DSA Tracker
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center overflow-hidden border-2 border-gray-300 dark:border-gray-600 shadow-sm">
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
                          parent.innerHTML = '<svg class="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                        }
                      }}
                    />
                  ) : (
                    <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.full_name || 'Student'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Keep learning! 🚀
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Navigation Links */}
            <div className="p-6 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Navigation
              </h3>
              {navItems.map(({ path, icon: Icon, label, description }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 group ${
                    isActive(path)
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-green-600 dark:hover:text-green-400'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-colors ${
                    isActive(path)
                      ? 'bg-green-200 dark:bg-green-900/50'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-green-100 dark:group-hover:bg-green-900/30'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="px-6 pb-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {quickActions.map(({ path, icon: Icon, label, color }) => (
                  <Link
                    key={path}
                    to={path}
                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon className={`h-5 w-5 ${color}`} />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}
                

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 p-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Bottom Tab Bar for Mobile (Alternative Navigation) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 z-30 safe-area-inset-bottom">
        <div className="grid grid-cols-5 h-16 px-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 rounded-lg mx-1 my-2 relative ${
                isActive(path)
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-700/50'
              }`}
              style={{ minHeight: '44px' }} // Ensure minimum touch target size
            >
              <Icon className={`h-5 w-5 transition-all duration-200 ${
                isActive(path) ? 'scale-110' : 'scale-100 group-active:scale-95'
              }`} />
              <span className={`text-xs font-medium transition-all duration-200 ${
                isActive(path) ? 'font-semibold' : 'font-normal'
              }`}>
                {label === 'Dashboard' ? 'Home' : label}
              </span>
              {isActive(path) && (
                <div className="absolute -top-1 w-6 h-0.5 bg-green-600 dark:bg-green-400 rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}