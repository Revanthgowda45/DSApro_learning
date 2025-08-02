import dsaData from '../../dsa.json';

// Type-safe interface matching the actual JSON structure
export interface DSAQuestion {
  id: number;
  topic: string;
  question: string;
  companies: string[];
  remarks: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  link?: string;
}

// Type for the imported JSON data
interface DSAData {
  metadata: {
    title: string;
    platform: string;
    total_questions: number;
    total_topics: number;
    recommended_pace: string;
    difficulty_guidelines: Record<string, string>;
    hard_questions_count: number;
  };
  questions: DSAQuestion[];
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  category: string;
  companies: string[];
  timeEstimate: number;
  leetcodeLink?: string;
  link?: string;
  status: 'not-started' | 'attempted' | 'solved' | 'mastered';
  isBookmarked: boolean;
  remarks?: string;
}

export interface UserStats {
  totalSolved: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  veryHardCount: number;
  currentStreak: number;
  longestStreak: number;
  totalTimeSpent: number;
  averageTimePerProblem: number;
  favoriteTopics: string[];
  weakTopics: string[];
  dailyGoal: number;
  weeklyGoal: number;
}

// Type-safe cast of imported data
const typedDsaData = dsaData as DSAData;

// Validate data structure
if (!typedDsaData.questions || !Array.isArray(typedDsaData.questions)) {
  throw new Error('Invalid DSA data structure: questions array not found');
}

// Transform DSA questions to app-compatible format with error handling
export function transformDSAQuestions(userProgress: Record<string, any> = {}): Problem[] {
  try {
    return typedDsaData.questions.map((question: DSAQuestion) => {
      // Validate required fields
      if (!question.id || !question.question || !question.topic || !question.difficulty) {
        console.warn(`Invalid question data for ID ${question.id}:`, question);
        return null;
      }

      return {
        id: question.id.toString(),
        title: question.question,
        difficulty: question.difficulty,
        category: question.topic,
        companies: Array.isArray(question.companies) ? question.companies : [],
        timeEstimate: getTimeEstimate(question.difficulty),
        leetcodeLink: question.link || undefined,
        link: question.link || undefined,
        status: userProgress[question.id.toString()]?.status || 'not-started',
        isBookmarked: userProgress[question.id.toString()]?.isBookmarked || false,
        remarks: question.remarks || ''
      };
    }).filter(Boolean) as Problem[]; // Remove null entries
  } catch (error) {
    console.error('Error transforming DSA questions:', error);
    return [];
  }
}

// Get time estimate based on difficulty
function getTimeEstimate(difficulty: string): number {
  switch (difficulty) {
    case 'Easy': return 15;
    case 'Medium': return 30;
    case 'Hard': return 45;
    case 'Very Hard': return 60;
    default: return 30;
  }
}

// Cache for performance optimization
let cachedProblems: Problem[] | null = null;
let cachedTopics: string[] | null = null;
let cachedCompanies: string[] | null = null;

// Get cached transformed problems
function getCachedProblems(userProgress?: Record<string, any>): Problem[] {
  if (!cachedProblems || userProgress) {
    cachedProblems = transformDSAQuestions(userProgress);
  }
  return cachedProblems;
}

// Get all unique topics with caching
export function getTopics(): string[] {
  if (!cachedTopics) {
    try {
      const topics = new Set(typedDsaData.questions.map(q => q.topic).filter(Boolean));
      cachedTopics = Array.from(topics).sort();
    } catch (error) {
      console.error('Error getting topics:', error);
      cachedTopics = [];
    }
  }
  return cachedTopics;
}

// Get all unique companies with caching
export function getCompanies(): string[] {
  if (!cachedCompanies) {
    try {
      const companies = new Set(
        typedDsaData.questions
          .flatMap(q => Array.isArray(q.companies) ? q.companies : [])
          .filter(Boolean)
      );
      cachedCompanies = Array.from(companies).sort();
    } catch (error) {
      console.error('Error getting companies:', error);
      cachedCompanies = [];
    }
  }
  return cachedCompanies;
}

// Filter problems by topic (fixed function name and optimized)
export function getProblemsByTopic(topic: string, userProgress?: Record<string, any>): Problem[] {
  const allProblems = getCachedProblems(userProgress);
  return allProblems.filter(problem => problem.category === topic);
}

// Filter problems by difficulty (optimized)
export function getProblemsByDifficulty(difficulty: string, userProgress?: Record<string, any>): Problem[] {
  const allProblems = getCachedProblems(userProgress);
  return allProblems.filter(problem => problem.difficulty === difficulty);
}

// Filter problems by company (optimized)
export function getProblemsByCompany(company: string, userProgress?: Record<string, any>): Problem[] {
  const allProblems = getCachedProblems(userProgress);
  return allProblems.filter(problem => problem.companies.includes(company));
}

// Get database metadata with error handling
export function getMetadata() {
  try {
    return typedDsaData.metadata;
  } catch (error) {
    console.error('Error getting metadata:', error);
    return {
      title: 'DSA Questions',
      platform: 'Unknown',
      total_questions: 0,
      total_topics: 0,
      recommended_pace: '2-3 questions per day',
      difficulty_guidelines: {},
      hard_questions_count: 0
    };
  }
}

// Get database statistics with error handling and caching
let cachedStats: any = null;

export function getDatabaseStats() {
  if (cachedStats) {
    return cachedStats;
  }

  try {
    const topics = getTopics();
    const companies = getCompanies();
    const difficulties = ['Easy', 'Medium', 'Hard', 'Very Hard'];
    
    const difficultyCount = difficulties.reduce((acc, diff) => {
      acc[diff] = typedDsaData.questions.filter(q => q.difficulty === diff).length;
      return acc;
    }, {} as Record<string, number>);

    const topicCount = topics.reduce((acc, topic) => {
      acc[topic] = typedDsaData.questions.filter(q => q.topic === topic).length;
      return acc;
    }, {} as Record<string, number>);

    cachedStats = {
      totalQuestions: typedDsaData.questions.length,
      totalTopics: topics.length,
      totalCompanies: companies.length,
      difficultyBreakdown: difficultyCount,
      topicBreakdown: topicCount,
      questionsWithLinks: typedDsaData.questions.filter(q => q.link).length
    };

    return cachedStats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      totalQuestions: 0,
      totalTopics: 0,
      totalCompanies: 0,
      difficultyBreakdown: {},
      topicBreakdown: {},
      questionsWithLinks: 0
    };
  }
}

// Default user stats for new users
export const defaultUserStats: UserStats = {
  totalSolved: 0,
  easyCount: 0,
  mediumCount: 0,
  hardCount: 0,
  veryHardCount: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalTimeSpent: 0,
  averageTimePerProblem: 0,
  favoriteTopics: [],
  weakTopics: [],
  dailyGoal: 2, // Aligned with user's 2-3 problems per day goal
  weeklyGoal: 15
};

// Clear cache function for testing/development
export function clearCache() {
  cachedProblems = null;
  cachedTopics = null;
  cachedCompanies = null;
  cachedStats = null;
}

// Export the transformed problems (lazy initialization)
export const dsaProblems = getCachedProblems();
export const dsaMetadata = getMetadata();
export const dsaStats = getDatabaseStats();

// Export utility functions for external use
export { getCachedProblems };

// Validate data integrity on module load
if (import.meta.env?.DEV) {
  console.log('DSA Database loaded successfully:');
  console.log(`- Total questions: ${dsaStats.totalQuestions}`);
  console.log(`- Total topics: ${dsaStats.totalTopics}`);
  console.log(`- Total companies: ${dsaStats.totalCompanies}`);
  console.log(`- Questions with links: ${dsaStats.questionsWithLinks}`);
}
