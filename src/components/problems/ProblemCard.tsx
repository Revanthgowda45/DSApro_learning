import { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Clock, 
  Star, 
  Bookmark, 
  BookmarkCheck,
  Target,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle2,
  PlayCircle,
  RotateCcw,
  Trophy,
  Lightbulb,
  Timer,
  BarChart3
} from 'lucide-react';
import { Problem } from '../../data/dsaDatabase';
import { updateAllAnalytics } from '../../utils/analyticsUpdater';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';

interface ProblemCardProps {
  problem: Problem;
  onStatusChange?: (problemId: string, status: string) => void;
  onBookmarkToggle?: (problemId: string) => void;
  showAIInsights?: boolean;
}

export default function ProblemCard({ 
  problem, 
  onStatusChange, 
  onBookmarkToggle,
  showAIInsights = false 
}: ProblemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'Hard': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'Very Hard': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      case 'attempted': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'solved': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'mastered': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not-started': return <PlayCircle className="h-3 w-3" />;
      case 'attempted': return <RotateCcw className="h-3 w-3" />;
      case 'solved': return <CheckCircle2 className="h-3 w-3" />;
      case 'mastered': return <Trophy className="h-3 w-3" />;
      default: return <PlayCircle className="h-3 w-3" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not-started': return 'Not Started';
      case 'attempted': return 'Attempted';
      case 'solved': return 'Solved';
      case 'mastered': return 'Mastered';
      default: return status;
    }
  };

  const getPlatformInfo = (url: string) => {
    if (url?.includes('leetcode.com')) {
      return { name: 'LeetCode', color: 'bg-orange-500 hover:bg-orange-600', icon: '🔥' };
    } else if (url?.includes('geeksforgeeks.org')) {
      return { name: 'GeeksforGeeks', color: 'bg-green-500 hover:bg-green-600', icon: '🚀' };
    } else if (url?.includes('hackerrank.com')) {
      return { name: 'HackerRank', color: 'bg-green-600 hover:bg-green-700', icon: '💻' };
    } else if (url?.includes('codechef.com')) {
      return { name: 'CodeChef', color: 'bg-amber-600 hover:bg-amber-700', icon: '👨‍🍳' };
    } else if (url?.includes('codeforces.com')) {
      return { name: 'Codeforces', color: 'bg-blue-600 hover:bg-blue-700', icon: '⚡' };
    }
    return { name: 'Practice', color: 'bg-gray-500 hover:bg-gray-600', icon: '📚' };
  };

  const handleStatusChange = (newStatus: string) => {
    // Update all analytics systems
    updateAllAnalytics({
      problemId: problem.id,
      newStatus: newStatus as 'not-started' | 'attempted' | 'solved' | 'mastered',
      difficulty: problem.difficulty,
      category: problem.category
    });
    
    // Call the original callback if provided
    onStatusChange?.(problem.id, newStatus);
  };

  const handleBookmarkToggle = () => {
    onBookmarkToggle?.(problem.id);
  };

  // Generate unique AI insights for each problem
  const generateAIInsights = (problem: Problem) => {
    const problemId = parseInt(problem.id);
    const companyCount = problem.companies.length;
    const titleLength = problem.title.length;
    
    // Generate pseudo-random but consistent values based on problem characteristics
    const seed = problemId * 7 + titleLength * 3 + companyCount * 11;
    
    // Success rate based on difficulty and problem characteristics
    let baseSuccessRate = 85;
    switch (problem.difficulty) {
      case 'Easy': baseSuccessRate = 88; break;
      case 'Medium': baseSuccessRate = 72; break;
      case 'Hard': baseSuccessRate = 58; break;
      case 'Very Hard': baseSuccessRate = 42; break;
    }
    
    // Add variation based on problem ID
    const successRateVariation = ((seed % 20) - 10); // -10 to +10
    const successRate = Math.max(25, Math.min(95, baseSuccessRate + successRateVariation));
    
    // Trending based on problem popularity (company count and ID)
    const trendingBase = companyCount > 5 ? 15 : companyCount > 2 ? 8 : 3;
    const trendingVariation = ((seed * 3) % 20) - 10; // -10 to +10
    const trending = Math.max(-15, Math.min(25, trendingBase + trendingVariation));
    
    // Difficulty score based on actual difficulty and problem complexity
    let baseDifficultyScore = 5.0;
    switch (problem.difficulty) {
      case 'Easy': baseDifficultyScore = 3.2; break;
      case 'Medium': baseDifficultyScore = 5.8; break;
      case 'Hard': baseDifficultyScore = 7.4; break;
      case 'Very Hard': baseDifficultyScore = 8.7; break;
    }
    
    // Add complexity based on title length and company count
    const complexityBonus = (titleLength > 40 ? 0.5 : 0) + (companyCount > 8 ? 0.3 : 0);
    const difficultyVariation = ((seed * 7) % 20) / 100; // -0.1 to +0.1
    const difficultyScore = Math.max(1.0, Math.min(9.5, baseDifficultyScore + complexityBonus + difficultyVariation));
    
    return {
      successRate: Math.round(successRate),
      trending: trending > 0 ? `+${trending}` : trending.toString(),
      difficultyScore: difficultyScore.toFixed(1)
    };
  };

  const aiInsights = generateAIInsights(problem);

  // Load saved notes and user data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(`problem_${problem.id}`);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setNotes(data.notes || '');
        setUserRating(data.rating || 0);
      } catch (error) {
        console.error('Error loading saved problem data:', error);
      }
    }
  }, [problem.id]);

  // Save notes to localStorage
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    
    try {
      const existingData = localStorage.getItem(`problem_${problem.id}`);
      let data = {};
      
      if (existingData) {
        data = JSON.parse(existingData);
      }
      
      data = {
        ...data,
        notes: notes,
        rating: userRating,
        lastUpdated: new Date().toISOString(),
        problemTitle: problem.title,
        difficulty: problem.difficulty,
        category: problem.category
      };
      
      localStorage.setItem(`problem_${problem.id}`, JSON.stringify(data));
      
      // Show success feedback
      setTimeout(() => {
        setIsSavingNotes(false);
      }, 500);
      
    } catch (error) {
      console.error('Error saving notes:', error);
      setIsSavingNotes(false);
    }
  };

  const platformInfo = getPlatformInfo(problem.link || problem.leetcodeLink || '');

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-lg dark:hover:shadow-xl ${
      problem.status === 'mastered' ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10' : 
      problem.status === 'solved' ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' : 
      'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Mobile-First Header */}
      <div className="p-4 sm:p-6">
        {/* Mobile-Optimized Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="flex-1">
            {/* Title Row - Mobile Stacked */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer flex-1 pr-2 leading-tight">
                {problem.title}
              </h3>
              <div className="flex items-center space-x-1 flex-shrink-0">
                {problem.isBookmarked && (
                  <BookmarkCheck className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                )}
                {problem.status === 'mastered' && (
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                )}
              </div>
            </div>
            
            {/* Mobile-Optimized Badges Row */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-3">
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              <span className="px-2 sm:px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800">
                {problem.category}
              </span>
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                <span className="hidden xs:inline">{problem.timeEstimate} min</span>
                <span className="xs:hidden">{problem.timeEstimate}m</span>
              </div>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(problem.status)}`}>
                {getStatusIcon(problem.status)}
                <span className="hidden sm:inline">{getStatusText(problem.status)}</span>
              </span>
            </div>

            {/* Mobile-Optimized AI Insights */}
            {showAIInsights && (
              <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-100">AI Insights</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <Target className={`h-3 w-3 ${
                      aiInsights.successRate >= 80 ? 'text-green-600 dark:text-green-400' :
                      aiInsights.successRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`} />
                    <span className="text-gray-600 dark:text-gray-400">Success Rate: {aiInsights.successRate}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className={`h-3 w-3 ${
                      aiInsights.trending.startsWith('+') ? 'text-green-600 dark:text-green-400' :
                      aiInsights.trending.startsWith('-') ? 'text-red-600 dark:text-red-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} />
                    <span className="text-gray-600 dark:text-gray-400">Trending: {aiInsights.trending}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className={`h-3 w-3 ${
                      parseFloat(aiInsights.difficultyScore) >= 7.0 ? 'text-red-600 dark:text-red-400' :
                      parseFloat(aiInsights.difficultyScore) >= 5.0 ? 'text-orange-600 dark:text-orange-400' :
                      parseFloat(aiInsights.difficultyScore) >= 3.0 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`} />
                    <span className="text-gray-600 dark:text-gray-400">Difficulty Score: {aiInsights.difficultyScore}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile-Optimized Companies */}
            <div className="mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Asked by:</span>
                <button 
                  className="sm:hidden text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Show Less' : 'Show All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {problem.companies.slice(0, isExpanded ? undefined : (window.innerWidth < 640 ? 2 : 4)).map((company, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium transition-colors cursor-pointer"
                    title={`${company} has asked this question`}
                  >
                    {company}
                  </span>
                ))}
                {!isExpanded && problem.companies.length > (window.innerWidth < 640 ? 2 : 4) && (
                  <span 
                    className="hidden sm:inline px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    +{problem.companies.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* Expanded Companies */}
            {isExpanded && problem.companies.length > 4 && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex flex-wrap gap-1">
                  {problem.companies.slice(4).map((company, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-600"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks */}
            {problem.remarks && (
              <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-r-lg">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">Hint:</span>
                  <span className="text-sm text-yellow-700 dark:text-yellow-400">{problem.remarks}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile-Optimized Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-4 mt-3 sm:mt-0">
            <button 
              onClick={handleBookmarkToggle}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                problem.isBookmarked 
                  ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20 hover:bg-yellow-200 dark:hover:bg-yellow-900/30' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
              }`}
              title={problem.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {problem.isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
            
            {(problem.link || problem.leetcodeLink) && (
              <a
                href={problem.link || problem.leetcodeLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${platformInfo.color} min-h-[40px]`}
              >
                <span>{platformInfo.icon}</span>
                <span className="hidden xs:inline">{platformInfo.name}</span>
                <span className="xs:hidden">Solve</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Mobile-Optimized Progress Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3 sm:space-y-0">
          <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-4">
            {/* Difficulty Rating */}
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">Rate:</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 cursor-pointer transition-colors ${
                      star <= userRating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                    onClick={() => setUserRating(star)}
                  />
                ))}
              </div>
            </div>

            {/* Time Tracking */}
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Time: 0 min</span>
            </div>
          </div>
          
          {/* Mobile-Optimized Status Actions */}
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            <button 
              onClick={() => setShowNotes(!showNotes)}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              {showNotes ? 'Hide' : 'Notes'}
            </button>
            
            {/* Status Dropdown */}
            <select
              value={problem.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="not-started">Not Started</option>
              <option value="attempted">Attempted</option>
              <option value="solved">Solved</option>
              <option value="mastered">Mastered</option>
            </select>
          </div>
        </div>

        {/* Notes Section */}
        {showNotes && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Add your notes, approach, or key insights..."
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {notes.length > 0 && (
                  <span>Characters: {notes.length}/500</span>
                )}
              </div>
              <button 
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  isSavingNotes 
                    ? 'bg-green-600 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSavingNotes ? (
                  <span className="flex items-center space-x-1">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saved!</span>
                  </span>
                ) : (
                  'Save Notes'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Last Solved Date */}
        {problem.status !== 'not-started' && (
          <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
