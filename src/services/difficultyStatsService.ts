import dsaData from '../../dsa.json';
import { ProblemProgressService } from './problemProgressService';

export interface DifficultyStats {
  easy: {
    total: number;
    solved: number;
    percentage: number;
  };
  medium: {
    total: number;
    solved: number;
    percentage: number;
  };
  hard: {
    total: number;
    solved: number;
    percentage: number;
  };
}

export class DifficultyStatsService {
  // Get total problems count by difficulty from DSA data
  static getTotalProblemsByDifficulty(): { easy: number; medium: number; hard: number } {
    const stats = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    dsaData.questions.forEach(problem => {
      const difficulty = problem.difficulty.toLowerCase();
      if (difficulty === 'easy') {
        stats.easy++;
      } else if (difficulty === 'medium') {
        stats.medium++;
      } else if (difficulty === 'hard') {
        stats.hard++;
      }
    });

    return stats;
  }

  // Get solved problems count by difficulty for a user
  static async getSolvedProblemsByDifficulty(userId: string): Promise<{ easy: number; medium: number; hard: number }> {
    try {
      const userProgress = await ProblemProgressService.getUserProgress(userId);
      const solvedProblems = userProgress.filter(progress => 
        progress.status === 'solved' || progress.status === 'mastered'
      );

      const stats = {
        easy: 0,
        medium: 0,
        hard: 0
      };

      solvedProblems.forEach(progress => {
        // Find the problem in DSA data to get its difficulty
        const problem = dsaData.questions.find(q => q.id.toString() === progress.problem_id);
        if (problem) {
          const difficulty = problem.difficulty.toLowerCase();
          if (difficulty === 'easy') {
            stats.easy++;
          } else if (difficulty === 'medium') {
            stats.medium++;
          } else if (difficulty === 'hard') {
            stats.hard++;
          }
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting solved problems by difficulty:', error);
      return { easy: 0, medium: 0, hard: 0 };
    }
  }

  // Get comprehensive difficulty statistics for a user
  static async getDifficultyStats(userId: string): Promise<DifficultyStats> {
    const totalStats = this.getTotalProblemsByDifficulty();
    const solvedStats = await this.getSolvedProblemsByDifficulty(userId);

    return {
      easy: {
        total: totalStats.easy,
        solved: solvedStats.easy,
        percentage: totalStats.easy > 0 ? Math.round((solvedStats.easy / totalStats.easy) * 100) : 0
      },
      medium: {
        total: totalStats.medium,
        solved: solvedStats.medium,
        percentage: totalStats.medium > 0 ? Math.round((solvedStats.medium / totalStats.medium) * 100) : 0
      },
      hard: {
        total: totalStats.hard,
        solved: solvedStats.hard,
        percentage: totalStats.hard > 0 ? Math.round((solvedStats.hard / totalStats.hard) * 100) : 0
      }
    };
  }

  // Get difficulty color for UI
  static getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): {
    bg: string;
    text: string;
    border: string;
    icon: string;
  } {
    switch (difficulty) {
      case 'easy':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-200 dark:border-green-700',
          icon: 'text-green-500 dark:text-green-400'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          text: 'text-yellow-700 dark:text-yellow-300',
          border: 'border-yellow-200 dark:border-yellow-700',
          icon: 'text-yellow-500 dark:text-yellow-400'
        };
      case 'hard':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-200 dark:border-red-700',
          icon: 'text-red-500 dark:text-red-400'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-200 dark:border-gray-700',
          icon: 'text-gray-500 dark:text-gray-400'
        };
    }
  }
}
