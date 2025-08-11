import React from 'react';
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Award, 
  Zap,
  Brain,
  Star,
  Calendar,
  BarChart3
} from 'lucide-react';

interface GameStatsProps {
  stats: {
    totalGames: number;
    completedGames: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    favoriteCategory: string;
    totalTimeSpent: number;
  };
  className?: string;
}

const GameStats: React.FC<GameStatsProps> = ({ stats, className = '' }) => {
  const completionRate = stats.totalGames > 0 ? (stats.completedGames / stats.totalGames) * 100 : 0;
  const hoursPlayed = Math.floor(stats.totalTimeSpent / 3600);
  const minutesPlayed = Math.floor((stats.totalTimeSpent % 3600) / 60);

  const getCompletionRateColor = () => {
    if (completionRate >= 80) return 'text-green-600 dark:text-green-400';
    if (completionRate >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreGrade = () => {
    if (stats.averageScore >= 400) return { grade: 'A+', color: 'text-green-600 dark:text-green-400' };
    if (stats.averageScore >= 350) return { grade: 'A', color: 'text-green-600 dark:text-green-400' };
    if (stats.averageScore >= 300) return { grade: 'B+', color: 'text-blue-600 dark:text-blue-400' };
    if (stats.averageScore >= 250) return { grade: 'B', color: 'text-blue-600 dark:text-blue-400' };
    if (stats.averageScore >= 200) return { grade: 'C+', color: 'text-yellow-600 dark:text-yellow-400' };
    if (stats.averageScore >= 150) return { grade: 'C', color: 'text-yellow-600 dark:text-yellow-400' };
    return { grade: 'D', color: 'text-red-600 dark:text-red-400' };
  };

  const scoreGrade = getScoreGrade();

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {/* Best Score */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-between mb-4">
          <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          <div className="text-right">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">BEST SCORE</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {stats.bestScore.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center text-yellow-600 dark:text-yellow-400">
          <Star className="h-4 w-4 mr-1" />
          <span className="text-sm">Personal Record</span>
        </div>
      </div>

      {/* Games Completed */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between mb-4">
          <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
          <div className="text-right">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">COMPLETED</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.completedGames}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-600 dark:text-green-400">
            {completionRate.toFixed(1)}% success rate
          </span>
          <span className={`font-medium ${getCompletionRateColor()}`}>
            {stats.totalGames} total
          </span>
        </div>
      </div>

      {/* Average Score */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div className="text-right">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">AVERAGE SCORE</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.averageScore}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-blue-600 dark:text-blue-400 text-sm">Performance Grade</span>
          <span className={`font-bold text-lg ${scoreGrade.color}`}>
            {scoreGrade.grade}
          </span>
        </div>
      </div>

      {/* Time Played */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-4">
          <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          <div className="text-right">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">TIME PLAYED</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {hoursPlayed > 0 ? `${hoursPlayed}h` : `${minutesPlayed}m`}
            </p>
          </div>
        </div>
        <div className="text-purple-600 dark:text-purple-400 text-sm">
          {hoursPlayed > 0 && minutesPlayed > 0 ? `${hoursPlayed}h ${minutesPlayed}m total` : 
           hoursPlayed > 0 ? `${hoursPlayed} hours total` : `${minutesPlayed} minutes total`}
        </div>
      </div>

      {/* Favorite Category */}
      <div className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-cyan-200 dark:border-cyan-800 md:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <Brain className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
          <div className="text-right">
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">FAVORITE TOPIC</p>
          </div>
        </div>
        <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300 leading-tight">
          {stats.favoriteCategory}
        </p>
        <div className="flex items-center mt-2 text-cyan-600 dark:text-cyan-400">
          <Zap className="h-4 w-4 mr-1" />
          <span className="text-sm">Most practiced</span>
        </div>
      </div>

      {/* Total Score */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center justify-between mb-4">
          <Award className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          <div className="text-right">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">TOTAL SCORE</p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              {stats.totalScore.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-indigo-600 dark:text-indigo-400 text-sm">
          Lifetime points earned
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <BarChart3 className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          <div className="text-right">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">PERFORMANCE INSIGHTS</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Success Rate</p>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                <div 
                  className={`h-2 rounded-full ${
                    completionRate >= 80 ? 'bg-green-500' :
                    completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${getCompletionRateColor()}`}>
                {completionRate.toFixed(0)}%
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Score Efficiency</p>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                <div 
                  className={`h-2 rounded-full ${scoreGrade.color.includes('green') ? 'bg-green-500' :
                    scoreGrade.color.includes('blue') ? 'bg-blue-500' :
                    scoreGrade.color.includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((stats.averageScore / 500) * 100, 100)}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${scoreGrade.color}`}>
                {scoreGrade.grade}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Keep practicing daily for better results!</span>
            </div>
            {stats.bestScore > stats.averageScore * 1.5 && (
              <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                <Star className="h-4 w-4 mr-1" />
                <span>Consistency opportunity</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStats;
