import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Crown,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  
  // Debug logging to check user data
  useEffect(() => {
    if (user) {
      console.log('🔍 UserProfileDropdown - User data:', {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        avatar_url_type: typeof user.avatar_url,
        avatar_url_length: user.avatar_url?.length,
        has_avatar: !!user.avatar_url
      });
      
      // Also log to alert for visibility
      if (user.avatar_url) {
        const isBase64 = user.avatar_url.startsWith('data:');
        const avatarType = isBase64 ? 'base64 data URL' : 'regular URL';
        const displayUrl = isBase64 ? `${user.avatar_url.substring(0, 50)}...` : user.avatar_url;
        console.log(`✅ AVATAR URL FOUND (${avatarType}):`, displayUrl);
      } else {
        console.log('❌ NO AVATAR URL - user.avatar_url is:', user.avatar_url);
      }
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-300 dark:border-gray-600 shadow-sm">
          {user?.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user?.full_name || user?.username || 'User'}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                console.log('🚨 Avatar image failed to load:', target.src);
                console.log('🚨 Error details:', e);
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">${getInitials(user?.full_name || user?.username || 'U')}</div>`;
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {getInitials(user?.full_name || user?.username || 'U')}
            </div>
          )}
        </div>
        
        {/* User Info - Hidden on mobile */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {user?.full_name || user?.username}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Learning: {user?.learning_pace || 'slow'}
          </p>
        </div>
        
        {/* Dropdown Arrow */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 animate-slide-up">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {/* Large Avatar */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-300 dark:border-gray-600 shadow-sm">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user?.full_name || user?.username || 'User'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-lg font-semibold">${getInitials(user?.full_name || user?.username || 'U')}</div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                    {getInitials(user?.full_name || user?.username || 'U')}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user?.full_name || user?.username}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Profile</span>
            </Link>
            
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            
            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">About</span>
            </Link>
            
            {/* Admin Panel - Only show for admin users */}
            {user?.is_admin && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-4 py-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors duration-200"
              >
                <Crown className="w-4 h-4" />
                <span className="text-sm font-medium">Admin Panel</span>
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-2 w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
