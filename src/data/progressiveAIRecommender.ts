import { dsaProblems } from './dsaDatabase';
import type { Problem } from './dsaDatabase';

// Progressive Learning System with Persistent Problem Tracking
export interface ProgressiveUserProgress {
  // Core Progress
  solvedProblems: Set<string>;
  attemptedProblems: Set<string>;
  bookmarkedProblems: Set<string>;
  
  // Persistent Problem Tracking
  pendingProblems: PendingProblem[];
  dailyRecommendations: DailyRecommendation[];
  
  // Learning Progression
  currentLevel: LearningLevel;
  skillProgression: SkillProgression;
  learningPath: ProgressiveLearningPath;
  
  // Consistency Tracking
  lastActiveDate: string;
  currentStreak: number;
  totalActiveDays: number;
  
  // Performance Analytics
  averageSolveTime: Record<string, number>;
  difficultyProgression: DifficultyProgression;
  topicMastery: Record<string, TopicMastery>;
}

export interface PendingProblem {
  problemId: string;
  assignedDate: string;
  daysCarriedOver: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  attempts: number;
  lastAttemptDate?: string;
}

export interface DailyRecommendation {
  date: string;
  problems: Problem[];
  carryOverProblems: Problem[];
  newProblems: Problem[];
  totalTarget: number;
  completed: number;
  status: 'pending' | 'partial' | 'completed';
}

export interface LearningLevel {
  name: 'Absolute Beginner' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  stage: number; // 1-5
  problemsSolved: number;
  requiredForNext: number;
  skillAreas: string[];
  currentFocus: string[];
}

export interface SkillProgression {
  foundationSkills: FoundationSkill[];
  intermediateSkills: IntermediateSkill[];
  advancedSkills: AdvancedSkill[];
  currentPhase: 'Foundation' | 'Building' | 'Mastering' | 'Specializing';
}

export interface FoundationSkill {
  name: string;
  topics: string[];
  requiredProblems: number;
  completedProblems: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface IntermediateSkill {
  name: string;
  prerequisites: string[];
  topics: string[];
  requiredProblems: number;
  completedProblems: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface AdvancedSkill {
  name: string;
  prerequisites: string[];
  topics: string[];
  requiredProblems: number;
  completedProblems: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface ProgressiveLearningPath {
  currentStep: number;
  totalSteps: number;
  steps: LearningStep[];
  estimatedDaysToComplete: number;
}

export interface LearningStep {
  id: number;
  title: string;
  description: string;
  topics: string[];
  difficulties: string[];
  targetProblems: number;
  completedProblems: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  estimatedDays: number;
}

export interface DifficultyProgression {
  easy: { solved: number; total: number; successRate: number };
  medium: { solved: number; total: number; successRate: number };
  hard: { solved: number; total: number; successRate: number };
  veryHard: { solved: number; total: number; successRate: number };
}

export interface TopicMastery {
  level: number; // 0-100
  problemsSolved: number;
  totalProblems: number;
  averageTime: number;
  successRate: number;
  lastPracticed: string;
  weakAreas: string[];
  strongPatterns: string[];
}

// Progressive AI Recommender Class
export class ProgressiveAIRecommender {
  private userProgress: ProgressiveUserProgress;
  private userPreferences?: {
    learning_pace: 'slow' | 'medium' | 'fast';
    daily_time_limit: number;
    difficulty_preferences: string[];
    adaptive_difficulty: boolean;
  };

  constructor(
    userProgress: ProgressiveUserProgress, 
    userPreferences?: {
      learning_pace: 'slow' | 'medium' | 'fast';
      daily_time_limit: number;
      difficulty_preferences: string[];
      adaptive_difficulty: boolean;
    }
  ) {
    this.userProgress = userProgress;
    this.userPreferences = userPreferences;
  }
  
  private allProblems = dsaProblems;

  // Getter to access updated user progress
  getUserProgress(): ProgressiveUserProgress {
    return this.userProgress;
  }

  // Main method to get daily recommendations with persistence
  getDailyRecommendations(): DailyRecommendation {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we have today's recommendations
    const existingRecommendation = this.userProgress.dailyRecommendations.find(
      rec => rec.date === today
    );

    if (existingRecommendation) {
      return existingRecommendation;
    }

    // Create new daily recommendations
    return this.createDailyRecommendations(today);
  }

  private createDailyRecommendations(date: string): DailyRecommendation {
    // Get carry-over problems (unsolved from previous days)
    const carryOverProblems = this.getCarryOverProblems();
    
    // Determine how many new problems to add
    const targetTotal = this.getTargetProblemsPerDay();
    const newProblemsNeeded = Math.max(0, targetTotal - carryOverProblems.length);
    
    // Get new problems based on current learning level
    const newProblems = this.selectNewProblems(newProblemsNeeded);
    
    // Combine all problems
    const allProblems = [...carryOverProblems, ...newProblems];
    
    const recommendation: DailyRecommendation = {
      date,
      problems: allProblems,
      carryOverProblems,
      newProblems,
      totalTarget: targetTotal,
      completed: 0,
      status: 'pending'
    };

    // Add to user's daily recommendations
    this.userProgress.dailyRecommendations.push(recommendation);
    
    // Update pending problems
    this.updatePendingProblems(allProblems, date);
    
    return recommendation;
  }

  private getCarryOverProblems(): Problem[] {
    const carryOverIds = this.userProgress.pendingProblems
      .filter(pending => !this.userProgress.solvedProblems.has(pending.problemId))
      .sort((a, b) => b.daysCarriedOver - a.daysCarriedOver) // Prioritize older problems
      .slice(0, 3) // Maximum 3 carry-over problems
      .map(pending => pending.problemId);

    return this.allProblems.filter(problem => carryOverIds.includes(problem.id));
  }

  private getTargetProblemsPerDay(): number {
    // Use Supabase preferences if available, otherwise fallback to localStorage
    let learningPace: 'slow' | 'medium' | 'fast' = 'slow';
    
    if (this.userPreferences) {
      // Use real-time Supabase preferences
      learningPace = this.userPreferences.learning_pace;
      console.log('🎯 Using Supabase learning pace:', learningPace);
    } else {
      // Fallback to localStorage for offline mode
      const userDataStr = localStorage.getItem('dsaUser');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          learningPace = userData.learningPace || 'slow';
          console.log('📱 Using localStorage learning pace:', learningPace);
        } catch (error) {
          console.warn('Error parsing user data:', error);
        }
      }
    }
    
    // Base problems per day based on learning pace
    let baseProblems: number;
    switch (learningPace) {
      case 'slow': baseProblems = 2; break;
      case 'medium': baseProblems = 4; break;
      case 'fast': baseProblems = 6; break;
      default: baseProblems = 2;
    }
    
    // Adjust based on user level (slight increase for advanced users)
    const level = this.userProgress.currentLevel;
    let levelMultiplier = 1;
    
    switch (level.name) {
      case 'Absolute Beginner': levelMultiplier = 1; break;
      case 'Beginner': levelMultiplier = 1; break;
      case 'Intermediate': levelMultiplier = 1.2; break;
      case 'Advanced': levelMultiplier = 1.3; break;
      case 'Expert': levelMultiplier = 1.5; break;
      default: levelMultiplier = 1;
    }
    
    // Calculate final target (minimum 2, maximum based on pace)
    const target = Math.round(baseProblems * levelMultiplier);
    const maxProblems = learningPace === 'slow' ? 3 : learningPace === 'medium' ? 5 : 8;
    
    console.log('📊 AI Recommendation Settings:', {
      learningPace,
      baseProblems,
      levelMultiplier,
      finalTarget: Math.max(2, Math.min(target, maxProblems)),
      source: this.userPreferences ? 'Supabase' : 'localStorage'
    });
    
    return Math.max(2, Math.min(target, maxProblems));
  }

  private selectNewProblems(count: number): Problem[] {
    if (count <= 0) return [];

    const unsolvedProblems = this.getUnsolvedProblems();
    
    // Get appropriate difficulty level based on user progress
    const userLevel = this.userProgress.currentLevel;
    const appropriateDifficulties = this.getAppropriateDifficulties(userLevel);
    
    // Filter problems by appropriate difficulty levels
    const appropriateProblems = unsolvedProblems.filter(problem => 
      appropriateDifficulties.includes(problem.difficulty)
    );

    // If not enough problems at appropriate difficulty, include all unsolved problems
    const problemsToSelect = appropriateProblems.length >= count 
      ? appropriateProblems 
      : unsolvedProblems;

    return this.selectDiverseProblems(problemsToSelect, count);
  }

  private selectDiverseProblems(problems: Problem[], count: number): Problem[] {
    // Ensure diversity in topics and companies
    const selected: Problem[] = [];
    const usedTopics = new Set<string>();
    const usedCompanies = new Set<string>();

    // First pass: select problems with diverse topics
    for (const problem of problems) {
      if (selected.length >= count) break;
      
      if (!usedTopics.has(problem.category)) {
        selected.push(problem);
        usedTopics.add(problem.category);
        problem.companies.forEach(company => usedCompanies.add(company));
      }
    }

    // Second pass: fill remaining slots
    for (const problem of problems) {
      if (selected.length >= count) break;
      
      if (!selected.includes(problem)) {
        selected.push(problem);
      }
    }

    return selected.slice(0, count);
  }

  private getCurrentLearningStep(): LearningStep {
    const currentStepIndex = this.userProgress.learningPath.currentStep - 1;
    return this.userProgress.learningPath.steps[currentStepIndex] || this.getDefaultStep();
  }

  private getDefaultStep(): LearningStep {
    return {
      id: 1,
      title: 'Foundation Building',
      description: 'Master basic data structures and algorithms',
      topics: ['Arrays', 'Strings'],
      difficulties: ['Easy'],
      targetProblems: 20,
      completedProblems: 0,
      isUnlocked: true,
      isCompleted: false,
      estimatedDays: 14
    };
  }

  private getUnsolvedProblems(): Problem[] {
    const unsolvedProblems = this.allProblems.filter(problem => 
      !this.userProgress.solvedProblems.has(problem.id)
    );
    
    console.log('🔍 Filtering unsolved problems:', {
      totalProblems: this.allProblems.length,
      solvedProblems: this.userProgress.solvedProblems.size,
      unsolvedProblems: unsolvedProblems.length,
      sampleSolvedIds: Array.from(this.userProgress.solvedProblems).slice(0, 5)
    });
    
    return unsolvedProblems;
  }

  private updatePendingProblems(problems: Problem[], date: string): void {
    problems.forEach(problem => {
      const existingPending = this.userProgress.pendingProblems.find(
        p => p.problemId === problem.id
      );

      if (existingPending) {
        // Increment days carried over
        existingPending.daysCarriedOver++;
        existingPending.priority = this.calculatePriority(existingPending.daysCarriedOver);
      } else {
        // Add new pending problem
        this.userProgress.pendingProblems.push({
          problemId: problem.id,
          assignedDate: date,
          daysCarriedOver: 0,
          priority: 'medium',
          reason: this.generateRecommendationReason(problem),
          attempts: 0
        });
      }
    });
  }

  private calculatePriority(daysCarriedOver: number): 'high' | 'medium' | 'low' {
    if (daysCarriedOver >= 3) return 'high';
    if (daysCarriedOver >= 1) return 'medium';
    return 'low';
  }

  private getAppropriateDifficulties(_userLevel: LearningLevel): string[] {
    // Use Supabase preferences if available, otherwise fallback to localStorage
    let adaptiveDifficulty = true;
    let difficultyPreferences: string[] = [];
    
    if (this.userPreferences) {
      // Use real-time Supabase preferences
      adaptiveDifficulty = this.userPreferences.adaptive_difficulty;
      difficultyPreferences = this.userPreferences.difficulty_preferences || [];
      console.log('🎯 Using Supabase difficulty preferences:', {
        adaptive: adaptiveDifficulty,
        preferences: difficultyPreferences
      });
    } else {
      // Fallback to localStorage for offline mode
      try {
        const storedPrefs = localStorage.getItem('dsa_difficulty_preferences');
        if (storedPrefs) {
          const parsed = JSON.parse(storedPrefs);
          const userDifficultyPrefs = parsed.difficulties;
          adaptiveDifficulty = parsed.adaptive !== undefined ? parsed.adaptive : true;
          
          // Convert localStorage format to array format
          if (userDifficultyPrefs) {
            if (userDifficultyPrefs.easy) difficultyPreferences.push('Easy');
            if (userDifficultyPrefs.medium) difficultyPreferences.push('Medium');
            if (userDifficultyPrefs.hard) difficultyPreferences.push('Hard');
            if (userDifficultyPrefs.veryHard) difficultyPreferences.push('Very Hard');
          }
        }
        console.log('📱 Using localStorage difficulty preferences:', {
          adaptive: adaptiveDifficulty,
          preferences: difficultyPreferences
        });
      } catch (error) {
        console.warn('Error loading difficulty preferences:', error);
      }
    }
    
    // If adaptive difficulty is enabled, use progressive logic
    if (adaptiveDifficulty) {
      const solvedCount = this.userProgress.solvedProblems.size;
      
      // Progressive difficulty based on problems solved
      if (solvedCount < 10) {
        return ['Easy'];
      } else if (solvedCount < 30) {
        return ['Easy', 'Medium'];
      } else if (solvedCount < 60) {
        return ['Medium', 'Hard'];
      } else if (solvedCount < 100) {
        return ['Medium', 'Hard', 'Very Hard'];
      } else {
        return ['Hard', 'Very Hard'];
      }
    }
    
    // Use manual difficulty preferences if available
    if (difficultyPreferences.length > 0) {
      console.log('✅ Using manual difficulty preferences:', difficultyPreferences);
      return difficultyPreferences;
    }
    
    // Fallback to default progressive logic
    const solvedCount = this.userProgress.solvedProblems.size;
    console.log('⚠️ Using fallback difficulty logic for', solvedCount, 'solved problems');
    if (solvedCount < 10) {
      return ['Easy'];
    } else if (solvedCount < 30) {
      return ['Easy', 'Medium'];
    } else {
      return ['Medium', 'Hard'];
    }
  }

  private generateRecommendationReason(problem: Problem): string {
    const level = this.userProgress.currentLevel;
    const step = this.getCurrentLearningStep();
    
    if (step.topics.includes(problem.category)) {
      return `Essential for ${step.title} - ${problem.category} mastery`;
    }
    
    return `Perfect for ${level.name} level - builds ${problem.category} skills`;
  }

  // Mark problem as solved and update progress
  markProblemSolved(problemId: string): void {
    this.userProgress.solvedProblems.add(problemId);
    
    // Remove from pending problems
    this.userProgress.pendingProblems = this.userProgress.pendingProblems.filter(
      p => p.problemId !== problemId
    );
    
    // Update current level and learning path
    this.updateLearningProgress(problemId);
    
    // Update today's recommendation status
    this.updateTodayRecommendationStatus();
  }

  private updateLearningProgress(problemId: string): void {
    const problem = this.allProblems.find(p => p.id === problemId);
    if (!problem) return;

    // Update current level
    this.userProgress.currentLevel.problemsSolved++;
    
    // Check if level up is needed
    if (this.userProgress.currentLevel.problemsSolved >= this.userProgress.currentLevel.requiredForNext) {
      this.levelUp();
    }
    
    // Update topic mastery
    this.updateTopicMastery(problem.category);
    
    // Update learning step progress
    this.updateLearningStepProgress(problem);
  }

  private levelUp(): void {
    const currentLevel = this.userProgress.currentLevel;
    
    switch (currentLevel.name) {
      case 'Absolute Beginner':
        this.userProgress.currentLevel = this.createBeginnerLevel();
        break;
      case 'Beginner':
        this.userProgress.currentLevel = this.createIntermediateLevel();
        break;
      case 'Intermediate':
        this.userProgress.currentLevel = this.createAdvancedLevel();
        break;
      case 'Advanced':
        this.userProgress.currentLevel = this.createExpertLevel();
        break;
    }
  }

  private createBeginnerLevel(): LearningLevel {
    return {
      name: 'Beginner',
      stage: 2,
      problemsSolved: this.userProgress.currentLevel.problemsSolved,
      requiredForNext: 50,
      skillAreas: ['Arrays', 'Strings', 'Basic Math'],
      currentFocus: ['Two Pointers', 'Sliding Window']
    };
  }

  private createIntermediateLevel(): LearningLevel {
    return {
      name: 'Intermediate',
      stage: 3,
      problemsSolved: this.userProgress.currentLevel.problemsSolved,
      requiredForNext: 120,
      skillAreas: ['Linked Lists', 'Stacks', 'Queues', 'Trees'],
      currentFocus: ['Tree Traversal', 'Stack Applications']
    };
  }

  private createAdvancedLevel(): LearningLevel {
    return {
      name: 'Advanced',
      stage: 4,
      problemsSolved: this.userProgress.currentLevel.problemsSolved,
      requiredForNext: 250,
      skillAreas: ['Graphs', 'Dynamic Programming', 'Advanced Trees'],
      currentFocus: ['Graph Algorithms', 'DP Patterns']
    };
  }

  private createExpertLevel(): LearningLevel {
    return {
      name: 'Expert',
      stage: 5,
      problemsSolved: this.userProgress.currentLevel.problemsSolved,
      requiredForNext: 500,
      skillAreas: ['Advanced Algorithms', 'System Design', 'Optimization'],
      currentFocus: ['Complex Algorithms', 'Performance Optimization']
    };
  }

  private updateTopicMastery(topic: string): void {
    if (!this.userProgress.topicMastery[topic]) {
      this.userProgress.topicMastery[topic] = {
        level: 0,
        problemsSolved: 0,
        totalProblems: this.allProblems.filter(p => p.category === topic).length,
        averageTime: 0,
        successRate: 0,
        lastPracticed: new Date().toISOString(),
        weakAreas: [],
        strongPatterns: []
      };
    }

    const mastery = this.userProgress.topicMastery[topic];
    mastery.problemsSolved++;
    mastery.level = Math.min(100, (mastery.problemsSolved / mastery.totalProblems) * 100);
    mastery.lastPracticed = new Date().toISOString();
  }

  private updateLearningStepProgress(problem: Problem): void {
    const currentStep = this.getCurrentLearningStep();
    
    if (currentStep.topics.includes(problem.category)) {
      currentStep.completedProblems++;
      
      if (currentStep.completedProblems >= currentStep.targetProblems) {
        currentStep.isCompleted = true;
        this.unlockNextStep();
      }
    }
  }

  private unlockNextStep(): void {
    const learningPath = this.userProgress.learningPath;
    
    if (learningPath.currentStep < learningPath.totalSteps) {
      learningPath.currentStep++;
      const nextStep = learningPath.steps[learningPath.currentStep - 1];
      if (nextStep) {
        nextStep.isUnlocked = true;
      }
    }
  }

  private updateTodayRecommendationStatus(): void {
    const today = new Date().toISOString().split('T')[0];
    const todayRec = this.userProgress.dailyRecommendations.find(rec => rec.date === today);
    
    if (todayRec) {
      const solvedCount = todayRec.problems.filter(p => 
        this.userProgress.solvedProblems.has(p.id)
      ).length;
      
      todayRec.completed = solvedCount;
      
      if (solvedCount >= todayRec.totalTarget) {
        todayRec.status = 'completed';
      } else if (solvedCount > 0) {
        todayRec.status = 'partial';
      }
    }
  }

  // Get motivational message based on progress
  getMotivationalMessage(): string {
    const carryOverCount = this.userProgress.pendingProblems.length;
    const level = this.userProgress.currentLevel;
    
    if (carryOverCount === 0) {
      return `🎉 Great job! You're up to date. Ready for today's ${level.name} challenge?`;
    } else if (carryOverCount === 1) {
      return `💪 You have 1 problem from yesterday. Let's finish it and move forward!`;
    } else {
      return `🔥 ${carryOverCount} problems waiting for you. Consistency is key to mastery!`;
    }
  }

  // Get progress summary
  getProgressSummary(): {
    currentLevel: string;
    nextLevel: string;
    progressToNext: number;
    pendingProblems: number;
    todayTarget: number;
    todayCompleted: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    const todayRec = this.userProgress.dailyRecommendations.find(rec => rec.date === today);
    
    return {
      currentLevel: this.userProgress.currentLevel.name,
      nextLevel: this.getNextLevelName(),
      progressToNext: (this.userProgress.currentLevel.problemsSolved / this.userProgress.currentLevel.requiredForNext) * 100,
      pendingProblems: this.userProgress.pendingProblems.length,
      todayTarget: todayRec?.totalTarget || 0,
      todayCompleted: todayRec?.completed || 0
    };
  }

  private getNextLevelName(): string {
    switch (this.userProgress.currentLevel.name) {
      case 'Absolute Beginner': return 'Beginner';
      case 'Beginner': return 'Intermediate';
      case 'Intermediate': return 'Advanced';
      case 'Advanced': return 'Expert';
      case 'Expert': return 'Master';
      default: return 'Next Level';
    }
  }
}

// Default progressive user progress
export const defaultProgressiveProgress: ProgressiveUserProgress = {
  solvedProblems: new Set(),
  attemptedProblems: new Set(),
  bookmarkedProblems: new Set(),
  pendingProblems: [],
  dailyRecommendations: [],
  currentLevel: {
    name: 'Absolute Beginner',
    stage: 1,
    problemsSolved: 0,
    requiredForNext: 20,
    skillAreas: ['Basic Programming', 'Arrays'],
    currentFocus: ['Array Basics', 'Simple Logic']
  },
  skillProgression: {
    foundationSkills: [
      {
        name: 'Array Fundamentals',
        topics: ['Arrays'],
        requiredProblems: 15,
        completedProblems: 0,
        isUnlocked: true,
        isCompleted: false
      },
      {
        name: 'String Manipulation',
        topics: ['Strings'],
        requiredProblems: 10,
        completedProblems: 0,
        isUnlocked: false,
        isCompleted: false
      }
    ],
    intermediateSkills: [],
    advancedSkills: [],
    currentPhase: 'Foundation'
  },
  learningPath: {
    currentStep: 1,
    totalSteps: 10,
    steps: [
      {
        id: 1,
        title: 'Array Fundamentals',
        description: 'Master basic array operations and traversal',
        topics: ['Arrays'],
        difficulties: ['Easy'],
        targetProblems: 15,
        completedProblems: 0,
        isUnlocked: true,
        isCompleted: false,
        estimatedDays: 10
      },
      {
        id: 2,
        title: 'String Processing',
        description: 'Learn string manipulation and pattern matching',
        topics: ['Strings'],
        difficulties: ['Easy'],
        targetProblems: 10,
        completedProblems: 0,
        isUnlocked: false,
        isCompleted: false,
        estimatedDays: 8
      }
    ],
    estimatedDaysToComplete: 90
  },
  lastActiveDate: '',
  currentStreak: 0,
  totalActiveDays: 0,
  averageSolveTime: {},
  difficultyProgression: {
    easy: { solved: 0, total: 0, successRate: 0 },
    medium: { solved: 0, total: 0, successRate: 0 },
    hard: { solved: 0, total: 0, successRate: 0 },
    veryHard: { solved: 0, total: 0, successRate: 0 }
  },
  topicMastery: {}
};

// Helper functions
export function getProgressiveDailyRecommendations(
  userProgress: ProgressiveUserProgress = defaultProgressiveProgress,
  userPreferences?: {
    learning_pace: 'slow' | 'medium' | 'fast';
    daily_time_limit: number;
    difficulty_preferences: string[];
    adaptive_difficulty: boolean;
  }
): DailyRecommendation {
  const recommender = new ProgressiveAIRecommender(userProgress, userPreferences);
  return recommender.getDailyRecommendations();
}

export function markProgressiveProblemSolved(
  problemId: string,
  userProgress: ProgressiveUserProgress = defaultProgressiveProgress
): ProgressiveUserProgress {
  const recommender = new ProgressiveAIRecommender(userProgress);
  recommender.markProblemSolved(problemId);
  
  // Get the updated progress from the recommender
  const updatedProgress = recommender.getUserProgress();
  
  // Automatically save to localStorage
  saveProgressiveProgress(updatedProgress);
  
  return updatedProgress;
}

export function getProgressiveMotivationalMessage(
  userProgress: ProgressiveUserProgress = defaultProgressiveProgress
): string {
  const recommender = new ProgressiveAIRecommender(userProgress);
  return recommender.getMotivationalMessage();
}

export function getProgressiveSummary(
  userProgress: ProgressiveUserProgress = defaultProgressiveProgress
): ReturnType<ProgressiveAIRecommender['getProgressSummary']> {
  const recommender = new ProgressiveAIRecommender(userProgress);
  return recommender.getProgressSummary();
}

// Utility functions for localStorage persistence
export function serializeProgressiveSets(progress: ProgressiveUserProgress): any {
  return {
    ...progress,
    solvedProblems: Array.from(progress.solvedProblems),
    attemptedProblems: Array.from(progress.attemptedProblems),
    bookmarkedProblems: Array.from(progress.bookmarkedProblems)
  };
}

export function deserializeProgressiveSets(data: any): ProgressiveUserProgress {
  return {
    ...data,
    solvedProblems: new Set(data.solvedProblems || []),
    attemptedProblems: new Set(data.attemptedProblems || []),
    bookmarkedProblems: new Set(data.bookmarkedProblems || [])
  };
}

export function saveProgressiveProgress(progress: ProgressiveUserProgress): void {
  try {
    const serializedProgress = serializeProgressiveSets(progress);
    localStorage.setItem('progressiveUserProgress', JSON.stringify(serializedProgress));
  } catch (error) {
    console.warn('Failed to save progressive progress:', error);
  }
}

export function loadProgressiveProgress(): ProgressiveUserProgress {
  try {
    const saved = localStorage.getItem('progressiveUserProgress');
    if (saved) {
      const parsed = JSON.parse(saved);
      return deserializeProgressiveSets(parsed);
    }
  } catch (error) {
    console.warn('Failed to load progressive progress:', error);
  }
  return { ...defaultProgressiveProgress };
}
