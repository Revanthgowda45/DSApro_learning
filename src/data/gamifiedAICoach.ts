import { dsaProblems, getTopics } from './dsaDatabase';
import type { Problem } from './dsaDatabase';

// Gamified User Progress with Daily Tracking
export interface GamifiedUserProgress {
  // Basic Progress
  solvedProblems: Set<string>;
  attemptedProblems: Set<string>;
  bookmarkedProblems: Set<string>;
  
  // Daily Challenge System
  dailyChallenges: DailyChallenge[];
  currentDayChallenge?: DailyChallenge;
  lastActiveDate: string;
  
  // Streak & Consistency
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  
  // Gamification Elements
  level: number;
  experience: number;
  experienceToNextLevel: number;
  badges: Badge[];
  achievements: Achievement[];
  
  // Learning Analytics
  skillLevels: Record<string, SkillLevel>;
  learningPath: LearningPath;
  weakAreas: string[];
  strongAreas: string[];
  
  // Motivation & Engagement
  motivationScore: number;
  consistencyScore: number;
  challengeCompletionRate: number;
  
  // Adaptive Difficulty
  currentDifficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  adaptiveSettings: AdaptiveSettings;
}

export interface DailyChallenge {
  id: string;
  date: string;
  problems: Problem[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  targetCount: number;
  completedCount: number;
  difficultyLevel: string;
  theme?: string; // e.g., "Arrays Day", "Graph Algorithms"
  bonusXP: number;
  timeLimit?: number; // minutes
  hints: string[];
  motivationalMessage: string;
}

export interface SkillLevel {
  topic: string;
  level: number; // 0-100
  experience: number;
  problemsSolved: number;
  averageTime: number;
  successRate: number;
  lastPracticed: string;
}

export interface LearningPath {
  currentPhase: 'Foundation' | 'Building' | 'Mastering' | 'Expert';
  completedTopics: string[];
  currentTopic: string;
  nextTopics: string[];
  estimatedCompletionDays: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: string;
  completed: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  unlockedDate: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: number; // XP reward
  completed: boolean;
}

export interface AdaptiveSettings {
  problemsPerDay: number;
  difficultyProgression: number; // 0-1, how fast to increase difficulty
  retryFailedProblems: boolean;
  hintUsageAllowed: boolean;
  timeBasedChallenges: boolean;
}

// Gamified AI Coach Class
export class GamifiedAICoach {
  private userProgress: GamifiedUserProgress;
  private allProblems: Problem[];

  constructor(userProgress: GamifiedUserProgress) {
    this.userProgress = userProgress;
    this.allProblems = dsaProblems;
  }

  // Main method to get daily challenge
  generateDailyChallenge(): DailyChallenge {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user already has today's challenge
    const existingChallenge = this.userProgress.dailyChallenges.find(
      challenge => challenge.date === today
    );

    if (existingChallenge && existingChallenge.status !== 'failed') {
      return existingChallenge;
    }

    // Generate new daily challenge
    const newChallenge = this.createAdaptiveChallenge(today);
    this.userProgress.dailyChallenges.push(newChallenge);
    this.userProgress.currentDayChallenge = newChallenge;
    
    return newChallenge;
  }

  private createAdaptiveChallenge(date: string): DailyChallenge {
    const userLevel = this.getUserLevel();
    const weakestTopic = this.getWeakestTopic();
    const targetCount = this.userProgress.adaptiveSettings.problemsPerDay;
    
    // Select problems based on user's current level and weak areas
    const selectedProblems = this.selectProblemsForChallenge(userLevel, weakestTopic, targetCount);
    
    // Determine theme and motivation
    const theme = this.generateTheme(selectedProblems);
    const motivationalMessage = this.generateMotivationalMessage(userLevel, theme);
    
    return {
      id: `challenge-${date}`,
      date,
      problems: selectedProblems,
      status: 'pending',
      targetCount,
      completedCount: 0,
      difficultyLevel: userLevel,
      theme,
      bonusXP: this.calculateBonusXP(userLevel, targetCount),
      hints: this.generateHints(selectedProblems),
      motivationalMessage
    };
  }

  private selectProblemsForChallenge(userLevel: string, weakTopic: string, count: number): Problem[] {
    // Get unsolved problems
    const unsolvedProblems = this.allProblems.filter(p => 
      !this.userProgress.solvedProblems.has(p.id)
    );

    // Prioritize weak topic problems
    const weakTopicProblems = unsolvedProblems.filter(p => p.category === weakTopic);
    
    // Select appropriate difficulty based on user level
    const appropriateDifficulty = this.getDifficultyForLevel(userLevel);
    
    const selectedProblems: Problem[] = [];
    
    // First, add problems from weak topic
    const weakTopicFiltered = weakTopicProblems.filter(p => 
      appropriateDifficulty.includes(p.difficulty)
    );
    selectedProblems.push(...weakTopicFiltered.slice(0, Math.ceil(count * 0.6)));
    
    // Fill remaining slots with diverse problems
    const remainingCount = count - selectedProblems.length;
    if (remainingCount > 0) {
      const diverseProblems = unsolvedProblems
        .filter(p => 
          !selectedProblems.includes(p) && 
          appropriateDifficulty.includes(p.difficulty)
        )
        .slice(0, remainingCount);
      selectedProblems.push(...diverseProblems);
    }

    return selectedProblems.slice(0, count);
  }

  private getDifficultyForLevel(userLevel: string): string[] {
    switch (userLevel) {
      case 'Beginner':
        return ['Easy'];
      case 'Intermediate':
        return ['Easy', 'Medium'];
      case 'Advanced':
        return ['Medium', 'Hard'];
      case 'Expert':
        return ['Hard', 'Very Hard'];
      default:
        return ['Easy'];
    }
  }

  private getUserLevel(): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' {
    const solvedCount = this.userProgress.solvedProblems.size;
    
    if (solvedCount < 20) return 'Beginner';
    if (solvedCount < 60) return 'Intermediate';
    if (solvedCount < 120) return 'Advanced';
    return 'Expert';
  }

  private getWeakestTopic(): string {
    const topics = getTopics();
    let weakestTopic = topics[0];
    let lowestScore = 100;

    topics.forEach(topic => {
      const skillLevel = this.userProgress.skillLevels[topic];
      if (skillLevel && skillLevel.level < lowestScore) {
        lowestScore = skillLevel.level;
        weakestTopic = topic;
      }
    });

    return weakestTopic;
  }

  private generateTheme(problems: Problem[]): string {
    const categories = [...new Set(problems.map(p => p.category))];
    if (categories.length === 1) {
      return `${categories[0]} Mastery Day`;
    }
    return `Mixed Algorithms Challenge`;
  }

  private generateMotivationalMessage(userLevel: string, theme: string): string {
    const messages = {
      'Beginner': [
        `🌟 Welcome to your ${theme}! Every expert was once a beginner.`,
        `🚀 Start your coding journey today with ${theme}!`,
        `💪 You're building the foundation - ${theme} awaits!`
      ],
      'Intermediate': [
        `🔥 Level up with ${theme}! You're making great progress!`,
        `⚡ Time to tackle ${theme} - you've got this!`,
        `🎯 ${theme} is your next milestone to greatness!`
      ],
      'Advanced': [
        `🏆 Master ${theme} and join the elite coders!`,
        `💎 ${theme} - where advanced skills meet excellence!`,
        `🚀 Push your limits with ${theme}!`
      ],
      'Expert': [
        `👑 ${theme} - prove your expertise once again!`,
        `🌟 ${theme} - maintain your legendary status!`,
        `🔥 ${theme} - inspire others with your mastery!`
      ]
    };

    const levelMessages = messages[userLevel as keyof typeof messages] || messages['Beginner'];
    return levelMessages[Math.floor(Math.random() * levelMessages.length)];
  }

  private calculateBonusXP(userLevel: string, problemCount: number): number {
    const baseXP = {
      'Beginner': 10,
      'Intermediate': 15,
      'Advanced': 20,
      'Expert': 25
    };

    return (baseXP[userLevel as keyof typeof baseXP] || 10) * problemCount;
  }

  private generateHints(_problems: Problem[]): string[] {
    return [
      "Start with the easiest problem to build momentum",
      "Draw out examples before coding",
      "Think about edge cases early",
      "Break complex problems into smaller parts"
    ];
  }

  // Progress tracking methods
  markProblemCompleted(problemId: string): void {
    this.userProgress.solvedProblems.add(problemId);
    
    // Update current challenge
    if (this.userProgress.currentDayChallenge) {
      const challenge = this.userProgress.currentDayChallenge;
      const problemInChallenge = challenge.problems.find(p => p.id === problemId);
      
      if (problemInChallenge) {
        challenge.completedCount++;
        challenge.status = 'in-progress';
        
        if (challenge.completedCount >= challenge.targetCount) {
          challenge.status = 'completed';
          this.handleChallengeCompletion(challenge);
        }
      }
    }

    // Update skill levels and experience
    this.updateSkillLevel(problemId);
    this.addExperience(this.calculateProblemXP(problemId));
    this.checkAchievements();
  }

  private handleChallengeCompletion(challenge: DailyChallenge): void {
    // Update streak
    this.updateStreak();
    
    // Award bonus XP
    this.addExperience(challenge.bonusXP);
    
    // Check for new badges
    this.checkForNewBadges();
    
    // Update motivation score
    this.userProgress.motivationScore = Math.min(100, this.userProgress.motivationScore + 10);
  }

  private updateStreak(): void {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (this.userProgress.lastActiveDate === yesterday) {
      this.userProgress.currentStreak++;
    } else if (this.userProgress.lastActiveDate !== today) {
      this.userProgress.currentStreak = 1;
    }
    
    this.userProgress.longestStreak = Math.max(
      this.userProgress.longestStreak, 
      this.userProgress.currentStreak
    );
    this.userProgress.lastActiveDate = today;
  }

  private updateSkillLevel(problemId: string): void {
    const problem = this.allProblems.find(p => p.id === problemId);
    if (!problem) return;

    const topic = problem.category;
    if (!this.userProgress.skillLevels[topic]) {
      this.userProgress.skillLevels[topic] = {
        topic,
        level: 0,
        experience: 0,
        problemsSolved: 0,
        averageTime: 0,
        successRate: 0,
        lastPracticed: new Date().toISOString()
      };
    }

    const skill = this.userProgress.skillLevels[topic];
    skill.problemsSolved++;
    skill.experience += this.calculateProblemXP(problemId);
    skill.level = Math.min(100, skill.level + 2);
    skill.lastPracticed = new Date().toISOString();
  }

  private calculateProblemXP(problemId: string): number {
    const problem = this.allProblems.find(p => p.id === problemId);
    if (!problem) return 10;

    const difficultyXP = {
      'Easy': 10,
      'Medium': 20,
      'Hard': 35,
      'Very Hard': 50
    };

    return difficultyXP[problem.difficulty] || 10;
  }

  private addExperience(xp: number): void {
    this.userProgress.experience += xp;
    
    // Check for level up
    while (this.userProgress.experience >= this.userProgress.experienceToNextLevel) {
      this.levelUp();
    }
  }

  private levelUp(): void {
    this.userProgress.level++;
    this.userProgress.experience -= this.userProgress.experienceToNextLevel;
    this.userProgress.experienceToNextLevel = this.calculateXPForNextLevel();
    
    // Award level up badge
    this.awardLevelUpBadge();
  }

  private calculateXPForNextLevel(): number {
    return this.userProgress.level * 100 + 200;
  }

  private checkAchievements(): void {
    // Check various achievements
    this.checkStreakAchievements();
    this.checkProblemCountAchievements();
    this.checkTopicMasteryAchievements();
  }

  private checkStreakAchievements(): void {
    const streakMilestones = [7, 14, 30, 60, 100];
    streakMilestones.forEach(milestone => {
      if (this.userProgress.currentStreak >= milestone) {
        const achievementId = `streak-${milestone}`;
        if (!this.userProgress.achievements.find(a => a.id === achievementId)) {
          this.userProgress.achievements.push({
            id: achievementId,
            title: `${milestone} Day Streak`,
            description: `Solved problems for ${milestone} consecutive days`,
            progress: milestone,
            target: milestone,
            reward: milestone * 10,
            completed: true
          });
        }
      }
    });
  }

  private checkProblemCountAchievements(): void {
    const countMilestones = [10, 25, 50, 100, 200];
    const solvedCount = this.userProgress.solvedProblems.size;
    
    countMilestones.forEach(milestone => {
      if (solvedCount >= milestone) {
        const achievementId = `problems-${milestone}`;
        if (!this.userProgress.achievements.find(a => a.id === achievementId)) {
          this.userProgress.achievements.push({
            id: achievementId,
            title: `${milestone} Problems Solved`,
            description: `Successfully solved ${milestone} problems`,
            progress: milestone,
            target: milestone,
            reward: milestone * 5,
            completed: true
          });
        }
      }
    });
  }

  private checkTopicMasteryAchievements(): void {
    const topics = getTopics();
    topics.forEach(topic => {
      const skill = this.userProgress.skillLevels[topic];
      if (skill && skill.level >= 80) {
        const achievementId = `master-${topic.toLowerCase().replace(/\s+/g, '-')}`;
        if (!this.userProgress.achievements.find(a => a.id === achievementId)) {
          this.userProgress.achievements.push({
            id: achievementId,
            title: `${topic} Master`,
            description: `Achieved mastery in ${topic}`,
            progress: skill.level,
            target: 80,
            reward: 100,
            completed: true
          });
        }
      }
    });
  }

  private checkForNewBadges(): void {
    // Award consistency badges
    if (this.userProgress.currentStreak >= 7) {
      this.awardBadge('weekly-warrior', 'Weekly Warrior', '7-day streak achieved!', '🔥', 'Common');
    }
    if (this.userProgress.currentStreak >= 30) {
      this.awardBadge('monthly-master', 'Monthly Master', '30-day streak achieved!', '👑', 'Rare');
    }
  }

  private awardLevelUpBadge(): void {
    this.awardBadge(
      `level-${this.userProgress.level}`,
      `Level ${this.userProgress.level}`,
      `Reached level ${this.userProgress.level}!`,
      '⭐',
      'Common'
    );
  }

  private awardBadge(id: string, name: string, description: string, icon: string, rarity: Badge['rarity']): void {
    if (!this.userProgress.badges.find(b => b.id === id)) {
      this.userProgress.badges.push({
        id,
        name,
        description,
        icon,
        rarity,
        unlockedDate: new Date().toISOString()
      });
    }
  }

  // Get motivational status
  getMotivationalStatus(): {
    message: string;
    encouragement: string;
    nextGoal: string;
    progressPercentage: number;
  } {
    const streak = this.userProgress.currentStreak;
    const challenge = this.userProgress.currentDayChallenge;
    
    let message = "Ready to code today? 💪";
    let encouragement = "Every problem solved makes you stronger!";
    let nextGoal = "Complete today's challenge";
    let progressPercentage = 0;

    if (challenge) {
      progressPercentage = (challenge.completedCount / challenge.targetCount) * 100;
      
      if (challenge.status === 'completed') {
        message = "🎉 Challenge completed! You're on fire!";
        encouragement = "Your consistency is paying off!";
        nextGoal = "Keep the streak alive tomorrow";
      } else if (challenge.completedCount > 0) {
        message = `Great progress! ${challenge.completedCount}/${challenge.targetCount} done`;
        encouragement = "You're almost there - finish strong!";
        nextGoal = `Solve ${challenge.targetCount - challenge.completedCount} more problems`;
      }
    }

    if (streak >= 7) {
      encouragement = `🔥 ${streak} day streak! You're unstoppable!`;
    }

    return {
      message,
      encouragement,
      nextGoal,
      progressPercentage
    };
  }
}

// Default gamified user progress
export const defaultGamifiedProgress: GamifiedUserProgress = {
  solvedProblems: new Set(),
  attemptedProblems: new Set(),
  bookmarkedProblems: new Set(),
  dailyChallenges: [],
  lastActiveDate: '',
  currentStreak: 0,
  longestStreak: 0,
  totalActiveDays: 0,
  level: 1,
  experience: 0,
  experienceToNextLevel: 300,
  badges: [],
  achievements: [],
  skillLevels: {},
  learningPath: {
    currentPhase: 'Foundation',
    completedTopics: [],
    currentTopic: 'Arrays',
    nextTopics: ['Strings', 'Linked Lists', 'Stacks and Queues'],
    estimatedCompletionDays: 90,
    milestones: []
  },
  weakAreas: ['Arrays', 'Strings'],
  strongAreas: [],
  motivationScore: 70,
  consistencyScore: 0,
  challengeCompletionRate: 0,
  currentDifficultyLevel: 'Beginner',
  adaptiveSettings: {
    problemsPerDay: 2,
    difficultyProgression: 0.5,
    retryFailedProblems: true,
    hintUsageAllowed: true,
    timeBasedChallenges: false
  }
};

// Utility functions for Set serialization/deserialization
export function serializeGamifiedProgress(progress: GamifiedUserProgress): string {
  const serializable = {
    ...progress,
    solvedProblems: Array.from(progress.solvedProblems),
    attemptedProblems: Array.from(progress.attemptedProblems),
    bookmarkedProblems: Array.from(progress.bookmarkedProblems)
  };
  return JSON.stringify(serializable);
}

export function deserializeGamifiedProgress(data: string): GamifiedUserProgress {
  try {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      solvedProblems: new Set(parsed.solvedProblems || []),
      attemptedProblems: new Set(parsed.attemptedProblems || []),
      bookmarkedProblems: new Set(parsed.bookmarkedProblems || [])
    };
  } catch (error) {
    console.error('Error deserializing gamified progress:', error);
    return defaultGamifiedProgress;
  }
}

// LocalStorage integration
export function saveGamifiedProgress(progress: GamifiedUserProgress): void {
  try {
    const serialized = serializeGamifiedProgress(progress);
    localStorage.setItem('gamifiedUserProgress', serialized);
  } catch (error) {
    console.error('Error saving gamified progress:', error);
  }
}

export function loadGamifiedProgress(): GamifiedUserProgress {
  try {
    const saved = localStorage.getItem('gamifiedUserProgress');
    if (saved) {
      return deserializeGamifiedProgress(saved);
    }
  } catch (error) {
    console.error('Error loading gamified progress:', error);
  }
  return defaultGamifiedProgress;
}

// Helper function to get daily challenge with persistence
export function getDailyChallenge(
  userProgress?: GamifiedUserProgress
): DailyChallenge {
  const progress = userProgress || loadGamifiedProgress();
  const coach = new GamifiedAICoach(progress);
  const challenge = coach.generateDailyChallenge();
  
  // Save updated progress
  saveGamifiedProgress(progress);
  
  return challenge;
}

// Helper function to mark problem as completed with persistence
export function markProblemCompleted(
  problemId: string,
  userProgress?: GamifiedUserProgress
): GamifiedUserProgress {
  const progress = userProgress || loadGamifiedProgress();
  const coach = new GamifiedAICoach(progress);
  coach.markProblemCompleted(problemId);
  
  // Save updated progress
  saveGamifiedProgress(progress);
  
  return progress;
}

// Helper function to get motivational status
export function getMotivationalStatus(
  userProgress?: GamifiedUserProgress
): ReturnType<GamifiedAICoach['getMotivationalStatus']> {
  const progress = userProgress || loadGamifiedProgress();
  const coach = new GamifiedAICoach(progress);
  return coach.getMotivationalStatus();
}
