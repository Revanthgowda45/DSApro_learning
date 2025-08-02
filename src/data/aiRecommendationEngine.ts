import { dsaProblems } from './dsaDatabase';
import type { Problem } from './dsaDatabase';

// Advanced User Progress Interface with Learning Analytics
export interface UserProgress {
  solvedProblems: Set<string>;
  attemptedProblems: Set<string>;
  bookmarkedProblems: Set<string>;
  masteredProblems: Set<string>; // Added missing property
  weakTopics: string[];
  strongTopics: string[];
  currentStreak: number;
  totalSolved: number; // Added missing property
  totalStudyTime: number;
  averageTimePerProblem: number;
  lastActiveDate: string;
  consistencyScore: number; // Added missing property (0-100)
  learningVelocity: number; // Problems solved per hour
  conceptMastery: Record<string, number>; // Topic -> mastery level (0-1)
  problemSolvingPatterns: Record<string, number>; // Pattern -> success rate
  difficultyProgression: Record<string, number>; // Difficulty -> success rate
  cognitiveLoadCapacity: number; // User's current cognitive capacity (0-1)
  adaptiveLearningRate: number; // How quickly user adapts to new concepts
  retentionRate: number; // How well user retains learned concepts
  motivationLevel: number; // Current motivation score (0-1)
  // Additional properties for compatibility
  difficultyPreference?: string;
  lastSolvedDate?: string | null;
}

// Advanced AI Insights with Deep Learning Analytics
export interface AdvancedAIInsights {
  difficultyScore: number;
  trending: boolean;
  conceptsRequired: string[];
  estimatedTime: number;
  similarProblems: string[];
  algorithmicComplexity: {
    timeComplexity: string;
    spaceComplexity: string;
    optimizationPotential: number;
    algorithmFamily: string;
  };
  learningPath: {
    prerequisites: string[];
    nextSteps: string[];
    masteryLevel: number;
    learningCurve: 'steep' | 'moderate' | 'gentle';
  };
  cognitiveLoad: {
    conceptualDifficulty: number; // 0-1
    implementationComplexity: number; // 0-1
    debuggingDifficulty: number; // 0-1
    memoryRequirement: number; // 0-1
  };
  patternRecognition: {
    algorithmPattern: string;
    dataStructurePattern: string;
    problemSolvingStrategy: string;
    designPatternUsed: string;
  };
  neuralNetworkPrediction: {
    successProbability: number;
    timeToSolve: number;
    strugglingPoints: string[];
    optimizationSuggestions: string[];
  };
}

// Enhanced Recommendation with Strategic Learning Value
export interface RecommendationWithInsights {
  problem: Problem;
  confidence: number;
  reason: string;
  estimatedSuccessRate: number;
  aiInsights: AdvancedAIInsights;
  strategicValue: number; // Long-term learning value (0-1)
  learningImpact: number; // Immediate skill improvement (0-1)
  adaptiveReasoning: string; // AI's reasoning for this specific recommendation
  personalizedHints: string[]; // Customized hints based on user's learning style
}

export interface RecommendationReason {
  type: 'weak_topic' | 'difficulty_progression' | 'company_focus' | 'streak_maintenance' | 'balanced_practice';
  message: string;
}

export interface SmartRecommendation {
  problem: Problem;
  confidence: number; // 1-5 stars
  reason: RecommendationReason;
  priority: 'high' | 'medium' | 'low';
  estimatedSuccess: number; // 0-100%
}

export class AIRecommendationEngine {
  private userProgress: UserProgress;
  private allProblems: Problem[];

  constructor(userProgress: UserProgress) {
    this.userProgress = userProgress;
    this.allProblems = dsaProblems;
  }

  // Main recommendation function
  getSmartRecommendations(count: number = 3): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    
    // Strategy 1: Address weak topics (40% weight)
    const weakTopicRecs = this.getWeakTopicRecommendations(Math.ceil(count * 0.4));
    recommendations.push(...weakTopicRecs);

    // Strategy 2: Maintain strong topics (20% weight)
    const strongTopicRecs = this.getStrongTopicRecommendations(Math.ceil(count * 0.2));
    recommendations.push(...strongTopicRecs);

    // Strategy 3: Difficulty progression (30% weight)
    const difficultyRecs = this.getDifficultyProgressionRecommendations(Math.ceil(count * 0.3));
    recommendations.push(...difficultyRecs);

    // Strategy 4: Balanced selection (10% weight)
    const balancedRecs = this.getBalancedRecommendations(Math.ceil(count * 0.1));
    recommendations.push(...balancedRecs);

    // Remove duplicates and sort by priority and confidence
    const uniqueRecs = this.removeDuplicates(recommendations);
    const sortedRecs = this.sortByPriorityAndConfidence(uniqueRecs);

    return sortedRecs.slice(0, count);
  }

  // Get recommendations for weak topics
  private getWeakTopicRecommendations(count: number): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    
    for (const topic of this.userProgress.weakTopics) {
      const topicProblems = this.getUnsolvedProblemsByTopic(topic);
      const easyProblems = topicProblems.filter(p => p.difficulty === 'Easy');
      const mediumProblems = topicProblems.filter(p => p.difficulty === 'Medium');
      
      // Prioritize easy problems for weak topics
      const selectedProblems = [...easyProblems.slice(0, 2), ...mediumProblems.slice(0, 1)];
      
      for (const problem of selectedProblems.slice(0, count)) {
        recommendations.push({
          problem,
          confidence: this.calculateConfidence(problem, 'weak_topic'),
          reason: {
            type: 'weak_topic',
            message: `Strengthen your ${topic} skills with this foundational problem`
          },
          priority: 'high',
          estimatedSuccess: this.calculateSuccessRate(problem)
        });
      }
    }

    return recommendations;
  }

  // Get recommendations for strong topics
  private getStrongTopicRecommendations(count: number): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    
    for (const topic of this.userProgress.strongTopics) {
      const topicProblems = this.getUnsolvedProblemsByTopic(topic);
      const challengingProblems = topicProblems.filter(p => 
        p.difficulty === 'Hard' || p.difficulty === 'Very Hard'
      );
      
      for (const problem of challengingProblems.slice(0, count)) {
        recommendations.push({
          problem,
          confidence: this.calculateConfidence(problem, 'company_focus'),
          reason: {
            type: 'company_focus',
            message: `Challenge yourself with this ${problem.difficulty.toLowerCase()} ${topic} problem`
          },
          priority: 'medium',
          estimatedSuccess: this.calculateSuccessRate(problem)
        });
      }
    }

    return recommendations;
  }

  // Get recommendations based on difficulty progression
  private getDifficultyProgressionRecommendations(count: number): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    const nextDifficulty = this.getNextDifficulty();
    
    const unsolvedProblems = this.getUnsolvedProblems();
    const difficultyProblems = unsolvedProblems.filter(p => p.difficulty === nextDifficulty);
    
    // Prioritize problems from familiar topics
    const familiarTopicProblems = difficultyProblems.filter(p => 
      this.userProgress.strongTopics.includes(p.category)
    );
    
    const selectedProblems = familiarTopicProblems.length > 0 
      ? familiarTopicProblems 
      : difficultyProblems;
    
    for (const problem of selectedProblems.slice(0, count)) {
      recommendations.push({
        problem,
        confidence: this.calculateConfidence(problem, 'difficulty_progression'),
        reason: {
          type: 'difficulty_progression',
          message: `Ready to tackle ${nextDifficulty.toLowerCase()} problems? This one's perfect for your level`
        },
        priority: 'high',
        estimatedSuccess: this.calculateSuccessRate(problem)
      });
    }

    return recommendations;
  }

  // Get balanced recommendations
  private getBalancedRecommendations(count: number): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    const unsolvedProblems = this.getUnsolvedProblems();
    
    // Get a mix of different topics and difficulties
    const balancedProblems = this.getBalancedMix(unsolvedProblems, count);
    
    for (const problem of balancedProblems) {
      recommendations.push({
        problem,
        confidence: this.calculateConfidence(problem, 'balanced_practice'),
        reason: {
          type: 'balanced_practice',
          message: `Well-rounded practice with this ${problem.category} problem`
        },
        priority: 'medium',
        estimatedSuccess: this.calculateSuccessRate(problem)
      });
    }

    return recommendations;
  }

  // Helper methods
  private getUnsolvedProblems(): Problem[] {
    return this.allProblems.filter(p => 
      !this.userProgress.solvedProblems.has(p.id) && 
      !this.userProgress.masteredProblems.has(p.id)
    );
  }

  private getUnsolvedProblemsByTopic(topic: string): Problem[] {
    return this.getUnsolvedProblems().filter(p => p.category === topic);
  }

  private getNextDifficulty(): 'Easy' | 'Medium' | 'Hard' | 'Very Hard' {
    const solvedCount = this.userProgress.totalSolved;
    
    if (solvedCount < 20) return 'Easy';
    if (solvedCount < 50) return 'Medium';
    if (solvedCount < 100) return 'Hard';
    return 'Very Hard';
  }

  private calculateConfidence(problem: Problem, _strategy: string): number {
    let confidence = 3; // Base confidence
    
    // Adjust based on user's strength in the topic
    if (this.userProgress.strongTopics.includes(problem.category)) {
      confidence += 1;
    } else if (this.userProgress.weakTopics.includes(problem.category)) {
      confidence -= 1;
    }
    
    // Adjust based on difficulty vs user's level
    const nextDiff = this.getNextDifficulty();
    if (problem.difficulty === nextDiff) {
      confidence += 1;
    } else if (this.getDifficultyLevel(problem.difficulty) > this.getDifficultyLevel(nextDiff)) {
      confidence -= 1;
    }
    
    return Math.max(1, Math.min(5, confidence));
  }

  private calculateSuccessRate(problem: Problem): number {
    let successRate = 70; // Base success rate
    
    // Adjust based on user's familiarity with topic
    if (this.userProgress.strongTopics.includes(problem.category)) {
      successRate += 20;
    } else if (this.userProgress.weakTopics.includes(problem.category)) {
      successRate -= 15;
    }
    
    // Adjust based on difficulty
    const difficultyPenalty = {
      'Easy': 0,
      'Medium': -10,
      'Hard': -20,
      'Very Hard': -30
    };
    successRate += difficultyPenalty[problem.difficulty];
    
    // Adjust based on consistency
    successRate += (this.userProgress.consistencyScore - 50) / 5;
    
    return Math.max(20, Math.min(95, successRate));
  }

  private getDifficultyLevel(difficulty: string): number {
    const levels = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Very Hard': 4 };
    return levels[difficulty as keyof typeof levels] || 1;
  }

  private getBalancedMix(problems: Problem[], count: number): Problem[] {
    const topics = [...new Set(problems.map(p => p.category))];
    const result: Problem[] = [];
    
    for (let i = 0; i < count && i < topics.length; i++) {
      const topic = topics[i];
      const topicProblems = problems.filter(p => p.category === topic);
      if (topicProblems.length > 0) {
        result.push(topicProblems[0]);
      }
    }
    
    return result;
  }

  private removeDuplicates(recommendations: SmartRecommendation[]): SmartRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.problem.id)) {
        return false;
      }
      seen.add(rec.problem.id);
      return true;
    });
  }

  private sortByPriorityAndConfidence(recommendations: SmartRecommendation[]): SmartRecommendation[] {
    return recommendations.sort((a, b) => {
      // First sort by priority
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by confidence
      const confidenceDiff = b.confidence - a.confidence;
      if (confidenceDiff !== 0) return confidenceDiff;
      
      // Finally by estimated success rate
      return b.estimatedSuccess - a.estimatedSuccess;
    });
  }
}

// Default user progress for new users
export const defaultUserProgress: UserProgress = {
  solvedProblems: new Set(),
  attemptedProblems: new Set(),
  bookmarkedProblems: new Set(),
  masteredProblems: new Set(),
  weakTopics: ['Arrays', 'Strings'], // Start with basic topics as weak
  strongTopics: [],
  currentStreak: 0,
  totalSolved: 0,
  totalStudyTime: 0,
  averageTimePerProblem: 30,
  lastActiveDate: new Date().toISOString(),
  consistencyScore: 50,
  learningVelocity: 0.5, // Problems per hour
  conceptMastery: {},
  problemSolvingPatterns: {},
  difficultyProgression: {
    'Easy': 0.8,
    'Medium': 0.6,
    'Hard': 0.4,
    'Very Hard': 0.2
  },
  cognitiveLoadCapacity: 0.7,
  adaptiveLearningRate: 0.6,
  retentionRate: 0.75,
  motivationLevel: 0.7, // Fixed: changed from string to number (0-1)
  // Optional compatibility properties
  difficultyPreference: 'Easy',
  lastSolvedDate: null
};

// Helper function to get smart recommendations
export function getSmartRecommendations(
  userProgress: UserProgress = defaultUserProgress, 
  count: number = 3
): SmartRecommendation[] {
  const engine = new AIRecommendationEngine(userProgress);
  return engine.getSmartRecommendations(count);
}
