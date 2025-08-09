import { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Clock, 
  Star, 
  Bookmark, 

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
  BarChart3,
  Copy,
  Check
} from 'lucide-react';
import { Problem } from '../../data/dsaDatabase';
import { updateAllAnalytics } from '../../utils/analyticsUpdater';
import { useAuth } from '../../context/AuthContext';
import { ProblemProgressService } from '../../services/problemProgressService';
import Stopwatch from '../ui/Stopwatch';
import { timeTrackingService, ProblemTimeStats } from '../../services/timeTrackingService';

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
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isLoadingRating, setIsLoadingRating] = useState(false);
  const [showStopwatch, setShowStopwatch] = useState(false);
  const [timeStats, setTimeStats] = useState<ProblemTimeStats | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(problem.isBookmarked);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // Load problem data when component mounts (optimized to prevent double fetching)
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!user?.id || !problem.id || !isMounted) return;
      
      try {
        // Load data sequentially to reduce API pressure
        if (isMounted) await loadProblemData();
        if (isMounted) await loadTimeStats();
        if (isMounted) checkTimerStatus();
      } catch (error) {
        if (isMounted) {
          console.error('Error loading problem data:', error);
        }
      }
    };

    // Use requestIdleCallback to load data when browser is idle (prevents blocking)
    const scheduleLoad = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => loadData(), { timeout: 1000 });
      } else {
        setTimeout(loadData, 100); // Fallback for browsers without requestIdleCallback
      }
    };

    scheduleLoad();

    return () => {
      isMounted = false;
    };
  }, [user?.id, problem.id]); // Only re-run if user or problem changes

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
      return { 
        name: 'LeetCode', 
        color: 'bg-orange-500 hover:bg-orange-600', 
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
          </svg>
        ) 
      };
    } else if (url?.includes('geeksforgeeks.org')) {
      return { 
        name: 'GeeksforGeeks', 
        color: 'bg-green-500 hover:bg-green-600', 
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.45 14.315c-.143.28-.334.532-.565.745a3.691 3.691 0 0 1-1.104.565 4.677 4.677 0 0 1-1.425.213 4.677 4.677 0 0 1-1.425-.213 3.691 3.691 0 0 1-1.104-.565 2.795 2.795 0 0 1-.565-.745 2.054 2.054 0 0 1-.213-.96c0-.334.071-.645.213-.96.143-.28.334-.532.565-.745a3.691 3.691 0 0 1 1.104-.565A4.677 4.677 0 0 1 18.36 9.87c.497 0 .958.071 1.425.213.432.143.817.334 1.104.565.231.213.422.465.565.745.142.315.213.626.213.96 0 .334-.071.645-.213.96zm-9.87-4.8c-.143.28-.334.532-.565.745a3.691 3.691 0 0 1-1.104.565 4.677 4.677 0 0 1-1.425.213 4.677 4.677 0 0 1-1.425-.213 3.691 3.691 0 0 1-1.104-.565 2.795 2.795 0 0 1-.565-.745 2.054 2.054 0 0 1-.213-.96c0-.334.071-.645.213-.96.143-.28.334-.532.565-.745a3.691 3.691 0 0 1 1.104-.565A4.677 4.677 0 0 1 8.49 5.07c.497 0 .958.071 1.425.213.432.143.817.334 1.104.565.231.213.422.465.565.745.142.315.213.626.213.96 0 .334-.071.645-.213.96zM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM8.49 10.8c.71 0 1.279-.569 1.279-1.28S9.2 8.24 8.49 8.24s-1.279.569-1.279 1.28.569 1.28 1.279 1.28zm9.87 4.8c.71 0 1.279-.569 1.279-1.28s-.569-1.28-1.279-1.28-1.279.569-1.279 1.28.569 1.28 1.279 1.28z"/>
          </svg>
        ) 
      };
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

  const handleBookmarkToggle = async () => {
    if (!user) return;
    
    setIsBookmarkLoading(true);
    const newBookmarkState = !isBookmarked;
    
    try {
      // Update local state immediately for better UX
      setIsBookmarked(newBookmarkState);
      
      // Save to localStorage for immediate filter availability
      const bookmarkKey = 'dsa_problem_bookmarks';
      const existingBookmarks = localStorage.getItem(bookmarkKey);
      const problemBookmarks: Record<string, boolean> = existingBookmarks ? JSON.parse(existingBookmarks) : {};
      
      if (newBookmarkState) {
        problemBookmarks[problem.id] = true;
      } else {
        delete problemBookmarks[problem.id];
      }
      
      localStorage.setItem(bookmarkKey, JSON.stringify(problemBookmarks));
      
      // Save to Supabase
      await ProblemProgressService.updateProblemStatus(
        user.id,
        problem.id,
        {
          status: problem.status,
          is_bookmarked: newBookmarkState
        }
      );
      
      // Call the optional callback
      onBookmarkToggle?.(problem.id);
      
      console.log('✅ Bookmark updated successfully:', { problemId: problem.id, isBookmarked: newBookmarkState });
    } catch (error) {
      console.error('❌ Failed to update bookmark:', error);
      // Revert local state on error
      setIsBookmarked(!newBookmarkState);
      
      // Revert localStorage on error
      const bookmarkKey = 'dsa_problem_bookmarks';
      const existingBookmarks = localStorage.getItem(bookmarkKey);
      const problemBookmarks: Record<string, boolean> = existingBookmarks ? JSON.parse(existingBookmarks) : {};
      
      if (!newBookmarkState) {
        problemBookmarks[problem.id] = true;
      } else {
        delete problemBookmarks[problem.id];
      }
      
      localStorage.setItem(bookmarkKey, JSON.stringify(problemBookmarks));
    } finally {
      setIsBookmarkLoading(false);
    }
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

  // Load existing rating and notes when component mounts with optimized error handling
  useEffect(() => {
    if (!user?.id) return;
    
    // Debounce to reduce rapid API calls
    const timeoutId = setTimeout(() => {
      loadProblemData();
      loadTimeStats();
      checkTimerStatus();
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [problem.id, user?.id]);

  const loadProblemData = async () => {
    if (!user?.id) return;
    
    try {
      const progress = await ProblemProgressService.getProblemProgress(user.id, problem.id);
      if (progress) {
        setUserRating(progress.rating || 0);
        setNotes(progress.notes || '');
        setIsBookmarked(progress.is_bookmarked || false);
      }
    } catch (error: any) {
      // Handle 406 errors gracefully (table not set up)
      if (error?.code === 'PGRST301' || error?.status === 406) {
        // Silently handle table setup issues
        console.warn('Database table not configured, using defaults');
      } else if (error?.code !== 'PGRST116') { // Not a "not found" error
        console.error('Error loading problem data:', error);
      }
      // Set safe defaults
      setUserRating(0);
      setNotes('');
      setIsBookmarked(problem.isBookmarked || false);
    }
  };

  // Load time statistics with graceful error handling
  const loadTimeStats = async () => {
    if (!user?.id) return;
    
    try {
      const stats = await timeTrackingService.getProblemTimeStats(problem.id, user.id);
      setTimeStats(stats);
    } catch (error: any) {
      // Handle database errors gracefully
      if (error?.status === 406 || error?.code === 'PGRST301') {
        // Table not set up, use defaults
        console.warn('Time tracking table not configured, using defaults');
      }
      // Set safe default stats
      setTimeStats({
        total_time: 0,
        session_count: 0,
        average_session: 0,
        best_session: 0
      });
    }
  };

  // Check if timer is currently running
  const checkTimerStatus = () => {
    const running = timeTrackingService.isTimerRunning(problem.id);
    setIsTimerRunning(running);
  };

  // Handle timer start/stop based on problem interaction
  const handleTimerToggle = async () => {
    if (!user?.id) return;

    try {
      if (isTimerRunning) {
        // Stop timer
        const duration = await timeTrackingService.stopTimer(problem.id, user.id, problem.status);
        setIsTimerRunning(false);
        await loadTimeStats(); // Refresh stats
        console.log(`Timer stopped. Session duration: ${timeTrackingService.formatDuration(duration)}`);
      } else {
        // Start timer
        await timeTrackingService.startTimer(problem.id, user.id, problem.status);
        setIsTimerRunning(true);
        console.log('Timer started for problem:', problem.title);
      }
    } catch (error) {
      console.error('Error toggling timer:', error);
    }
  };

  // Auto-stop timer when problem is marked as solved/mastered
  const handleStatusChangeWithTimer = async (newStatus: string) => {
    if (!user?.id) return;

    // If timer is running and status changes to solved/mastered, stop the timer
    if (isTimerRunning && (newStatus === 'solved' || newStatus === 'mastered')) {
      try {
        const duration = await timeTrackingService.stopTimer(problem.id, user.id, newStatus);
        setIsTimerRunning(false);
        await loadTimeStats(); // Refresh stats
        console.log(`Problem ${newStatus}! Session duration: ${timeTrackingService.formatDuration(duration)}`);
      } catch (error) {
        console.error('Error stopping timer:', error);
      }
    }

    // Call original status change handler
    handleStatusChange(newStatus);
  };

  // Handle rating change and save to Supabase
  const handleRatingChange = async (rating: number) => {
    if (!user?.id) return;
    
    setUserRating(rating);
    setIsLoadingRating(true);
    
    try {
      // First get existing progress to preserve all fields
      const existingProgress = await ProblemProgressService.getProblemProgress(user.id, problem.id);
      
      // Update only the rating while preserving all other existing data
      await ProblemProgressService.updateProblemStatus(user.id, problem.id, {
        ...existingProgress, // Preserve all existing fields
        rating: rating > 0 ? rating : null, // Only save rating if > 0
        status: problem.status || existingProgress?.status || 'not-started',
        is_bookmarked: isBookmarked // Add this line to preserve the bookmark status
      });
    } catch (error) {
      console.error('Error saving rating:', error);
      // Revert rating on error
      setUserRating(userRating);
    } finally {
      setIsLoadingRating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!notes.trim() || !user?.id) return;
    
    setIsSavingNotes(true);
    try {
      await ProblemProgressService.updateProblemStatus(
        user.id, 
        problem.id, 
        {
          status: problem.status,
          notes: notes,
          rating: userRating > 0 ? userRating : null, // Only save rating if > 0
          is_bookmarked: isBookmarked
        }
      );
      
      console.log('✅ Notes saved successfully:', { problemId: problem.id, notes: notes.substring(0, 50) + '...' });
      
      // Show success state briefly
      setTimeout(() => {
        setIsSavingNotes(false);
      }, 1000);
    } catch (error) {
      console.error('❌ Error saving notes:', error);
      setIsSavingNotes(false);
    }
  };

  const handleCopyProblem = async () => {
    try {
      const problemText = `Problem: ${problem.title}
Topic: ${problem.category}
Difficulty: ${problem.difficulty}
Companies: ${problem.companies?.join(', ') || 'N/A'}
Remarks: ${problem.remarks || 'N/A'}
Link: ${problem.link || 'N/A'}`;

      await navigator.clipboard.writeText(problemText);
      setIsCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy problem:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = `Problem: ${problem.title}\nTopic: ${problem.category}\nDifficulty: ${problem.difficulty}\nCompanies: ${problem.companies?.join(', ') || 'N/A'}\nRemarks: ${problem.remarks || 'N/A'}\nLink: ${problem.link || 'N/A'}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
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
                <button
                  onClick={handleBookmarkToggle}
                  disabled={isBookmarkLoading}
                  className={`p-1 rounded-md transition-colors ${
                    isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                >
                  {isBookmarkLoading ? (
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                      isBookmarked ? 'text-yellow-500 fill-current' : 'text-gray-400 hover:text-yellow-500'
                    }`} />
                  )}
                </button>
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
            {/* Difficulty Rating - Only show for solved or mastered problems */}
            {(problem.status === 'solved' || problem.status === 'mastered') && (
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
                      } ${isLoadingRating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => !isLoadingRating && handleRatingChange(star)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Time Tracking - Show for all problems */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {timeStats && timeStats.total_time > 0 ? (
                    <span>Total: {timeTrackingService.formatDuration(timeStats.total_time)}</span>
                  ) : (
                    <span>No time tracked</span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowStopwatch(!showStopwatch)}
                className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                {showStopwatch ? 'Hide Timer' : 'Show Timer'}
              </button>
            </div>
          </div>

          {/* Stopwatch Component - Show for all problems */}
          {showStopwatch && (
            <div className="col-span-full mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              {/* Desktop Horizontal Layout */}
              <div className="hidden sm:flex items-center justify-between space-x-6">
                {/* Timer Section */}
                <div className="flex items-center space-x-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">Problem Timer</h4>
                  <Stopwatch 
                    size="md"
                    autoStart={false}
                    className=""
                  />
                </div>
                
                {/* Stats Section */}
                {timeStats && timeStats.session_count > 0 && (
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <span>Sessions:</span>
                      <span className="font-medium">{timeStats.session_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Avg:</span>
                      <span className="font-medium">{timeTrackingService.formatDuration(timeStats.average_session)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Best:</span>
                      <span className="font-medium">{timeTrackingService.formatDuration(timeStats.best_session)}</span>
                    </div>
                  </div>
                )}
                
                {/* Control Button */}
                <button
                  onClick={handleTimerToggle}
                  className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap border ${
                    isTimerRunning
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border-red-300 dark:border-red-600'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-300 dark:border-green-600'
                  }`}
                >
                  {isTimerRunning ? 'Stop Session' : 'Start Session'}
                </button>
              </div>
              
              {/* Mobile Horizontal Layout */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between space-x-3">
                  {/* Timer Section */}
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">Timer</h4>
                    <Stopwatch 
                      size="md"
                      autoStart={false}
                      className=""
                    />
                  </div>
                  
                  {/* Control Button */}
                  <button
                    onClick={handleTimerToggle}
                    className={`px-3 py-1 text-xs rounded-full transition-colors border whitespace-nowrap ${
                      isTimerRunning
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border-red-300 dark:border-red-600'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-300 dark:border-green-600'
                    }`}
                  >
                    {isTimerRunning ? 'Stop' : 'Start'}
                  </button>
                </div>
                
                {/* Stats Row for Mobile */}
                {timeStats && timeStats.session_count > 0 && (
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <span>Sessions:</span>
                      <span className="font-medium">{timeStats.session_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Avg:</span>
                      <span className="font-medium">{timeTrackingService.formatDuration(timeStats.average_session)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Best:</span>
                      <span className="font-medium">{timeTrackingService.formatDuration(timeStats.best_session)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Status Actions - Right aligned on desktop */}
          <div className="flex items-center justify-end space-x-2 ml-auto">
            <button 
              onClick={handleCopyProblem}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium flex items-center space-x-1"
              title="Copy problem details"
            >
              {isCopied ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
            
            <button 
              onClick={() => setShowNotes(!showNotes)}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              {showNotes ? 'Hide' : 'Notes'}
            </button>
            
            {/* Status Dropdown */}
            <select
              value={problem.status}
              onChange={(e) => handleStatusChangeWithTimer(e.target.value)}
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
