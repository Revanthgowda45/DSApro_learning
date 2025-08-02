import { useState } from 'react';
import { getDemoCredentials } from '../lib/authValidation';

/**
 * Demo Credentials Component
 * Shows available demo login credentials for testing
 */
export const DemoCredentials = () => {
  const [isVisible, setIsVisible] = useState(false);
  const demoCredentials = getDemoCredentials();

  return (
    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="flex items-center justify-between w-full text-left text-blue-700 dark:text-blue-300 font-medium hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Demo Credentials
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isVisible ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isVisible && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Use these credentials to test the application:
          </p>
          
          {demoCredentials.map((cred, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {cred.role === 'admin' ? '👑 Admin Account' : '👤 Student Account'}
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full">
                  {cred.role}
                </span>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400 w-12">Email:</span>
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                    {cred.email}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400 w-12">Pass:</span>
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                    {cred.role === 'admin' ? 'admin123' : cred.username + '123'}
                  </code>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">Security Note:</p>
                <p>Only these predefined credentials are valid. Any other email/password combination will be rejected.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoCredentials;
