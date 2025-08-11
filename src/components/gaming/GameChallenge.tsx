import React, { useState, useEffect } from 'react';
import { GameChallenge as Challenge } from '../../services/aiGamingService';
import { 
  Clock, 
  Star, 
  Lightbulb, 
  CheckCircle, 
  Code, 
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface GameChallengeProps {
  challenge: Challenge;
  onSubmit: (code: string) => void;
  onGetHint: () => void;
  onTimeUp: () => void;
  isActive: boolean;
  hintsUsed: number;
  loading?: boolean;
}

const GameChallengeComponent: React.FC<GameChallengeProps> = ({
  challenge,
  onSubmit,
  onGetHint,
  onTimeUp,
  isActive,
  hintsUsed,
  loading = false
}) => {
  const [userCode, setUserCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setTimeLeft(challenge.timeLimit);
    setUserCode('');
  }, [challenge]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  const getTimeColor = () => {
    const percentage = (timeLeft / challenge.timeLimit) * 100;
    if (percentage > 50) return 'text-green-600 dark:text-green-400';
    if (percentage > 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleSubmit = () => {
    if (userCode.trim()) {
      onSubmit(userCode);
    }
  };

  const handleReset = () => {
    setUserCode('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Challenge Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{challenge.title}</h2>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm`}>
              {challenge.difficulty}
            </span>
            <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <Star className="h-4 w-4 mr-1" />
              <span className="font-medium">{challenge.points} pts</span>
            </div>
          </div>
        </div>
        
        <p className="text-blue-100 leading-relaxed">
          {challenge.description}
        </p>
      </div>

      {/* Timer and Controls */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${getTimeColor()}`}>
              <Clock className="h-5 w-5 mr-2" />
              <span className="font-mono text-xl font-bold">
                {formatTime(timeLeft)}
              </span>
            </div>
            
            {isActive && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Category: <span className="font-medium">{challenge.category}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              timeLeft / challenge.timeLimit > 0.5 ? 'bg-green-500' :
              timeLeft / challenge.timeLimit > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{
              width: `${(timeLeft / challenge.timeLimit) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Code Editor */}
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Code className="h-4 w-4 inline mr-2" />
              Your Solution
            </label>
            <button
              onClick={handleReset}
              disabled={!userCode.trim()}
              className="flex items-center px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </button>
          </div>
          
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            disabled={!isActive || isPaused}
            placeholder="// Write your solution here...
// Example:
function solution() {
    // Your code here
    return result;
}"
            className="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onGetHint}
            disabled={!isActive || isPaused || loading}
            className="flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Get Hint ({hintsUsed} used)
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isActive || isPaused || !userCode.trim() || loading}
            className="flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Submit Solution
          </button>
        </div>

        {/* Code Statistics */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Lines: {userCode.split('\n').length}</span>
          <span>Characters: {userCode.length}</span>
          <span>Words: {userCode.trim() ? userCode.trim().split(/\s+/).length : 0}</span>
        </div>
      </div>
    </div>
  );
};

export default GameChallengeComponent;
