import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';

export default function AuthTest() {
  const { user, login, logout } = useAuth();
  const [message, setMessage] = useState('');

  const createDemoUser = () => {
    const demoUser = {
      id: 'demo-user-123',
      email: 'demo@example.com',
      full_name: 'Demo User',
      daily_time_limit: 120,
      learning_pace: 'slow' as const,
      difficulty_preferences: ['easy', 'medium'],
      adaptive_difficulty: true,
      created_at: new Date().toISOString()
    };
    
    localStorage.setItem('dsa_user', JSON.stringify(demoUser));
    setMessage('✅ Demo user created! Please refresh the page.');
    console.log('Demo user created:', demoUser);
  };

  const clearAuth = () => {
    localStorage.removeItem('dsa_user');
    logout();
    setMessage('🗑️ Authentication cleared! Please refresh the page.');
  };

  const loginAsDemo = async () => {
    try {
      await login('demo@example.com', 'password');
      setMessage('✅ Logged in as demo user!');
    } catch (error) {
      setMessage('❌ Login failed: ' + (error as Error).message);
    }
  };

  const checkLocalStorage = () => {
    const localUser = localStorage.getItem('dsa_user');
    if (localUser) {
      try {
        const userData = JSON.parse(localUser);
        setMessage(`📱 Local user found: ${userData.email}`);
      } catch (error) {
        setMessage('❌ Error parsing local user data');
      }
    } else {
      setMessage('❌ No local user found');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Authentication Test
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Debug and test authentication state
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Current User Status */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Current User Status
            </h3>
            {user ? (
              <div className="space-y-2">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✅ User authenticated
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Email: {user.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Name: {user.full_name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ID: {user.id}
                </p>
              </div>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">
                ❌ No user authenticated
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={createDemoUser}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
              >
                Create Demo User
              </button>
              
              <button
                onClick={loginAsDemo}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                Login as Demo
              </button>
              
              <button
                onClick={checkLocalStorage}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800"
              >
                Check Local Storage
              </button>
              
              <button
                onClick={clearAuth}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
              >
                Clear Authentication
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Message
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Instructions
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>1. Click "Create Demo User" to create a test user</p>
              <p>2. Refresh the page to test authentication persistence</p>
              <p>3. You should be automatically logged in after refresh</p>
              <p>4. Use "Clear Authentication" to test login flow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
