import React, { useState, useEffect } from 'react';
import { ConnectionDebugger } from '../../utils/connectionDebugger';
import { useSupabaseAuth } from '../../contexts/AuthContext';

interface ConnectionStatus {
  isHealthy: boolean;
  isDisabled: boolean;
  consecutiveFailures: number;
  lastHealthCheck: string;
  lastFailureTime: string | null;
  supabaseConfigured: boolean;
}

export const ConnectionMonitor: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    // Update status every 5 seconds
    const updateStatus = () => {
      const connectionStatus = ConnectionDebugger.getConnectionStatus();
      setStatus(connectionStatus);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const runTest = async () => {
    if (!user?.id) return;
    
    setIsRunningTest(true);
    try {
      const results = await ConnectionDebugger.testDataFetching(user.id);
      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  const forceRecovery = () => {
    ConnectionDebugger.forceRecovery();
    // Update status after recovery
    setTimeout(() => {
      const connectionStatus = ConnectionDebugger.getConnectionStatus();
      setStatus(connectionStatus);
    }, 1000);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg"
          title="Show Connection Monitor"
        >
          🔧
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Connection Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {status && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              status.isHealthy ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {status.isHealthy ? 'Healthy' : 'Unhealthy'}
            </span>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>Configured: {status.supabaseConfigured ? '✅' : '❌'}</div>
            <div>Disabled: {status.isDisabled ? '❌' : '✅'}</div>
            <div>Failures: {status.consecutiveFailures}</div>
            <div>Last Check: {new Date(status.lastHealthCheck).toLocaleTimeString()}</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={runTest}
          disabled={isRunningTest || !user?.id}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-3 rounded text-sm"
        >
          {isRunningTest ? 'Running Test...' : 'Test Data Fetching'}
        </button>

        <button
          onClick={forceRecovery}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded text-sm"
        >
          Force Recovery
        </button>
      </div>

      {testResults && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs">
          <div className="font-semibold mb-2">Test Results:</div>
          {testResults.tests.map((test: any, index: number) => (
            <div key={index} className="flex justify-between items-center mb-1">
              <span className="truncate">{test.name}</span>
              <span className={test.success ? 'text-green-600' : 'text-red-600'}>
                {test.success ? '✅' : '❌'} {test.duration}ms
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
