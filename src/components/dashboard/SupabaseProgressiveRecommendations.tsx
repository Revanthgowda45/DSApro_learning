import { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, Brain, Target, ExternalLink, CheckCircle, Wifi, WifiOff, User, TrendingUp, Zap, Award, BarChart3, Lightbulb, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProblemProgressService } from '../../services/problemProgressService';
import { SupabaseAuthService } from '../../services/supabaseAuthService';
import { UserSessionService } from '../../services/userSessionService';
import { 
  getProgressiveDailyRecommendations, 
  markProgressiveProblemSolved,
  getProgressiveMotivationalMessage,
  defaultProgressiveProgress 
} from '../../data/progressiveAIRecommender';
import type { DailyRecommendation, ProgressiveUserProgress } from '../../data/progressiveAIRecommender';

interface UserPreferences {
  learning_pace: 'slow' | 'medium' | 'fast';
  daily_time_limit: number;
  difficulty_preferences: string[];
  adaptive_difficulty: boolean;
}

// Advanced AI Interfaces
interface CognitiveLoadMetrics {
  currentLoad: number; // 0-100
  optimalLoad: number;
  burnoutRisk: 'low' | 'medium' | 'high';
  fatigueLevel: number;
  concentrationScore: number;
  learningEfficiency: number;
}

interface PredictiveAnalytics {
  nextWeekPerformance: number;
  difficultyReadiness: string[];
  optimalStudyTimes: string[];
  plateauRisk: number;
  breakthroughProbability: number;
  recommendedBreakDuration: number;
}

interface LearningPattern {
  preferredTopics: string[];
  avoidedTopics: string[];
  peakPerformanceHours: number[];
  learningVelocity: number;
  retentionRate: number;
  consistencyScore: number;
  adaptabilityIndex: number;
}

interface AIConfidenceScore {
  overall: number;
  topicMatch: number;
  difficultyAlignment: number;
  timingOptimization: number;
  personalizedFit: number;
  reasoning: string[];
}

interface SmartRecommendation {
  problem: any;
  aiConfidence: AIConfidenceScore;
  predictedSolveTime: number;
  cognitiveLoadImpact: number;
  learningValue: number;
  priorityScore: number;
  reasoning: string;
  alternativeProblems?: any[];
}

interface AdaptiveDifficultyEngine {
  currentDifficultyLevel: number;
  targetDifficultyLevel: number;
  progressionRate: number;
  adaptationTriggers: string[];
  difficultyHistory: number[];
  nextDifficultyPrediction: string;
}

interface MachineLearningInsights {
  userCluster: string;
  similarUserPatterns: string[];
  successPredictors: string[];
  riskFactors: string[];
  optimizationSuggestions: string[];
  personalizedStrategies: string[];
}

// Helper functions to calculate progress from Supabase data
function calculateActiveDays(problemProgress: any[]): number {
  if (!problemProgress.length) return 0;
  
  const uniqueDates = new Set(
    problemProgress
      .filter(p => p.solved_at)
      .map(p => new Date(p.solved_at).toISOString().split('T')[0])
  );
  
  return uniqueDates.size;
}

function calculateCurrentStreak(problemProgress: any[]): number {
  if (!problemProgress.length) return 0;
  
  const solvedDates = problemProgress
    .filter(p => p.solved_at)
    .map(p => new Date(p.solved_at).toISOString().split('T')[0])
    .sort()
    .reverse(); // Most recent first
  
  if (!solvedDates.length) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Check if solved today or yesterday
  if (solvedDates[0] !== today && solvedDates[0] !== yesterday) {
    return 0;
  }
  
  let streak = 0;
  let currentDate = new Date();
  
  for (const solvedDate of solvedDates) {
    const checkDate = currentDate.toISOString().split('T')[0];
    if (solvedDate === checkDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateCurrentLevel(solvedCount: number) {
  if (solvedCount < 5) {
    return {
      name: 'Absolute Beginner' as const,
      stage: 1,
      problemsSolved: solvedCount,
      requiredForNext: 5,
      skillAreas: ['Basic Programming', 'Simple Logic'],
      currentFocus: ['Arrays', 'Strings']
    };
  } else if (solvedCount < 15) {
    return {
      name: 'Beginner' as const,
      stage: 2,
      problemsSolved: solvedCount,
      requiredForNext: 15,
      skillAreas: ['Data Structures', 'Basic Algorithms'],
      currentFocus: ['Linked Lists', 'Stacks', 'Queues']
    };
  } else if (solvedCount < 40) {
    return {
      name: 'Intermediate' as const,
      stage: 3,
      problemsSolved: solvedCount,
      requiredForNext: 40,
      skillAreas: ['Trees', 'Graphs', 'Recursion'],
      currentFocus: ['Binary Trees', 'DFS', 'BFS']
    };
  } else if (solvedCount < 80) {
    return {
      name: 'Advanced' as const,
      stage: 4,
      problemsSolved: solvedCount,
      requiredForNext: 80,
      skillAreas: ['Dynamic Programming', 'Advanced Algorithms'],
      currentFocus: ['DP Patterns', 'Graph Algorithms']
    };
  } else {
    return {
      name: 'Expert' as const,
      stage: 5,
      problemsSolved: solvedCount,
      requiredForNext: 100,
      skillAreas: ['System Design', 'Optimization'],
      currentFocus: ['Advanced DP', 'Complex Algorithms']
    };
  }
}

function getLastActiveDate(problemProgress: any[]): string {
  if (!problemProgress.length) return '';
  
  const lastSolved = problemProgress
    .filter(p => p.solved_at)
    .sort((a, b) => new Date(b.solved_at).getTime() - new Date(a.solved_at).getTime())[0];
  
  return lastSolved ? lastSolved.solved_at.split('T')[0] : '';
}

function calculateDifficultyProgression(_problemProgress: any[]) {
  const progression = {
    easy: { solved: 0, total: 0, successRate: 0 },
    medium: { solved: 0, total: 0, successRate: 0 },
    hard: { solved: 0, total: 0, successRate: 0 },
    veryHard: { solved: 0, total: 0, successRate: 0 }
  };
  
  // This would need problem difficulty data from the problems table
  // For now, return default values
  return progression;
}

function calculateTopicMastery(_problemProgress: any[]) {
  // This would need topic data from the problems
  // For now, return empty object
  return {};
}

// Advanced AI Algorithm Functions
class AdvancedAIEngine {
  // Machine Learning Pattern Recognition
  static analyzeUserLearningPattern(problemProgress: any[], userSessions: any[]): LearningPattern {
    const solvedProblems = problemProgress.filter(p => p.status === 'solved' || p.status === 'mastered');
    const topicCounts = solvedProblems.reduce((acc: any, p: any) => {
      acc[p.topic] = (acc[p.topic] || 0) + 1;
      return acc;
    }, {});
    
    const preferredTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([topic]) => topic);
    
    const avoidedTopics = Object.keys(topicCounts)
      .filter(topic => topicCounts[topic] < 2);
    
    const sessionTimes = userSessions.map(s => new Date(s.created_at).getHours());
    const peakHours = this.findPeakPerformanceHours(sessionTimes);
    
    const learningVelocity = this.calculateLearningVelocity(problemProgress);
    const retentionRate = this.calculateRetentionRate(problemProgress);
    const consistencyScore = this.calculateConsistencyScore(userSessions);
    const adaptabilityIndex = this.calculateAdaptabilityIndex(problemProgress);
    
    return {
      preferredTopics,
      avoidedTopics,
      peakPerformanceHours: peakHours,
      learningVelocity,
      retentionRate,
      consistencyScore,
      adaptabilityIndex
    };
  }
  
  // Cognitive Load Management
  static assessCognitiveLoad(recentSessions: any[], currentStreak: number, timeSpent: number): CognitiveLoadMetrics {
    const avgSessionLength = recentSessions.reduce((sum, s) => sum + (s.time_spent || 0), 0) / recentSessions.length || 0;
    const sessionFrequency = recentSessions.length;
    
    // Calculate cognitive load based on multiple factors
    const baseLoad = Math.min(100, (timeSpent / 120) * 50); // Based on 2-hour target
    const streakPressure = Math.min(30, currentStreak * 2); // Streak pressure
    const frequencyLoad = Math.min(20, sessionFrequency * 3); // Session frequency
    
    const currentLoad = Math.min(100, baseLoad + streakPressure + frequencyLoad);
    const optimalLoad = 65; // Sweet spot for learning
    
    const burnoutRisk = currentLoad > 85 ? 'high' : currentLoad > 70 ? 'medium' : 'low';
    const fatigueLevel = Math.max(0, currentLoad - 50);
    const concentrationScore = Math.max(0, 100 - currentLoad);
    const learningEfficiency = Math.max(0.3, 1 - (Math.abs(currentLoad - optimalLoad) / 100));
    
    return {
      currentLoad,
      optimalLoad,
      burnoutRisk,
      fatigueLevel,
      concentrationScore,
      learningEfficiency
    };
  }
  
  // Predictive Analytics Engine
  static generatePredictiveAnalytics(userProgress: ProgressiveUserProgress, learningPattern: LearningPattern): PredictiveAnalytics {
    const recentPerformance = learningPattern.learningVelocity;
    const consistencyTrend = learningPattern.consistencyScore;
    
    // Predict next week performance using trend analysis
    const nextWeekPerformance = Math.min(100, recentPerformance * (1 + (consistencyTrend - 50) / 100));
    
    // Determine difficulty readiness based on current progression
    const currentLevel = userProgress.currentLevel.stage;
    const difficultyReadiness = this.predictDifficultyReadiness(currentLevel, learningPattern);
    
    // Optimal study times based on peak performance hours
    const optimalStudyTimes = learningPattern.peakPerformanceHours.map(hour => 
      `${hour}:00-${hour + 1}:00`
    );
    
    // Risk assessment
    const plateauRisk = this.calculatePlateauRisk(learningPattern);
    const breakthroughProbability = this.calculateBreakthroughProbability(userProgress, learningPattern);
    
    // Recommended break duration based on cognitive load
    const recommendedBreakDuration = this.calculateOptimalBreakDuration(learningPattern);
    
    return {
      nextWeekPerformance,
      difficultyReadiness,
      optimalStudyTimes,
      plateauRisk,
      breakthroughProbability,
      recommendedBreakDuration
    };
  }
  
  // Intelligent Problem Selection with AI Confidence
  static generateSmartRecommendations(
    availableProblems: any[],
    userProgress: ProgressiveUserProgress,
    learningPattern: LearningPattern,
    cognitiveLoad: CognitiveLoadMetrics,
    targetCount: number = 3
  ): SmartRecommendation[] {
    const scoredProblems = availableProblems.map(problem => {
      const aiConfidence = this.calculateAIConfidence(problem, userProgress, learningPattern);
      const predictedSolveTime = this.predictSolveTime(problem, learningPattern);
      const cognitiveLoadImpact = this.calculateCognitiveImpact(problem, cognitiveLoad);
      const learningValue = this.calculateLearningValue(problem, userProgress);
      const priorityScore = this.calculatePriorityScore(aiConfidence, learningValue, cognitiveLoadImpact);
      const reasoning = this.generateRecommendationReasoning(problem, aiConfidence, learningPattern);
      
      return {
        problem,
        aiConfidence,
        predictedSolveTime,
        cognitiveLoadImpact,
        learningValue,
        priorityScore,
        reasoning
      };
    });
    
    // Sort by priority score and return top recommendations
    return scoredProblems
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, targetCount);
  }
  
  // Adaptive Difficulty Engine
  static createAdaptiveDifficultyEngine(userProgress: ProgressiveUserProgress, learningPattern: LearningPattern): AdaptiveDifficultyEngine {
    const difficultyMapping = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Very Hard': 4 };
    const currentLevel = userProgress.currentLevel.stage;
    
    // Calculate current difficulty level based on recent solves
    const recentDifficulties = userProgress.difficultyProgression;
    const currentDifficultyLevel = this.calculateCurrentDifficultyLevel(recentDifficulties);
    
    // Determine target difficulty based on learning pattern
    const targetDifficultyLevel = this.calculateTargetDifficulty(currentLevel, learningPattern);
    
    // Calculate progression rate
    const progressionRate = learningPattern.adaptabilityIndex;
    
    // Identify adaptation triggers
    const adaptationTriggers = this.identifyAdaptationTriggers(userProgress, learningPattern);
    
    // Track difficulty history
    const difficultyHistory = this.extractDifficultyHistory(userProgress);
    
    // Predict next difficulty
    const nextDifficultyPrediction = this.predictNextDifficulty(currentDifficultyLevel, targetDifficultyLevel, progressionRate);
    
    return {
      currentDifficultyLevel,
      targetDifficultyLevel,
      progressionRate,
      adaptationTriggers,
      difficultyHistory,
      nextDifficultyPrediction
    };
  }
  
  // Machine Learning Insights
  static generateMLInsights(userProgress: ProgressiveUserProgress, learningPattern: LearningPattern): MachineLearningInsights {
    // User clustering based on learning patterns
    const userCluster = this.classifyUserType(learningPattern);
    
    // Similar user patterns (simulated)
    const similarUserPatterns = this.findSimilarUserPatterns(userCluster);
    
    // Success predictors
    const successPredictors = this.identifySuccessPredictors(userProgress, learningPattern);
    
    // Risk factors
    const riskFactors = this.identifyRiskFactors(userProgress, learningPattern);
    
    // Optimization suggestions
    const optimizationSuggestions = this.generateOptimizationSuggestions(userProgress, learningPattern);
    
    // Personalized strategies
    const personalizedStrategies = this.generatePersonalizedStrategies(userCluster, learningPattern);
    
    return {
      userCluster,
      similarUserPatterns,
      successPredictors,
      riskFactors,
      optimizationSuggestions,
      personalizedStrategies
    };
  }
  
  // Helper methods for calculations
  private static findPeakPerformanceHours(sessionTimes: number[]): number[] {
    const hourCounts = sessionTimes.reduce((acc: any, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }
  
  private static calculateLearningVelocity(problemProgress: any[]): number {
    const solvedProblems = problemProgress.filter(p => p.status === 'solved' || p.status === 'mastered');
    const timeSpan = this.getTimeSpanInDays(problemProgress);
    return timeSpan > 0 ? (solvedProblems.length / timeSpan) * 7 : 0; // Problems per week
  }
  
  private static calculateRetentionRate(problemProgress: any[]): number {
    const masteredProblems = problemProgress.filter(p => p.status === 'mastered').length;
    const solvedProblems = problemProgress.filter(p => p.status === 'solved' || p.status === 'mastered').length;
    return solvedProblems > 0 ? (masteredProblems / solvedProblems) * 100 : 0;
  }
  
  private static calculateConsistencyScore(userSessions: any[]): number {
    if (userSessions.length < 2) return 0;
    
    const sessionDates = userSessions.map(s => new Date(s.created_at).toDateString());
    const uniqueDates = new Set(sessionDates);
    const totalDays = this.getTimeSpanInDays(userSessions);
    
    return totalDays > 0 ? (uniqueDates.size / totalDays) * 100 : 0;
  }
  
  private static calculateAdaptabilityIndex(problemProgress: any[]): number {
    const difficulties = ['Easy', 'Medium', 'Hard', 'Very Hard'];
    const difficultyVariety = difficulties.filter(diff => 
      problemProgress.some(p => p.difficulty === diff && (p.status === 'solved' || p.status === 'mastered'))
    ).length;
    
    return (difficultyVariety / difficulties.length) * 100;
  }
  
  private static getTimeSpanInDays(data: any[]): number {
    if (data.length < 2) return 0;
    
    const dates = data.map(item => new Date(item.created_at || item.solved_at)).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    return Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  }
  
  private static calculateAIConfidence(problem: any, userProgress: ProgressiveUserProgress, learningPattern: LearningPattern): AIConfidenceScore {
    const topicMatch = learningPattern.preferredTopics.includes(problem.category) ? 85 : 60;
    const difficultyAlignment = this.assessDifficultyAlignment(problem.difficulty, userProgress.currentLevel.stage);
    const timingOptimization = learningPattern.peakPerformanceHours.length > 0 ? 80 : 60;
    const personalizedFit = this.calculatePersonalizedFit(problem, learningPattern);
    
    const overall = (topicMatch + difficultyAlignment + timingOptimization + personalizedFit) / 4;
    
    const reasoning = [
      `Topic match: ${topicMatch}% (${learningPattern.preferredTopics.includes(problem.category) ? 'preferred' : 'new'} topic)`,
      `Difficulty: ${difficultyAlignment}% alignment with current level`,
      `Timing: ${timingOptimization}% optimization`,
      `Personal fit: ${personalizedFit}% based on learning pattern`
    ];
    
    return {
      overall,
      topicMatch,
      difficultyAlignment,
      timingOptimization,
      personalizedFit,
      reasoning
    };
  }
  
  private static assessDifficultyAlignment(difficulty: string, currentLevel: number): number {
    const difficultyLevel = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Very Hard': 4 }[difficulty] || 1;
    const optimalDifficulty = Math.min(4, currentLevel + 1);
    const alignment = 100 - Math.abs(difficultyLevel - optimalDifficulty) * 20;
    return Math.max(20, alignment);
  }
  
  private static calculatePersonalizedFit(problem: any, learningPattern: LearningPattern): number {
    let fit = 70; // Base fit
    
    if (learningPattern.preferredTopics.includes(problem.category)) fit += 20;
    if (learningPattern.avoidedTopics.includes(problem.category)) fit -= 15;
    if (learningPattern.adaptabilityIndex > 60) fit += 10;
    
    return Math.max(30, Math.min(95, fit));
  }
  
  private static predictSolveTime(problem: any, learningPattern: LearningPattern): number {
    const baseTimes = { 'Easy': 20, 'Medium': 35, 'Hard': 50, 'Very Hard': 75 };
    const baseTime = baseTimes[problem.difficulty as keyof typeof baseTimes] || 30;
    
    // Adjust based on learning velocity and topic familiarity
    const velocityMultiplier = Math.max(0.5, 1 - (learningPattern.learningVelocity - 3) / 10);
    const familiarityMultiplier = learningPattern.preferredTopics.includes(problem.category) ? 0.8 : 1.2;
    
    return Math.round(baseTime * velocityMultiplier * familiarityMultiplier);
  }
  
  private static calculateCognitiveImpact(problem: any, cognitiveLoad: CognitiveLoadMetrics): number {
    const difficultyImpact = { 'Easy': 10, 'Medium': 20, 'Hard': 35, 'Very Hard': 50 };
    const baseImpact = difficultyImpact[problem.difficulty as keyof typeof difficultyImpact] || 20;
    
    // Adjust based on current cognitive load
    const loadMultiplier = cognitiveLoad.currentLoad > 70 ? 1.5 : 1.0;
    
    return Math.round(baseImpact * loadMultiplier);
  }
  
  private static calculateLearningValue(problem: any, userProgress: ProgressiveUserProgress): number {
    let value = 70; // Base learning value
    
    // Higher value for topics with low mastery
    const topicMastery = userProgress.topicMastery[problem.category];
    if (topicMastery && topicMastery.level < 30) value += 20;
    
    // Higher value for skill progression
    if (userProgress.currentLevel.currentFocus.includes(problem.category)) value += 15;
    
    return Math.min(100, value);
  }
  
  private static calculatePriorityScore(aiConfidence: AIConfidenceScore, learningValue: number, cognitiveImpact: number): number {
    // Weighted priority calculation
    const confidenceWeight = 0.4;
    const learningWeight = 0.4;
    const cognitiveWeight = 0.2;
    
    const cognitiveScore = Math.max(0, 100 - cognitiveImpact);
    
    return (aiConfidence.overall * confidenceWeight) + 
           (learningValue * learningWeight) + 
           (cognitiveScore * cognitiveWeight);
  }
  
  private static generateRecommendationReasoning(problem: any, aiConfidence: AIConfidenceScore, learningPattern: LearningPattern): string {
    const reasons = [];
    
    if (aiConfidence.overall > 80) {
      reasons.push('High AI confidence match');
    }
    
    if (learningPattern.preferredTopics.includes(problem.category)) {
      reasons.push('Matches your preferred topics');
    }
    
    if (aiConfidence.difficultyAlignment > 75) {
      reasons.push('Optimal difficulty for your level');
    }
    
    if (learningPattern.learningVelocity > 4) {
      reasons.push('Suitable for your learning pace');
    }
    
    return reasons.join(', ') || 'Good learning opportunity';
  }
  
  // Additional helper methods for ML insights
  private static classifyUserType(learningPattern: LearningPattern): string {
    if (learningPattern.learningVelocity > 5 && learningPattern.adaptabilityIndex > 70) {
      return 'Fast Adaptive Learner';
    } else if (learningPattern.consistencyScore > 80) {
      return 'Consistent Methodical Learner';
    } else if (learningPattern.preferredTopics.length > 3) {
      return 'Diverse Explorer';
    } else {
      return 'Focused Specialist';
    }
  }
  
  private static findSimilarUserPatterns(userCluster: string): string[] {
    const patterns = {
      'Fast Adaptive Learner': ['Quick problem solving', 'Multi-topic exploration', 'High retention'],
      'Consistent Methodical Learner': ['Daily practice', 'Steady progression', 'Deep understanding'],
      'Diverse Explorer': ['Topic variety', 'Experimental approach', 'Broad knowledge'],
      'Focused Specialist': ['Topic mastery', 'Depth over breadth', 'Expert-level skills']
    };
    
    return patterns[userCluster as keyof typeof patterns] || ['Unique learning pattern'];
  }
  
  private static identifySuccessPredictors(userProgress: ProgressiveUserProgress, learningPattern: LearningPattern): string[] {
    const predictors = [];
    
    if (learningPattern.consistencyScore > 70) predictors.push('High consistency');
    if (learningPattern.learningVelocity > 3) predictors.push('Good learning pace');
    if (learningPattern.retentionRate > 60) predictors.push('Strong retention');
    if (userProgress.currentStreak > 7) predictors.push('Long streak maintenance');
    
    return predictors.length > 0 ? predictors : ['Building foundation'];
  }
  
  private static identifyRiskFactors(userProgress: ProgressiveUserProgress, learningPattern: LearningPattern): string[] {
    const risks = [];
    
    if (learningPattern.consistencyScore < 40) risks.push('Low consistency');
    if (learningPattern.learningVelocity < 1) risks.push('Slow progress');
    if (learningPattern.retentionRate < 30) risks.push('Poor retention');
    if (learningPattern.avoidedTopics.length > 5) risks.push('Topic avoidance');
    
    return risks.length > 0 ? risks : ['No significant risks'];
  }
  
  private static generateOptimizationSuggestions(userProgress: ProgressiveUserProgress, learningPattern: LearningPattern): string[] {
    const suggestions = [];
    
    if (learningPattern.consistencyScore < 60) {
      suggestions.push('Focus on daily consistency');
    }
    
    if (learningPattern.retentionRate < 50) {
      suggestions.push('Review solved problems regularly');
    }
    
    if (learningPattern.adaptabilityIndex < 40) {
      suggestions.push('Try problems from different topics');
    }
    
    if (learningPattern.learningVelocity < 2) {
      suggestions.push('Increase daily problem count gradually');
    }
    
    return suggestions.length > 0 ? suggestions : ['Continue current approach'];
  }
  
  private static generatePersonalizedStrategies(userCluster: string, learningPattern: LearningPattern): string[] {
    const strategies = {
      'Fast Adaptive Learner': [
        'Challenge yourself with harder problems',
        'Explore advanced algorithms',
        'Focus on optimization techniques'
      ],
      'Consistent Methodical Learner': [
        'Maintain your steady pace',
        'Deep dive into problem patterns',
        'Build comprehensive understanding'
      ],
      'Diverse Explorer': [
        'Continue exploring new topics',
        'Connect concepts across domains',
        'Build broad algorithmic knowledge'
      ],
      'Focused Specialist': [
        'Master your chosen topics deeply',
        'Become an expert in specific areas',
        'Gradually expand to related topics'
      ]
    };
    
    return strategies[userCluster as keyof typeof strategies] || [
      'Develop consistent practice habits',
      'Focus on understanding over speed',
      'Build strong fundamentals'
    ];
  }
  
  // Additional helper methods for adaptive difficulty
  private static calculateCurrentDifficultyLevel(difficultyProgression: any): number {
    const weights = { easy: 1, medium: 2, hard: 3, veryHard: 4 };
    let totalWeight = 0;
    let totalProblems = 0;
    
    Object.entries(difficultyProgression).forEach(([key, data]: [string, any]) => {
      const weight = weights[key as keyof typeof weights] || 1;
      totalWeight += weight * data.solved;
      totalProblems += data.solved;
    });
    
    return totalProblems > 0 ? totalWeight / totalProblems : 1;
  }
  
  private static calculateTargetDifficulty(currentLevel: number, learningPattern: LearningPattern): number {
    let target = Math.min(4, currentLevel + 0.5);
    
    // Adjust based on learning pattern
    if (learningPattern.adaptabilityIndex > 70) target += 0.3;
    if (learningPattern.learningVelocity > 4) target += 0.2;
    
    return Math.min(4, target);
  }
  
  private static identifyAdaptationTriggers(userProgress: ProgressiveUserProgress, learningPattern: LearningPattern): string[] {
    const triggers = [];
    
    if (learningPattern.learningVelocity > 5) triggers.push('High learning velocity');
    if (learningPattern.retentionRate > 80) triggers.push('Excellent retention');
    if (userProgress.currentStreak > 14) triggers.push('Long streak');
    if (learningPattern.consistencyScore > 85) triggers.push('High consistency');
    
    return triggers;
  }
  
  private static extractDifficultyHistory(userProgress: ProgressiveUserProgress): number[] {
    // Simplified history extraction
    const progression = userProgress.difficultyProgression;
    return [
      progression.easy.solved,
      progression.medium.solved,
      progression.hard.solved,
      progression.veryHard.solved
    ];
  }
  
  private static predictNextDifficulty(current: number, target: number, progressionRate: number): string {
    const diff = target - current;
    const adjustedRate = progressionRate / 100;
    
    if (diff > 0.5 && adjustedRate > 0.6) {
      return 'Increase difficulty';
    } else if (diff < -0.3) {
      return 'Maintain or decrease difficulty';
    } else {
      return 'Gradual progression';
    }
  }
  
  private static calculatePlateauRisk(learningPattern: LearningPattern): number {
    let risk = 0;
    
    if (learningPattern.learningVelocity < 2) risk += 30;
    if (learningPattern.adaptabilityIndex < 40) risk += 25;
    if (learningPattern.retentionRate < 50) risk += 20;
    if (learningPattern.consistencyScore < 60) risk += 25;
    
    return Math.min(100, risk);
  }
  
  private static calculateBreakthroughProbability(userProgress: ProgressiveUserProgress, learningPattern: LearningPattern): number {
    let probability = 50; // Base probability
    
    if (learningPattern.learningVelocity > 4) probability += 20;
    if (learningPattern.adaptabilityIndex > 70) probability += 15;
    if (userProgress.currentStreak > 10) probability += 10;
    if (learningPattern.retentionRate > 70) probability += 15;
    
    return Math.min(100, probability);
  }
  
  private static calculateOptimalBreakDuration(learningPattern: LearningPattern): number {
    // Base break duration in minutes
    let breakDuration = 15;
    
    if (learningPattern.learningVelocity > 5) breakDuration += 10; // High intensity needs longer breaks
    if (learningPattern.consistencyScore < 50) breakDuration -= 5; // Inconsistent learners need shorter breaks
    
    return Math.max(5, Math.min(30, breakDuration));
  }
  
  private static predictDifficultyReadiness(currentLevel: number, learningPattern: LearningPattern): string[] {
    const readiness = [];
    
    // Base readiness on current level
    if (currentLevel >= 1) readiness.push('Easy');
    if (currentLevel >= 2 || learningPattern.adaptabilityIndex > 50) readiness.push('Medium');
    if (currentLevel >= 3 || (learningPattern.adaptabilityIndex > 70 && learningPattern.learningVelocity > 3)) readiness.push('Hard');
    if (currentLevel >= 4 || (learningPattern.adaptabilityIndex > 85 && learningPattern.learningVelocity > 5)) readiness.push('Very Hard');
    
    return readiness;
  }
}

export default function SupabaseProgressiveRecommendations() {
  const { user } = useAuth();
  const [userProgress, setUserProgress] = useState<ProgressiveUserProgress>(defaultProgressiveProgress);
  const [dailyRecommendation, setDailyRecommendation] = useState<DailyRecommendation | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [completedProblems, setCompletedProblems] = useState<Set<string>>(new Set());
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Advanced AI State
  const [learningPattern, setLearningPattern] = useState<LearningPattern | null>(null);
  const [cognitiveLoad, setCognitiveLoad] = useState<CognitiveLoadMetrics | null>(null);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState<PredictiveAnalytics | null>(null);
  const [smartRecommendations, setSmartRecommendations] = useState<SmartRecommendation[]>([]);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<AdaptiveDifficultyEngine | null>(null);
  const [mlInsights, setMlInsights] = useState<MachineLearningInsights | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);

  useEffect(() => {
    // Listen for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        loadSupabaseData();
      }
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Load data when user changes
  useEffect(() => {
    if (user && isOnline) {
      loadSupabaseData();
    } else {
      loadLocalData();
    }
  }, [user, isOnline]);

  // Real-time subscription for problem progress changes
  useEffect(() => {
    if (!user || !isOnline) return;

    const subscription = ProblemProgressService.subscribeToProgress(user.id, (payload) => {
      console.log('🔄 Real-time update received:', payload);
      // Reload data when changes occur
      loadSupabaseData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isOnline]);

  const loadLocalData = () => {
    setIsLoading(true);
    
    try {
      // Load from localStorage as fallback
      const savedProgress = localStorage.getItem('progressiveUserProgress');
      const progress = savedProgress ? JSON.parse(savedProgress) : defaultProgressiveProgress;
      
      // Convert arrays back to Sets if needed
      if (progress.solvedProblems && Array.isArray(progress.solvedProblems)) {
        progress.solvedProblems = new Set(progress.solvedProblems);
      }
      
      setUserProgress(progress);
      
      // Load completed problems from localStorage
      const problemStatuses = localStorage.getItem('dsa_problem_statuses');
      if (problemStatuses) {
        const statuses = JSON.parse(problemStatuses);
        const completed = new Set(
          Object.entries(statuses)
            .filter(([_, status]) => status === 'solved' || status === 'mastered')
            .map(([problemId, _]) => problemId)
        );
        setCompletedProblems(completed);
      }
      
      // Get recommendations (using localStorage fallback)
      const dailyRec = getProgressiveDailyRecommendations(progress);
      setDailyRecommendation(dailyRec);
      
      const message = getProgressiveMotivationalMessage(progress);
      setMotivationalMessage(message);
      
    } catch (error) {
      console.error('❌ Error loading local data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadSupabaseData = async () => {
    if (!user || !isOnline) {
      loadLocalData();
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('🔄 Loading real-time data from Supabase...');
      
      // Get user preferences from Supabase profile
      const userProfile = await SupabaseAuthService.getProfile(user.id);
      const preferences: UserPreferences = {
        learning_pace: userProfile.learning_pace as 'slow' | 'medium' | 'fast',
        daily_time_limit: userProfile.daily_time_limit,
        difficulty_preferences: userProfile.difficulty_preferences,
        adaptive_difficulty: userProfile.adaptive_difficulty
      };
      setUserPreferences(preferences);
      
      // Get completed problems from Supabase
      const problemProgress = await ProblemProgressService.getUserProgress(user.id);
      const completed = new Set(
        problemProgress
          .filter(p => p.status === 'solved' || p.status === 'mastered')
          .map(p => p.problem_id)
      );
      setCompletedProblems(completed);
      
      // Calculate real progress from Supabase data
      const updatedProgress: ProgressiveUserProgress = {
        ...defaultProgressiveProgress,
        solvedProblems: completed,
        totalActiveDays: calculateActiveDays(problemProgress),
        currentStreak: calculateCurrentStreak(problemProgress),
        currentLevel: calculateCurrentLevel(completed.size),
        lastActiveDate: getLastActiveDate(problemProgress),
        difficultyProgression: calculateDifficultyProgression(problemProgress),
        topicMastery: calculateTopicMastery(problemProgress)
      };
      
      setUserProgress(updatedProgress);
      
      // Get AI recommendations based on real-time data with Supabase preferences
      const dailyRec = getProgressiveDailyRecommendations(updatedProgress, preferences);
      // Keep completed problems in recommendations to show them as green
      setDailyRecommendation(dailyRec);
      
      const message = getProgressiveMotivationalMessage(updatedProgress);
      setMotivationalMessage(message);
      
      setLastSyncTime(new Date());
      
      console.log('✅ Real-time Supabase data loaded:', {
        user: user.full_name,
        learning_pace: preferences.learning_pace,
        completed_problems: completed.size,
        daily_time_limit: preferences.daily_time_limit,
        difficulty_preferences: preferences.difficulty_preferences,
        available_recommendations: dailyRec?.problems.length || 0
      });
      
      // Process advanced AI analytics with real session data
      const userSessions = await UserSessionService.getUserSessions(user.id, undefined, undefined);
      await processAdvancedAI(problemProgress, userSessions);
      
    } catch (error) {
      console.error('❌ Error loading Supabase data, falling back to localStorage:', error);
      loadLocalData();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Advanced AI Processing Function
  const processAdvancedAI = useCallback(async (problemProgress: any[], userSessions: any[]) => {
    if (!problemProgress.length && !userSessions.length) return;
    
    setAiProcessing(true);
    
    try {
      console.log('🧠 Processing advanced AI analytics...');
      
      // 1. Analyze Learning Pattern
      const pattern = AdvancedAIEngine.analyzeUserLearningPattern(problemProgress, userSessions);
      setLearningPattern(pattern);
      
      // 2. Assess Cognitive Load
      const recentSessions = userSessions.slice(-7); // Last 7 sessions
      const todayTimeSpent = recentSessions.reduce((sum, s) => sum + (s.time_spent || 0), 0) / 60; // Convert to minutes
      const cognitive = AdvancedAIEngine.assessCognitiveLoad(recentSessions, userProgress.currentStreak, todayTimeSpent);
      setCognitiveLoad(cognitive);
      
      // 3. Generate Predictive Analytics
      const analytics = AdvancedAIEngine.generatePredictiveAnalytics(userProgress, pattern);
      setPredictiveAnalytics(analytics);
      
      // 4. Create Adaptive Difficulty Engine
      const difficulty = AdvancedAIEngine.createAdaptiveDifficultyEngine(userProgress, pattern);
      setAdaptiveDifficulty(difficulty);
      
      // 5. Generate ML Insights
      const insights = AdvancedAIEngine.generateMLInsights(userProgress, pattern);
      setMlInsights(insights);
      
      // 6. Generate Smart Recommendations
      if (dailyRecommendation?.problems) {
        const smartRecs = AdvancedAIEngine.generateSmartRecommendations(
          dailyRecommendation.problems,
          userProgress,
          pattern,
          cognitive,
          3
        );
        setSmartRecommendations(smartRecs);
      }
      
      console.log('✅ Advanced AI processing complete:', {
        learningPattern: pattern,
        cognitiveLoad: cognitive,
        predictiveAnalytics: analytics,
        adaptiveDifficulty: difficulty,
        mlInsights: insights
      });
      
    } catch (error) {
      console.error('❌ Error in advanced AI processing:', error);
    } finally {
      setAiProcessing(false);
    }
  }, [userProgress, dailyRecommendation]);
  
  // Memoized AI insights for performance
  const aiInsights = useMemo(() => {
    if (!learningPattern || !cognitiveLoad || !predictiveAnalytics) return null;
    
    return {
      learningPattern,
      cognitiveLoad,
      predictiveAnalytics,
      adaptiveDifficulty,
      mlInsights,
      smartRecommendations
    };
  }, [learningPattern, cognitiveLoad, predictiveAnalytics, adaptiveDifficulty, mlInsights, smartRecommendations]);

  const handleProblemSolved = async (problemId: string) => {
    try {
      console.log('🎯 Marking problem as solved:', problemId);
      
      // Update local state immediately for UI responsiveness
      const updatedProgress = { ...userProgress };
      markProgressiveProblemSolved(problemId, updatedProgress);
      setUserProgress(updatedProgress);
      
      // Add to completed problems set
      const newCompletedProblems = new Set(completedProblems);
      newCompletedProblems.add(problemId);
      setCompletedProblems(newCompletedProblems);
      
      // Update localStorage for offline access
      const problemStatuses = JSON.parse(localStorage.getItem('dsa_problem_statuses') || '{}');
      problemStatuses[problemId] = 'solved';
      localStorage.setItem('dsa_problem_statuses', JSON.stringify(problemStatuses));
      
      // Update Supabase if user is authenticated and online
      if (user && isOnline) {
        try {
          // Find problem details for session tracking
          const problem = dailyRecommendation?.problems.find(p => p.id === problemId);
          const timeSpent = 30; // Default time, can be tracked more accurately
          
          // Update problem status
          await ProblemProgressService.updateProblemStatus(user.id, problemId, {
            status: 'solved',
            solved_at: new Date().toISOString(),
            time_spent: timeSpent
          });
          
          // Update user session for AI analytics
          if (problem) {
            await UserSessionService.recordProblemSolved(
              user.id,
              problemId,
              problem.category,
              timeSpent
            );
            console.log('✅ User session updated for AI analytics');
          }
          
          console.log('✅ Problem status updated in Supabase:', problemId);
          
          // Refresh AI insights with updated session data
          try {
            const updatedSessions = await UserSessionService.getUserSessions(user.id);
            const problemProgress = await ProblemProgressService.getUserProgress(user.id);
            await processAdvancedAI(problemProgress, updatedSessions);
            console.log('🧠 AI insights refreshed with new session data');
          } catch (aiError) {
            console.warn('⚠️ Failed to refresh AI insights:', aiError);
          }
          
          // Don't reload data - keep the green styling visible
          console.log('🟢 Problem will remain visible with green styling');
          
        } catch (supabaseError) {
          console.error('⚠️ Failed to update Supabase, but local update succeeded:', supabaseError);
        }
      } else {
        // Keep local state - don't reload to maintain green styling
        console.log('🟢 Offline mode: Problem will remain visible with green styling');
      }
      
    } catch (error) {
      console.error('❌ Error marking problem as solved:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'Hard': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'Very Hard': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getPlatformInfo = (link?: string) => {
    if (!link) return { name: 'Practice', color: 'bg-gray-500 hover:bg-gray-600' };
    
    if (link.includes('leetcode.com')) {
      return { name: 'LeetCode', color: 'bg-orange-500 hover:bg-orange-600' };
    } else if (link.includes('geeksforgeeks.org')) {
      return { name: 'GeeksforGeeks', color: 'bg-green-500 hover:bg-green-600' };
    }
    
    return { name: 'Practice', color: 'bg-gray-500 hover:bg-gray-600' };
  };

  const getPaceColor = (pace: string) => {
    switch (pace) {
      case 'slow': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'fast': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <Brain className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-medium">
              {user && isOnline ? 'Loading real-time recommendations...' : 'Loading recommendations...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Skip "All caught up" message - continue showing component even with no problems
  if (!dailyRecommendation) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
      {/* Header with Real-time Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {user && (
            <div className="flex items-center space-x-1 sm:space-x-2">
              {isOnline ? (
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <Wifi className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs font-medium">Live</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                  <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs font-medium">Offline</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {lastSyncTime && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* User Preferences Display */}
        {user && userPreferences && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-blue-900 dark:text-blue-100 text-sm sm:text-base truncate">
                    Personalized for {user.full_name}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    Real-time sync • {completedProblems.size} problems completed
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${getPaceColor(userPreferences.learning_pace)}`}>
                  {userPreferences.learning_pace.charAt(0).toUpperCase() + userPreferences.learning_pace.slice(1)} Pace
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {userPreferences.daily_time_limit}min/day
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 break-words">
              🎯 Difficulty: {userPreferences.difficulty_preferences.join(', ')} • 
              AI Adaptive: {userPreferences.adaptive_difficulty ? 'On' : 'Off'}
            </div>
          </div>
        )}

        {/* Advanced AI Insights */}
        {aiInsights && (
          <div className="space-y-3 sm:space-y-4">
            {/* AI Processing Status */}
            {aiProcessing && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 animate-pulse flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100">Processing Advanced AI Analytics...</span>
                </div>
              </div>
            )}

            {/* Cognitive Load Metrics */}
            {cognitiveLoad && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <h4 className="font-medium text-orange-900 dark:text-orange-100 text-sm sm:text-base">Cognitive Load Analysis</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                    cognitiveLoad.burnoutRisk === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                    cognitiveLoad.burnoutRisk === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  }`}>
                    {cognitiveLoad.burnoutRisk} risk
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex justify-between sm:block">
                    <span className="text-orange-700 dark:text-orange-300">Current Load:</span>
                    <span className="ml-2 font-medium">{Math.round(cognitiveLoad.currentLoad)}%</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-orange-700 dark:text-orange-300">Efficiency:</span>
                    <span className="ml-2 font-medium">{Math.round(cognitiveLoad.learningEfficiency * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Learning Pattern Insights */}
            {learningPattern && (
              <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 sm:p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <h4 className="font-medium text-green-900 dark:text-green-100 text-sm sm:text-base">Learning Pattern Analysis</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex justify-between sm:block">
                    <span className="text-green-700 dark:text-green-300">Velocity:</span>
                    <span className="ml-2 font-medium">{learningPattern.learningVelocity.toFixed(1)} problems/week</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-green-700 dark:text-green-300">Consistency:</span>
                    <span className="ml-2 font-medium">{Math.round(learningPattern.consistencyScore)}%</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-green-700 dark:text-green-300">Retention:</span>
                    <span className="ml-2 font-medium">{Math.round(learningPattern.retentionRate)}%</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-green-700 dark:text-green-300">Adaptability:</span>
                    <span className="ml-2 font-medium">{Math.round(learningPattern.adaptabilityIndex)}%</span>
                  </div>
                </div>
                {learningPattern.preferredTopics.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                    <span className="text-green-700 dark:text-green-300 text-xs sm:text-sm">Preferred Topics:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {learningPattern.preferredTopics.map((topic, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full whitespace-nowrap">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Predictive Analytics */}
            {predictiveAnalytics && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Predictive Analytics</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Next Week Performance:</span>
                    <span className="ml-2 font-medium">{Math.round(predictiveAnalytics.nextWeekPerformance)}%</span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Breakthrough Probability:</span>
                    <span className="ml-2 font-medium">{Math.round(predictiveAnalytics.breakthroughProbability)}%</span>
                  </div>
                </div>
                {predictiveAnalytics.difficultyReadiness.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <span className="text-blue-700 dark:text-blue-300 text-sm">Ready for Difficulties:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {predictiveAnalytics.difficultyReadiness.map((difficulty, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                          {difficulty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ML Insights */}
            {mlInsights && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">Machine Learning Insights</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-purple-700 dark:text-purple-300 text-sm font-medium">User Type:</span>
                    <span className="ml-2 text-sm">{mlInsights.userCluster}</span>
                  </div>
                  {mlInsights.optimizationSuggestions.length > 0 && (
                    <div>
                      <span className="text-purple-700 dark:text-purple-300 text-sm font-medium">AI Recommendations:</span>
                      <ul className="mt-1 space-y-1">
                        {mlInsights.optimizationSuggestions.slice(0, 2).map((suggestion, index) => (
                          <li key={index} className="text-sm text-purple-600 dark:text-purple-400 flex items-center space-x-1">
                            <Lightbulb className="h-3 w-3" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {mlInsights.riskFactors.length > 0 && mlInsights.riskFactors[0] !== 'No significant risks' && (
                    <div>
                      <span className="text-purple-700 dark:text-purple-300 text-sm font-medium">Risk Factors:</span>
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        <span className="text-sm text-orange-600 dark:text-orange-400">{mlInsights.riskFactors[0]}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progressive Learning Path */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">📚 Progressive Learning Path</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Day {userProgress.totalActiveDays + 1} • {userProgress.currentLevel.name}
            </span>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              {dailyRecommendation.problems.length} problems waiting for you. {motivationalMessage}
            </span>
          </div>
        </div>

        {/* Smart AI Recommendations */}
        {smartRecommendations.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">AI-Powered Smart Recommendations</h4>
            </div>
            {smartRecommendations.map((smartRec) => {
              const problem = smartRec.problem;
              const isSolved = completedProblems.has(problem.id);
              const platformInfo = getPlatformInfo(problem.link);
              
              const cardClassName = isSolved 
                ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                : 'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20';
              
              return (
                <div
                  key={problem.id}
                  className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${cardClassName}`}
                >
                  <div className="space-y-3">
                    {/* Problem Header with AI Confidence */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium text-sm sm:text-base ${
                          isSolved 
                            ? 'text-green-800 dark:text-green-200' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {isSolved && '✅ '}{problem.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{problem.category}</span>
                          <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{smartRec.predictedSolveTime} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className={`text-xs font-medium ${
                            smartRec.aiConfidence.overall >= 80 ? 'text-green-600 dark:text-green-400' :
                            smartRec.aiConfidence.overall >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-orange-600 dark:text-orange-400'
                          }`}>
                            {Math.round(smartRec.aiConfidence.overall)}% AI Match
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Priority: {Math.round(smartRec.priorityScore)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Reasoning */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">AI Reasoning</span>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300">{smartRec.reasoning}</p>
                      
                      {/* AI Confidence Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 mt-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-purple-600 dark:text-purple-400">Topic Match:</span>
                          <span className="font-medium">{Math.round(smartRec.aiConfidence.topicMatch)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-600 dark:text-purple-400">Difficulty:</span>
                          <span className="font-medium">{Math.round(smartRec.aiConfidence.difficultyAlignment)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-600 dark:text-purple-400">Learning Value:</span>
                          <span className="font-medium">{Math.round(smartRec.learningValue)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-600 dark:text-purple-400">Cognitive Load:</span>
                          <span className={`font-medium ${
                            smartRec.cognitiveLoadImpact < 20 ? 'text-green-600 dark:text-green-400' :
                            smartRec.cognitiveLoadImpact < 35 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {Math.round(smartRec.cognitiveLoadImpact)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isSolved ? (
                          <div className="flex items-center space-x-1 px-3 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-md text-xs font-medium">
                            <CheckCircle className="h-3 w-3" />
                            <span>✅ Solved</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleProblemSolved(problem.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-xs"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Mark Solved</span>
                          </button>
                        )}
                        {problem.link && (
                          <a
                            href={problem.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center space-x-1 px-3 py-1 text-white rounded-md transition-colors text-xs ${platformInfo.color}`}
                          >
                            <span>{platformInfo.name}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      
                      {/* AI Confidence Indicator */}
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          smartRec.aiConfidence.overall >= 80 ? 'bg-green-500' :
                          smartRec.aiConfidence.overall >= 60 ? 'bg-yellow-500' :
                          'bg-orange-500'
                        }`}></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">AI Recommended</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Fallback to Regular Recommendations */
          <div className="space-y-3">
            {dailyRecommendation.problems.map((problem) => {
            const isSolved = completedProblems.has(problem.id);
            const platformInfo = getPlatformInfo(problem.link);
            
            // Show solved problems with green styling
            const cardClassName = isSolved 
              ? "border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 transition-all duration-300"
              : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow";
            
            return (
              <div 
                key={problem.id}
                className={cardClassName}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className={`font-medium text-sm sm:text-base ${
                        isSolved 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {isSolved && '✅ '}{problem.title}
                      </h4>
                    </div>
                    
                    <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-3 space-y-1 xs:space-y-0 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                      <span className="text-xs sm:text-sm">{problem.category}</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{problem.timeEstimate} min</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {isSolved ? (
                      <div className="flex items-center space-x-1 px-3 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-md text-xs sm:text-sm font-medium">
                        <CheckCircle className="h-3 w-3" />
                        <span>✅ Solved</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleProblemSolved(problem.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-xs sm:text-sm"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Mark Solved</span>
                      </button>
                    )}
                    {problem.link && (
                      <a
                        href={problem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center space-x-1 px-3 py-1 text-white rounded-md transition-colors text-xs sm:text-sm ${platformInfo.color}`}
                      >
                        <span>{platformInfo.name}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Progress Bar */}
        {dailyRecommendation && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Daily Progress</span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {dailyRecommendation.completed}/{dailyRecommendation.totalTarget} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(dailyRecommendation.completed / dailyRecommendation.totalTarget) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
