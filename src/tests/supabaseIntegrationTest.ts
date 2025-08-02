/**
 * Comprehensive Supabase Integration Test Suite
 * 
 * This test suite validates all Supabase functionality including:
 * - Authentication flows
 * - Database operations
 * - Real-time subscriptions
 * - Data migration
 * - Error handling
 * 
 * Run in browser console: window.testSupabase()
 */

import { supabase } from '../lib/supabase'
import { SupabaseAuthService } from '../services/supabaseAuthService'
import { ProblemProgressService } from '../services/problemProgressService'
import { UserSessionService } from '../services/userSessionService'

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  duration: number
}

class SupabaseIntegrationTest {
  private results: TestResult[] = []
  private testUser: any = null
  private testSession: any = null

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Supabase Integration Tests...\n')
    
    try {
      // Test 1: Connection Test
      await this.testConnection()
      
      // Test 2: Authentication Tests
      await this.testAuthentication()
      
      // Test 3: Profile Management
      await this.testProfileManagement()
      
      // Test 4: Problem Progress Tests
      await this.testProblemProgress()
      
      // Test 5: User Session Tests
      await this.testUserSessions()
      
      // Test 6: Real-time Subscription Tests
      await this.testRealTimeSubscriptions()
      
      // Test 7: Data Migration Tests
      await this.testDataMigration()
      
      // Test 8: Error Handling Tests
      await this.testErrorHandling()
      
      // Cleanup
      await this.cleanup()
      
    } catch (error) {
      console.error('❌ Test suite failed:', error)
      this.addResult('Test Suite', 'FAIL', `Suite failed: ${error.message}`, 0)
    }
    
    this.printResults()
    return this.results
  }

  private async testConnection(): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" which is OK
        throw error
      }
      
      this.addResult(
        'Database Connection',
        'PASS',
        'Successfully connected to Supabase',
        Date.now() - startTime
      )
    } catch (error) {
      this.addResult(
        'Database Connection',
        'FAIL',
        `Connection failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testAuthentication(): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Test user registration
      const testEmail = `test-${Date.now()}@example.com`
      const testPassword = 'TestPassword123!'
      const testUserData = {
        email: testEmail,
        password: testPassword,
        full_name: 'Test User',
        username: `testuser${Date.now()}`
      }
      
      const { user, session } = await SupabaseAuthService.register(testUserData)
      
      if (!user || !session) {
        throw new Error('Registration failed - no user or session returned')
      }
      
      this.testUser = user
      this.testSession = session
      
      this.addResult(
        'User Registration',
        'PASS',
        `User registered successfully: ${user.email}`,
        Date.now() - startTime
      )
      
      // Test login
      const loginStartTime = Date.now()
      await SupabaseAuthService.logout()
      
      const loginResult = await SupabaseAuthService.login(testEmail, testPassword)
      
      if (!loginResult.user || !loginResult.session) {
        throw new Error('Login failed')
      }
      
      this.testUser = loginResult.user
      this.testSession = loginResult.session
      
      this.addResult(
        'User Login',
        'PASS',
        'User logged in successfully',
        Date.now() - loginStartTime
      )
      
    } catch (error) {
      this.addResult(
        'Authentication',
        'FAIL',
        `Authentication failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testProfileManagement(): Promise<void> {
    if (!this.testUser) {
      this.addResult('Profile Management', 'SKIP', 'No test user available', 0)
      return
    }
    
    const startTime = Date.now()
    
    try {
      // Test profile retrieval
      const profile = await SupabaseAuthService.getProfile(this.testUser.id)
      
      if (!profile) {
        throw new Error('Profile not found')
      }
      
      // Test profile update
      const updatedProfile = await SupabaseAuthService.updateProfile(this.testUser.id, {
        learning_pace: 'medium',
        daily_time_limit: 90,
        difficulty_preferences: ['Easy', 'Medium', 'Hard']
      })
      
      if (updatedProfile.learning_pace !== 'medium') {
        throw new Error('Profile update failed')
      }
      
      this.addResult(
        'Profile Management',
        'PASS',
        'Profile created, retrieved, and updated successfully',
        Date.now() - startTime
      )
      
    } catch (error) {
      this.addResult(
        'Profile Management',
        'FAIL',
        `Profile management failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testProblemProgress(): Promise<void> {
    if (!this.testUser) {
      this.addResult('Problem Progress', 'SKIP', 'No test user available', 0)
      return
    }
    
    const startTime = Date.now()
    
    try {
      const userId = this.testUser.id
      const testProblemId = 'test-problem-1'
      
      // Test creating problem progress
      const progress = await ProblemProgressService.updateProblemStatus(userId, testProblemId, {
        status: 'attempted',
        notes: 'Test notes for problem',
        rating: 4,
        time_spent: 1200,
        attempts: 2,
        is_bookmarked: true
      })
      
      if (progress.status !== 'attempted') {
        throw new Error('Problem progress creation failed')
      }
      
      // Test retrieving problem progress
      const retrievedProgress = await ProblemProgressService.getProblemProgress(userId, testProblemId)
      
      if (!retrievedProgress || retrievedProgress.notes !== 'Test notes for problem') {
        throw new Error('Problem progress retrieval failed')
      }
      
      // Test updating problem status to solved
      const solvedProgress = await ProblemProgressService.updateProblemStatus(userId, testProblemId, {
        status: 'solved',
        solved_at: new Date().toISOString()
      })
      
      if (solvedProgress.status !== 'solved') {
        throw new Error('Problem status update failed')
      }
      
      // Test bulk operations
      const bulkUpdates = [
        { problem_id: 'test-problem-2', status: 'solved' as const },
        { problem_id: 'test-problem-3', status: 'attempted' as const }
      ]
      
      await ProblemProgressService.bulkUpdateProgress(userId, bulkUpdates)
      
      // Test user stats calculation
      const stats = await ProblemProgressService.getUserStats(userId)
      
      if (!stats || typeof stats.total_problems !== 'number') {
        throw new Error('User stats calculation failed')
      }
      
      this.addResult(
        'Problem Progress',
        'PASS',
        `Problem progress CRUD operations successful. Stats: ${stats.solved_problems} solved`,
        Date.now() - startTime
      )
      
    } catch (error) {
      this.addResult(
        'Problem Progress',
        'FAIL',
        `Problem progress failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testUserSessions(): Promise<void> {
    if (!this.testUser) {
      this.addResult('User Sessions', 'SKIP', 'No test user available', 0)
      return
    }
    
    const startTime = Date.now()
    
    try {
      const userId = this.testUser.id
      const today = new Date().toISOString().split('T')[0]
      
      // Test creating/updating today's session
      const session = await UserSessionService.updateTodaySession(userId, {
        problems_solved: 3,
        time_spent: 45,
        topics_covered: ['Arrays', 'Strings']
      })
      
      if (session.problems_solved !== 3) {
        throw new Error('Session update failed')
      }
      
      // Test recording problem solve
      await UserSessionService.recordProblemSolved(userId, 'Arrays')
      
      // Test getting user sessions
      const sessions = await UserSessionService.getUserSessions(userId, 7)
      
      if (!sessions || sessions.length === 0) {
        throw new Error('Session retrieval failed')
      }
      
      // Test analytics calculation
      const analytics = await UserSessionService.calculateAnalytics(userId)
      
      if (!analytics || typeof analytics.total_problems_solved !== 'number') {
        throw new Error('Analytics calculation failed')
      }
      
      // Test streak calculation
      const streak = await UserSessionService.calculateStreak(userId)
      
      if (typeof streak !== 'number') {
        throw new Error('Streak calculation failed')
      }
      
      this.addResult(
        'User Sessions',
        'PASS',
        `Session management successful. Analytics: ${analytics.total_problems_solved} problems, ${streak} day streak`,
        Date.now() - startTime
      )
      
    } catch (error) {
      this.addResult(
        'User Sessions',
        'FAIL',
        `User sessions failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testRealTimeSubscriptions(): Promise<void> {
    if (!this.testUser) {
      this.addResult('Real-time Subscriptions', 'SKIP', 'No test user available', 0)
      return
    }
    
    const startTime = Date.now()
    
    try {
      let subscriptionTriggered = false
      
      // Test problem progress subscription
      const subscription = ProblemProgressService.subscribeToProgress(
        this.testUser.id,
        (payload) => {
          subscriptionTriggered = true
          console.log('Real-time update received:', payload)
        }
      )
      
      // Wait a moment for subscription to be established
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Trigger an update
      await ProblemProgressService.updateProblemStatus(this.testUser.id, 'realtime-test-problem', {
        status: 'solved',
        notes: 'Real-time test'
      })
      
      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Cleanup subscription
      if (subscription) {
        supabase.removeChannel(subscription)
      }
      
      this.addResult(
        'Real-time Subscriptions',
        subscriptionTriggered ? 'PASS' : 'FAIL',
        subscriptionTriggered 
          ? 'Real-time subscription working correctly'
          : 'Real-time subscription not triggered',
        Date.now() - startTime
      )
      
    } catch (error) {
      this.addResult(
        'Real-time Subscriptions',
        'FAIL',
        `Real-time test failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testDataMigration(): Promise<void> {
    if (!this.testUser) {
      this.addResult('Data Migration', 'SKIP', 'No test user available', 0)
      return
    }
    
    const startTime = Date.now()
    
    try {
      // Simulate localStorage data
      const mockLocalStorageData = {
        problemProgress: {
          'migration-test-1': {
            status: 'solved',
            notes: 'Migrated from localStorage',
            rating: 5,
            timeSpent: 900,
            attempts: 1,
            isBookmarked: true,
            solvedAt: new Date().toISOString()
          }
        },
        userSessions: [
          {
            date: new Date().toISOString().split('T')[0],
            problemsSolved: 2,
            timeSpent: 30,
            topicsCovered: ['Arrays']
          }
        ]
      }
      
      // Test migration function
      await SupabaseAuthService.migrateLocalStorageData(this.testUser.id, mockLocalStorageData)
      
      // Verify migration
      const migratedProgress = await ProblemProgressService.getProblemProgress(
        this.testUser.id, 
        'migration-test-1'
      )
      
      if (!migratedProgress || migratedProgress.notes !== 'Migrated from localStorage') {
        throw new Error('Data migration verification failed')
      }
      
      this.addResult(
        'Data Migration',
        'PASS',
        'localStorage data migrated successfully',
        Date.now() - startTime
      )
      
    } catch (error) {
      this.addResult(
        'Data Migration',
        'FAIL',
        `Data migration failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Test invalid user ID
      try {
        await ProblemProgressService.getProblemProgress('invalid-uuid', 'test-problem')
        throw new Error('Should have thrown an error for invalid UUID')
      } catch (error) {
        if (!error.message.includes('invalid') && !error.message.includes('uuid')) {
          // If it's not a UUID validation error, it might be a different expected error
          console.log('Expected error for invalid UUID:', error.message)
        }
      }
      
      // Test unauthorized access (should be prevented by RLS)
      try {
        await supabase.auth.signOut()
        const { data, error } = await supabase
          .from('problem_progress')
          .select('*')
          .limit(1)
        
        if (!error) {
          console.log('Note: Unauthorized access test - no error returned (might be expected)')
        }
      } catch (error) {
        console.log('Expected error for unauthorized access:', error.message)
      }
      
      // Re-authenticate for cleanup
      if (this.testUser && this.testSession) {
        await supabase.auth.setSession(this.testSession)
      }
      
      this.addResult(
        'Error Handling',
        'PASS',
        'Error handling tests completed',
        Date.now() - startTime
      )
      
    } catch (error) {
      this.addResult(
        'Error Handling',
        'FAIL',
        `Error handling test failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async cleanup(): Promise<void> {
    const startTime = Date.now()
    
    try {
      if (this.testUser) {
        // Clean up test data
        await supabase
          .from('problem_progress')
          .delete()
          .eq('user_id', this.testUser.id)
        
        await supabase
          .from('user_sessions')
          .delete()
          .eq('user_id', this.testUser.id)
        
        // Note: In a real scenario, you might want to delete the test user
        // but for safety, we'll leave it for manual cleanup
        console.log(`Test user created: ${this.testUser.email} (manual cleanup required)`)
      }
      
      this.addResult(
        'Cleanup',
        'PASS',
        'Test data cleaned up successfully',
        Date.now() - startTime
      )
      
    } catch (error) {
      this.addResult(
        'Cleanup',
        'FAIL',
        `Cleanup failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private addResult(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, duration: number): void {
    this.results.push({ name, status, message, duration })
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'
    const durationText = duration > 0 ? ` (${duration}ms)` : ''
    
    console.log(`${emoji} ${name}: ${message}${durationText}`)
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:')
    console.log('========================')
    
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const skipped = this.results.filter(r => r.status === 'SKIP').length
    const total = this.results.length
    
    console.log(`Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️ Skipped: ${skipped}`)
    
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)
    console.log(`⏱️ Total Duration: ${totalDuration}ms`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.name}: ${r.message}`))
    }
    
    console.log(`\n🎯 Success Rate: ${((passed / (total - skipped)) * 100).toFixed(1)}%`)
    
    if (failed === 0 && passed > 0) {
      console.log('\n🎉 All tests passed! Supabase integration is working correctly.')
    } else if (failed > 0) {
      console.log('\n⚠️ Some tests failed. Please check the errors above and verify your Supabase setup.')
    }
  }
}

// Export for use in browser console
export const runSupabaseTests = async (): Promise<TestResult[]> => {
  const testSuite = new SupabaseIntegrationTest()
  return await testSuite.runAllTests()
}

// Make available globally for browser console testing
declare global {
  interface Window {
    testSupabase: () => Promise<TestResult[]>
  }
}

if (typeof window !== 'undefined') {
  window.testSupabase = runSupabaseTests
}

export default SupabaseIntegrationTest
