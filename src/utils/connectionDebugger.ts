/**
 * Connection Debugger Utility
 * Helps diagnose and monitor data fetching issues
 */

import { UserSessionService } from '../services/userSessionService';

export class ConnectionDebugger {
  private static logs: Array<{
    timestamp: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    data?: any;
  }> = [];

  // Log connection events
  static log(type: 'info' | 'warning' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    
    this.logs.push(logEntry);
    
    // Keep only last 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
    
    // Console output with emojis
    const emoji = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [ConnectionDebugger] ${message}`, data || '');
  }

  // Get all logs
  static getLogs() {
    return [...this.logs];
  }

  // Clear logs
  static clearLogs() {
    this.logs = [];
    console.log('🧹 Connection debugger logs cleared');
  }

  // Test data fetching with comprehensive diagnostics
  static async testDataFetching(userId: string) {
    console.log('🔬 Starting comprehensive data fetching test...');
    this.log('info', 'Starting data fetching test', { userId });

    const results = {
      timestamp: new Date().toISOString(),
      userId,
      tests: [] as Array<{
        name: string;
        success: boolean;
        duration: number;
        error?: string;
        dataCount?: number;
      }>
    };

    // Test 1: Basic getUserSessions
    try {
      const start1 = Date.now();
      const sessions = await UserSessionService.getUserSessions(userId);
      const duration1 = Date.now() - start1;
      
      results.tests.push({
        name: 'getUserSessions (all)',
        success: true,
        duration: duration1,
        dataCount: sessions.length
      });
      
      this.log('info', 'getUserSessions test passed', { 
        duration: duration1, 
        count: sessions.length 
      });
    } catch (error) {
      results.tests.push({
        name: 'getUserSessions (all)',
        success: false,
        duration: 0,
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.log('error', 'getUserSessions test failed', error);
    }

    // Test 2: getTodaySession
    try {
      const start2 = Date.now();
      const todaySession = await UserSessionService.getTodaySession(userId);
      const duration2 = Date.now() - start2;
      
      results.tests.push({
        name: 'getTodaySession',
        success: true,
        duration: duration2,
        dataCount: todaySession ? 1 : 0
      });
      
      this.log('info', 'getTodaySession test passed', { 
        duration: duration2, 
        hasData: !!todaySession 
      });
    } catch (error) {
      results.tests.push({
        name: 'getTodaySession',
        success: false,
        duration: 0,
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.log('error', 'getTodaySession test failed', error);
    }

    // Test 3: Date range query
    try {
      const start3 = Date.now();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const rangeSessions = await UserSessionService.getUserSessions(userId, startDate, endDate);
      const duration3 = Date.now() - start3;
      
      results.tests.push({
        name: 'getUserSessions (30 days)',
        success: true,
        duration: duration3,
        dataCount: rangeSessions.length
      });
      
      this.log('info', 'Date range query test passed', { 
        duration: duration3, 
        count: rangeSessions.length,
        dateRange: { startDate, endDate }
      });
    } catch (error) {
      results.tests.push({
        name: 'getUserSessions (30 days)',
        success: false,
        duration: 0,
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.log('error', 'Date range query test failed', error);
    }

    // Test 4: Multiple rapid requests (stress test)
    try {
      const start4 = Date.now();
      const promises = Array(5).fill(null).map(() => 
        UserSessionService.getTodaySession(userId)
      );
      
      const rapidResults = await Promise.allSettled(promises);
      const duration4 = Date.now() - start4;
      const successCount = rapidResults.filter(r => r.status === 'fulfilled').length;
      
      results.tests.push({
        name: 'Rapid requests (5x)',
        success: successCount === 5,
        duration: duration4,
        dataCount: successCount
      });
      
      this.log('info', 'Rapid requests test completed', { 
        duration: duration4, 
        successCount,
        totalRequests: 5
      });
    } catch (error) {
      results.tests.push({
        name: 'Rapid requests (5x)',
        success: false,
        duration: 0,
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.log('error', 'Rapid requests test failed', error);
    }

    // Summary
    const successfulTests = results.tests.filter(t => t.success).length;
    const totalTests = results.tests.length;
    
    console.log('🔬 Data fetching test completed:');
    console.log(`✅ Successful: ${successfulTests}/${totalTests}`);
    console.log(`⏱️ Total duration: ${results.tests.reduce((sum, t) => sum + t.duration, 0)}ms`);
    
    this.log('info', 'Data fetching test completed', {
      successRate: `${successfulTests}/${totalTests}`,
      results
    });

    return results;
  }

  // Get connection status from ConnectionManager
  static getConnectionStatus() {
    try {
      // Access the ConnectionManager status method we added
      const status = (UserSessionService as any).ConnectionManager?.getStatus?.();
      this.log('info', 'Retrieved connection status', status);
      return status;
    } catch (error) {
      this.log('error', 'Failed to get connection status', error);
      return null;
    }
  }

  // Force connection recovery
  static forceRecovery() {
    try {
      // Access the ConnectionManager recovery method we added
      (UserSessionService as any).ConnectionManager?.forceRecovery?.();
      this.log('info', 'Forced connection recovery');
      return true;
    } catch (error) {
      this.log('error', 'Failed to force recovery', error);
      return false;
    }
  }

  // Generate diagnostic report
  static generateReport(userId: string) {
    const report = {
      timestamp: new Date().toISOString(),
      userId,
      connectionStatus: this.getConnectionStatus(),
      recentLogs: this.logs.slice(-20), // Last 20 logs
      environment: {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'configured' : 'missing'
      }
    };

    console.log('📊 Diagnostic Report:', report);
    return report;
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).ConnectionDebugger = ConnectionDebugger;
  console.log('🔧 ConnectionDebugger available globally. Try: ConnectionDebugger.testDataFetching("your-user-id")');
}
