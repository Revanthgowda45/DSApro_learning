/**
 * Test utility for Gemini AI integration in Smart Recommendations
 * This file helps verify that the Gemini service is working correctly
 */

import GeminiRecommendationsService from '../services/geminiRecommendationsService';
import type { GeminiRecommendationRequest } from '../services/geminiRecommendationsService';

/**
 * Test the Gemini AI recommendations service
 */
export async function testGeminiIntegration(): Promise<void> {
  console.log('🧪 Testing Gemini AI Integration...');
  
  // Sample test data
  const testRequest: GeminiRecommendationRequest = {
    userProgress: {
      solvedProblems: 25,
      currentStreak: 5,
      activeDays: 15,
      level: 3,
      weakAreas: ['Dynamic Programming', 'Graph Algorithms'],
      strongAreas: ['Arrays', 'Strings'],
      recentActivity: []
    },
    learningPattern: {
      preferredTopics: ['Arrays', 'Strings', 'Hash Tables'],
      avoidedTopics: ['Dynamic Programming'],
      peakPerformanceHours: [9, 14, 19],
      learningVelocity: 2.5,
      retentionRate: 75,
      consistencyScore: 8
    },
    cognitiveLoad: {
      currentLoad: 65,
      burnoutRisk: 'medium',
      fatigueLevel: 4,
      concentrationScore: 7
    },
    availableProblems: [
      {
        id: 'test-1',
        title: 'Two Sum',
        difficulty: 'easy',
        category: 'Arrays',
        timeEstimate: 15,
        link: 'https://leetcode.com/problems/two-sum/'
      },
      {
        id: 'test-2',
        title: 'Valid Parentheses',
        difficulty: 'easy',
        category: 'Stack',
        timeEstimate: 10,
        link: 'https://leetcode.com/problems/valid-parentheses/'
      },
      {
        id: 'test-3',
        title: 'Longest Substring Without Repeating Characters',
        difficulty: 'medium',
        category: 'Strings',
        timeEstimate: 25,
        link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/'
      }
    ],
    targetCount: 3
  };

  try {
    // Test Gemini API call
    console.log('📡 Calling Gemini API...');
    const response = await GeminiRecommendationsService.generateSmartRecommendations(testRequest);
    
    if (response.success && response.data) {
      console.log('✅ Gemini API Success!');
      console.log(`📊 Generated ${response.data.recommendations.length} recommendations`);
      console.log('🎯 Sample recommendation:', response.data.recommendations[0]);
      console.log('💡 Insights:', response.data.insights);
    } else {
      console.log('⚠️ Gemini API failed, testing fallback...');
      const fallbackRecs = GeminiRecommendationsService.getFallbackRecommendations(
        testRequest.availableProblems,
        testRequest.userProgress,
        3
      );
      console.log(`🔄 Fallback generated ${fallbackRecs.length} recommendations`);
      console.log('📝 Sample fallback:', fallbackRecs[0]);
    }
    
    console.log('✅ Gemini integration test completed successfully!');
  } catch (error) {
    console.error('❌ Gemini integration test failed:', error);
    
    // Test fallback system
    console.log('🔄 Testing fallback system...');
    const fallbackRecs = GeminiRecommendationsService.getFallbackRecommendations(
      testRequest.availableProblems,
      testRequest.userProgress,
      3
    );
    console.log(`✅ Fallback system working: ${fallbackRecs.length} recommendations generated`);
  }
}

/**
 * Check if Gemini API is configured
 */
export function checkGeminiConfiguration(): boolean {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ VITE_GEMINI_API_KEY not configured in environment variables');
    console.log('📝 To enable Gemini AI:');
    console.log('1. Get a Gemini API key from https://makersuite.google.com/app/apikey');
    console.log('2. Add VITE_GEMINI_API_KEY=your_api_key to your .env file');
    console.log('3. Restart your development server');
    return false;
  }
  
  console.log('✅ Gemini API key is configured');
  return true;
}

/**
 * Run all Gemini integration tests
 */
export async function runGeminiTests(): Promise<void> {
  console.log('🚀 Starting Gemini AI Integration Tests...\n');
  
  // Check configuration
  const isConfigured = checkGeminiConfiguration();
  
  if (isConfigured) {
    // Run integration test
    await testGeminiIntegration();
  } else {
    console.log('⏭️ Skipping API test due to missing configuration');
    console.log('🔄 Testing fallback system only...');
    
    const fallbackRecs = GeminiRecommendationsService.getFallbackRecommendations(
      [
        { id: 'test-1', title: 'Test Problem', difficulty: 'easy', category: 'Arrays', timeEstimate: 15 }
      ],
      { solvedProblems: 10, level: 2 },
      1
    );
    console.log(`✅ Fallback system working: ${fallbackRecs.length} recommendations`);
  }
  
  console.log('\n🎉 Gemini integration tests completed!');
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testGemini = runGeminiTests;
  console.log('💡 Run testGemini() in browser console to test Gemini integration');
}
