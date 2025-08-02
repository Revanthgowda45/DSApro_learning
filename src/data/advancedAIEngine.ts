import { dsaProblems, getTopics } from './dsaDatabase';
import type { Problem } from './dsaDatabase';

// Advanced User Progress Interface with Learning Analytics
export interface UserProgress {
  solvedProblems: Set<string>;
  attemptedProblems: Set<string>;
  bookmarkedProblems: Set<string>;
  weakTopics: string[];
  strongTopics: string[];
  currentStreak: number;
  totalStudyTime: number;
  averageTimePerProblem: number;
  lastActiveDate: string;
  learningVelocity: number;
  conceptMastery: Record<string, number>;
  problemSolvingPatterns: Record<string, number>;
  difficultyProgression: Record<string, number>;
  cognitiveLoadCapacity: number;
  adaptiveLearningRate: number;
  retentionRate: number;
  motivationLevel: number;
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
    conceptualDifficulty: number;
    implementationComplexity: number;
    debuggingDifficulty: number;
    memoryRequirement: number;
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
  strategicValue: number;
  learningImpact: number;
  adaptiveReasoning: string;
  personalizedHints: string[];
}

// Neural Network-Inspired Learning Model
class NeuralLearningModel {
  private weights: Record<string, number> = {};
  private biases: Record<string, number> = {};

  constructor() {
    this.initializeWeights();
  }

  private initializeWeights() {
    const topics = getTopics();
    topics.forEach(topic => {
      this.weights[topic] = Math.random() * 0.1;
      this.biases[topic] = Math.random() * 0.1;
    });
  }

  predict(features: Record<string, number>): number {
    let activation = 0;
    Object.entries(features).forEach(([key, value]) => {
      activation += (this.weights[key] || 0) * value + (this.biases[key] || 0);
    });
    return this.sigmoid(activation);
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
}

// Advanced AI Recommendation Engine
export class AdvancedAIRecommendationEngine {
  private userProgress: UserProgress;
  private allProblems: Problem[];
  private neuralModel: NeuralLearningModel;

  constructor(userProgress: UserProgress) {
    this.userProgress = userProgress;
    this.allProblems = dsaProblems;
    this.neuralModel = new NeuralLearningModel();
  }

  getAdvancedRecommendations(count: number = 3): RecommendationWithInsights[] {
    const candidates = this.generateCandidateProblems();
    const scoredCandidates = candidates.map(problem => this.scoreWithAI(problem));
    
    scoredCandidates.sort((a, b) => {
      const aScore = a.strategicValue * 0.6 + a.learningImpact * 0.4;
      const bScore = b.strategicValue * 0.6 + b.learningImpact * 0.4;
      return bScore - aScore;
    });

    return scoredCandidates.slice(0, count);
  }

  private generateCandidateProblems(): Problem[] {
    return this.allProblems.filter(p => 
      !this.userProgress.solvedProblems.has(p.id)
    ).slice(0, 20); // Limit candidates for performance
  }

  private scoreWithAI(problem: Problem): RecommendationWithInsights {
    const features = this.extractFeatures(problem);
    const neuralPrediction = this.neuralModel.predict(features);
    const aiInsights = this.generateAdvancedInsights(problem);
    
    return {
      problem,
      confidence: this.calculateAdvancedConfidence(problem, neuralPrediction),
      reason: this.generateAdaptiveReason(problem, aiInsights),
      estimatedSuccessRate: neuralPrediction * 100,
      aiInsights,
      strategicValue: this.calculateStrategicValue(problem, aiInsights),
      learningImpact: this.calculateLearningImpact(problem, aiInsights),
      adaptiveReasoning: `AI recommends this ${problem.difficulty} ${problem.category} problem based on your learning patterns and neural network analysis.`,
      personalizedHints: this.generatePersonalizedHints(problem)
    };
  }

  private extractFeatures(problem: Problem): Record<string, number> {
    const difficultyLevels = { 'Easy': 0.25, 'Medium': 0.5, 'Hard': 0.75, 'Very Hard': 1.0 };
    
    return {
      [problem.category]: this.userProgress.conceptMastery[problem.category] || 0,
      difficulty: difficultyLevels[problem.difficulty],
      learning_velocity: this.userProgress.learningVelocity,
      motivation: this.userProgress.motivationLevel
    };
  }

  private generateAdvancedInsights(problem: Problem): AdvancedAIInsights {
    const pattern = this.identifyAlgorithmPattern(problem);
    const cognitiveLoad = this.calculateCognitiveLoad(problem);
    
    return {
      difficultyScore: this.calculateDifficultyScore(problem),
      trending: problem.companies.length >= 3,
      conceptsRequired: this.getRequiredConcepts(problem),
      estimatedTime: this.estimateTimeToSolve(problem),
      similarProblems: this.findSimilarProblems(problem),
      algorithmicComplexity: {
        timeComplexity: this.estimateTimeComplexity(problem),
        spaceComplexity: this.estimateSpaceComplexity(problem),
        optimizationPotential: this.calculateOptimizationPotential(problem),
        algorithmFamily: pattern
      },
      learningPath: {
        prerequisites: this.getPrerequisites(problem),
        nextSteps: this.suggestNextSteps(problem),
        masteryLevel: this.userProgress.conceptMastery[problem.category] || 0,
        learningCurve: this.predictLearningCurve(problem)
      },
      cognitiveLoad,
      patternRecognition: {
        algorithmPattern: pattern,
        dataStructurePattern: this.identifyDataStructurePattern(problem),
        problemSolvingStrategy: this.identifyProblemSolvingStrategy(problem),
        designPatternUsed: 'Iterative'
      },
      neuralNetworkPrediction: {
        successProbability: this.neuralModel.predict(this.extractFeatures(problem)),
        timeToSolve: this.estimateTimeToSolve(problem),
        strugglingPoints: this.predictStrugglingPoints(problem),
        optimizationSuggestions: this.generateOptimizationSuggestions(problem)
      }
    };
  }

  private calculateCognitiveLoad(problem: Problem): AdvancedAIInsights['cognitiveLoad'] {
    const difficultyMap = { 'Easy': 0.2, 'Medium': 0.5, 'Hard': 0.8, 'Very Hard': 1.0 };
    const baseDifficulty = difficultyMap[problem.difficulty];
    
    return {
      conceptualDifficulty: baseDifficulty,
      implementationComplexity: baseDifficulty * 0.8,
      debuggingDifficulty: baseDifficulty * 0.9,
      memoryRequirement: baseDifficulty * 0.7
    };
  }

  private calculateAdvancedConfidence(problem: Problem, neuralPrediction: number): number {
    let confidence = neuralPrediction * 5;
    const topicMastery = this.userProgress.conceptMastery[problem.category] || 0;
    confidence += topicMastery;
    confidence *= (1 + this.userProgress.adaptiveLearningRate * 0.1);
    return Math.max(1, Math.min(5, confidence));
  }

  private generateAdaptiveReason(problem: Problem, insights: AdvancedAIInsights): string {
    const masteryLevel = insights.learningPath.masteryLevel;
    
    if (masteryLevel < 0.3) {
      return `🎯 Perfect for building ${problem.category} foundation • AI confidence: ${Math.round(insights.neuralNetworkPrediction.successProbability * 100)}%`;
    } else if (masteryLevel > 0.7) {
      return `🚀 Challenge your ${problem.category} expertise • High optimization potential`;
    } else {
      return `⚡ Ideal for your current ${problem.category} level • ${insights.learningPath.learningCurve} learning curve`;
    }
  }

  private calculateStrategicValue(problem: Problem, insights: AdvancedAIInsights): number {
    let value = 0.5;
    const topicMastery = this.userProgress.conceptMastery[problem.category] || 0;
    if (topicMastery < 0.5) value += 0.3;
    value += insights.algorithmicComplexity.optimizationPotential * 0.2;
    if (insights.trending) value += 0.1;
    return Math.min(1, value);
  }

  private calculateLearningImpact(problem: Problem, insights: AdvancedAIInsights): number {
    let impact = 0.5;
    const patternFamiliarity = this.userProgress.problemSolvingPatterns[insights.patternRecognition.algorithmPattern] || 0;
    if (patternFamiliarity < 0.5) impact += 0.3;
    if (insights.learningPath.learningCurve === 'steep') impact += 0.2;
    return Math.min(1, impact);
  }

  // Helper methods
  private identifyAlgorithmPattern(problem: Problem): string {
    const title = problem.title.toLowerCase();
    const category = problem.category.toLowerCase();
    
    if (title.includes('two') && title.includes('pointer')) return 'Two Pointers';
    if (category.includes('dynamic') || title.includes('dp')) return 'Dynamic Programming';
    if (category.includes('graph')) return 'Graph Traversal';
    if (category.includes('tree')) return 'Tree Traversal';
    if (category.includes('sort')) return 'Sorting Algorithm';
    return 'General Problem Solving';
  }

  private calculateDifficultyScore(problem: Problem): number {
    const scores = { 'Easy': 0.25, 'Medium': 0.5, 'Hard': 0.75, 'Very Hard': 1.0 };
    return scores[problem.difficulty];
  }

  private estimateTimeToSolve(problem: Problem): number {
    const baseTimes = { 'Easy': 20, 'Medium': 35, 'Hard': 50, 'Very Hard': 75 };
    const baseTime = baseTimes[problem.difficulty];
    const topicMastery = this.userProgress.conceptMastery[problem.category] || 0;
    return Math.round(baseTime * (1 - topicMastery * 0.3));
  }

  private findSimilarProblems(problem: Problem): string[] {
    return this.allProblems
      .filter(p => p.category === problem.category && p.id !== problem.id)
      .slice(0, 3)
      .map(p => p.title);
  }

  private estimateTimeComplexity(problem: Problem): string {
    const complexities = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'];
    const difficultyIndex = { 'Easy': 2, 'Medium': 3, 'Hard': 4, 'Very Hard': 5 };
    return complexities[difficultyIndex[problem.difficulty]];
  }

  private estimateSpaceComplexity(problem: Problem): string {
    const complexities = ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'];
    const difficultyIndex = { 'Easy': 0, 'Medium': 1, 'Hard': 2, 'Very Hard': 3 };
    return complexities[difficultyIndex[problem.difficulty]];
  }

  private calculateOptimizationPotential(problem: Problem): number {
    const potentials = { 'Easy': 0.2, 'Medium': 0.5, 'Hard': 0.8, 'Very Hard': 0.9 };
    return potentials[problem.difficulty];
  }

  private getRequiredConcepts(problem: Problem): string[] {
    const conceptMap: Record<string, string[]> = {
      'Arrays': ['Indexing', 'Iteration', 'Two Pointers'],
      'Strings': ['Character Manipulation', 'Pattern Matching'],
      'Dynamic Programming': ['Recursion', 'Memoization', 'State Transition'],
      'Graph': ['BFS', 'DFS', 'Graph Theory'],
      'Tree': ['Tree Traversal', 'Recursion']
    };
    return conceptMap[problem.category] || ['Problem Solving', 'Logic'];
  }

  private getPrerequisites(problem: Problem): string[] {
    const prereqMap: Record<string, string[]> = {
      'Arrays': ['Basic Programming'],
      'Dynamic Programming': ['Recursion', 'Mathematical Thinking'],
      'Graph': ['Data Structures', 'Queue/Stack'],
      'Tree': ['Recursion', 'Data Structures']
    };
    return prereqMap[problem.category] || ['Basic Programming'];
  }

  private suggestNextSteps(problem: Problem): string[] {
    return ['Practice similar problems', `Master ${problem.category} patterns`];
  }

  private predictLearningCurve(problem: Problem): 'steep' | 'moderate' | 'gentle' {
    const topicMastery = this.userProgress.conceptMastery[problem.category] || 0;
    const difficultyGap = this.calculateDifficultyScore(problem) - topicMastery;
    
    if (difficultyGap > 0.5) return 'steep';
    if (difficultyGap > 0.2) return 'moderate';
    return 'gentle';
  }

  private identifyDataStructurePattern(problem: Problem): string {
    const category = problem.category.toLowerCase();
    if (category.includes('array')) return 'Array';
    if (category.includes('string')) return 'String';
    if (category.includes('tree')) return 'Tree';
    if (category.includes('graph')) return 'Graph';
    return 'Mixed';
  }

  private identifyProblemSolvingStrategy(problem: Problem): string {
    const strategies = ['Divide and Conquer', 'Greedy', 'Brute Force', 'Optimization'];
    const difficultyIndex = { 'Easy': 2, 'Medium': 0, 'Hard': 1, 'Very Hard': 3 };
    return strategies[difficultyIndex[problem.difficulty]];
  }

  private predictStrugglingPoints(problem: Problem): string[] {
    const points: Record<string, string[]> = {
      'Easy': ['Edge cases', 'Implementation details'],
      'Medium': ['Algorithm choice', 'Optimization'],
      'Hard': ['Complex logic', 'Multiple approaches'],
      'Very Hard': ['Advanced algorithms', 'Mathematical concepts']
    };
    return points[problem.difficulty];
  }

  private generateOptimizationSuggestions(problem: Problem): string[] {
    return [
      'Consider time-space tradeoffs',
      'Look for mathematical patterns',
      'Use appropriate data structures'
    ];
  }

  private generatePersonalizedHints(problem: Problem): string[] {
    const topicMastery = this.userProgress.conceptMastery[problem.category] || 0;
    
    if (topicMastery < 0.3) {
      return [
        `Start with the basic ${problem.category} approach`,
        'Draw out examples to understand the pattern',
        'Focus on correctness before optimization'
      ];
    } else if (topicMastery > 0.7) {
      return [
        'Consider multiple solution approaches',
        'Think about edge cases early',
        'Optimize for both time and space complexity'
      ];
    } else {
      return [
        'Break down the problem into smaller parts',
        'Consider similar problems you\'ve solved',
        'Test your solution with different inputs'
      ];
    }
  }
}

// Default user progress for new users
export const defaultUserProgress: UserProgress = {
  solvedProblems: new Set(),
  attemptedProblems: new Set(),
  bookmarkedProblems: new Set(),
  weakTopics: ['Arrays', 'Strings'],
  strongTopics: [],
  currentStreak: 0,
  totalStudyTime: 0,
  averageTimePerProblem: 30,
  lastActiveDate: new Date().toISOString(),
  learningVelocity: 0.5,
  conceptMastery: {},
  problemSolvingPatterns: {},
  difficultyProgression: { 'Easy': 0.7, 'Medium': 0.4, 'Hard': 0.2, 'Very Hard': 0.1 },
  cognitiveLoadCapacity: 0.7,
  adaptiveLearningRate: 0.5,
  retentionRate: 0.8,
  motivationLevel: 0.7
};

// Helper function to get advanced AI recommendations
export function getAdvancedRecommendations(
  userProgress: UserProgress = defaultUserProgress, 
  count: number = 3
): RecommendationWithInsights[] {
  const engine = new AdvancedAIRecommendationEngine(userProgress);
  return engine.getAdvancedRecommendations(count);
}
