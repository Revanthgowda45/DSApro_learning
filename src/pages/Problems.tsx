import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Filter, RotateCcw, Eye, EyeOff, Bookmark, ChevronDown, ChevronUp, Sparkles, Code } from 'lucide-react';
import { transformDSAQuestions, Problem } from '../data/dsaDatabase';
import ProblemCard from '../components/problems/ProblemCard';
import { useOptimizedAnalytics } from '../hooks/useOptimizedAnalytics';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { AIFilteringService, FilterCriteria } from '../services/aiFilteringService';

// Problem interface is now imported from dsaDatabase

// Virtualization constants
const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

export default function Problems() {
  // Use optimized analytics for better performance
  const { batchUpdate } = useOptimizedAnalytics();
  
  // Performance monitoring
  useEffect(() => {
    const monitor = PerformanceMonitor.monitorComponent('Problems');
    const endRender = monitor.onRenderStart();
    
    return () => {
      endRender();
    };
  }, []);
  
  // Fast initial load with cached data (including bookmarks)
  const loadProblemsInitial = useCallback(() => {
    const timer = PerformanceMonitor.startTimer('problems_initial_load');
    
    try {
      // Load from localStorage first for immediate display
      const statusKey = 'dsa_problem_statuses';
      const existingStatuses = localStorage.getItem(statusKey);
      const problemStatuses: Record<string, string> = existingStatuses ? JSON.parse(existingStatuses) : {};
      
      // Also load cached bookmark data from localStorage
      const bookmarkKey = 'dsa_problem_bookmarks';
      const existingBookmarks = localStorage.getItem(bookmarkKey);
      const problemBookmarks: Record<string, boolean> = existingBookmarks ? JSON.parse(existingBookmarks) : {};
      
      const userProgress: Record<string, any> = {};
      Object.entries(problemStatuses).forEach(([problemId, status]) => {
        userProgress[problemId] = { 
          status,
          isBookmarked: problemBookmarks[problemId] || false
        };
      });
      
      // Also include problems that are only bookmarked but have no status
      Object.entries(problemBookmarks).forEach(([problemId, isBookmarked]) => {
        if (!userProgress[problemId]) {
          userProgress[problemId] = { 
            status: 'not-started',
            isBookmarked
          };
        }
      });
      
      const result = transformDSAQuestions(userProgress);
      timer();
      return result;
    } catch (error) {
      console.error('Error loading initial problems:', error);
      timer();
      return transformDSAQuestions({});
    }
  }, []);

  // Background sync with Supabase (with caching)
  const syncWithSupabase = useCallback(async () => {
    try {
      // Check if we've synced recently (cache for 2 minutes)
      const lastSync = localStorage.getItem('last_supabase_sync');
      const now = Date.now();
      if (lastSync && (now - parseInt(lastSync)) < 120000) {
        console.log('⏭️ Skipping sync - cached data is fresh');
        return; // Skip if synced within last 2 minutes
      }
      
      const { ProblemProgressService } = await import('../services/problemProgressService');
      const { supabase } = await import('../lib/supabase');
      
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      
      console.log('🔄 Syncing with Supabase...');
      const supabaseProgress = await ProblemProgressService.getUserProgress(user.id);
      
      // Update problems with Supabase data (optimized)
      setProblems(currentProblems => {
        let hasChanges = false;
        const updatedProblems = currentProblems.map(problem => {
          const progress = supabaseProgress.find(p => p.problem_id === problem.id);
          if (progress) {
            const newStatus = (progress.status as 'not-started' | 'attempted' | 'solved' | 'mastered') || problem.status;
            const newBookmark = progress.is_bookmarked || false;
            
            if (newStatus !== problem.status || newBookmark !== problem.isBookmarked) {
              hasChanges = true;
              return { ...problem, status: newStatus, isBookmarked: newBookmark };
            }
          }
          return problem;
        });
        
        // Only update if there are actual changes
        if (hasChanges) {
          console.log('✅ Supabase sync completed with changes');
          localStorage.setItem('last_supabase_sync', now.toString());
          
          // Update localStorage bookmark cache for immediate filtering
          const bookmarkKey = 'dsa_problem_bookmarks';
          const bookmarkCache: Record<string, boolean> = {};
          
          updatedProblems.forEach(problem => {
            if (problem.isBookmarked) {
              bookmarkCache[problem.id] = true;
            }
          });
          
          localStorage.setItem(bookmarkKey, JSON.stringify(bookmarkCache));
          
          return updatedProblems;
        }
        console.log('⏭️ No changes detected in Supabase data');
        localStorage.setItem('last_supabase_sync', now.toString()); // Update sync time even if no changes
        return currentProblems;
      });
    } catch (error) {
      console.warn('Background sync with Supabase failed:', error);
    }
  }, []);
  
  // Initialize problems with lazy loading
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedBookmark, setSelectedBookmark] = useState('All');
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [scrollButtonState, setScrollButtonState] = useState<'hidden' | 'down' | 'up'>('hidden');
  const [isScrolling, setIsScrolling] = useState(false);
  
  // AI Filtering state
  const [isAIFiltering, setIsAIFiltering] = useState(false);
  const [aiFilterCriteria, setAiFilterCriteria] = useState<FilterCriteria | null>(null);
  const [showAISearch, setShowAISearch] = useState(false);
  
  // Refs for performance optimization
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Track if data has been loaded to prevent multiple fetches
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    localStorage.removeItem('last_supabase_sync'); // Force fresh sync
    
    try {
      await syncWithSupabase();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [syncWithSupabase, isRefreshing]);

  // AI Filtering function
  const handleAIFilter = useCallback(async (query: string) => {
    if (!query.trim()) {
      setAiFilterCriteria(null);
      return;
    }

    setIsAIFiltering(true);
    try {
      const criteria = await AIFilteringService.parseFilterQuery(query, problems);
      setAiFilterCriteria(criteria);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error('AI filtering failed:', error);
      // Fallback to regular search
      setSearchTerm(query);
      setAiFilterCriteria(null);
    } finally {
      setIsAIFiltering(false);
    }
  }, [problems]);
  
  // Fast initial load, then background sync (only once)
  useEffect(() => {
    if (isDataLoaded) return; // Prevent multiple loads
    
    // Immediate load from localStorage
    const initialProblems = loadProblemsInitial();
    setProblems(initialProblems);
    setIsDataLoaded(true);
    
    // Background sync with Supabase (non-blocking, only once)
    const syncTimer = setTimeout(() => {
      syncWithSupabase();
    }, 100);
    
    return () => clearTimeout(syncTimer);
  }, []); // Empty dependency array - only run once
  
  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, SEARCH_DEBOUNCE_MS);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);
  
  // Memoized derived data for better performance (cached to prevent re-computation)
  const categories = useMemo(() => [
    'All',
    'Arrays',
    'Strings', 
    '2D Arrays',
    'Searching & Sorting',
    'Backtracking',
    'Linked List',
    'Stacks & Queues',
    'Greedy',
    'Binary Trees',
    'Binary Search Trees',
    'Heaps & Hashing',
    'Graphs',
    'Tries',
    'DP',
    'Bit Manipulation',
    'Segment Trees'
  ], []);
  const difficulties = useMemo(() => ['All', 'Easy', 'Medium', 'Hard', 'Very Hard'], []);
  const statuses = useMemo(() => ['All', 'not-started', 'attempted', 'solved', 'mastered'], []);
  const companies = useMemo(() => {
    if (problems.length === 0) return ['All'];
    return ['All', ...Array.from(new Set(problems.flatMap(p => p.companies))).sort()];
  }, [problems.length]); // Only recompute when problem count changes
  const bookmarkOptions = useMemo(() => ['All', 'Bookmarked', 'Not Bookmarked'], []);
  const sortOptions = useMemo(() => [
    { value: 'default', label: 'Default Order' },
    { value: 'difficulty-asc', label: 'Difficulty: Easy → Hard' },
    { value: 'difficulty-desc', label: 'Difficulty: Hard → Easy' },
    { value: 'title', label: 'Title (A-Z)' },
    { value: 'category', label: 'Category' },
    { value: 'time', label: 'Time Estimate' }
  ], []);
  


  // Memoized filtered and sorted problems for better performance
  const filteredProblems = useMemo(() => {
    if (problems.length === 0) return [];
    
    const timer = PerformanceMonitor.startTimer('problems_filter');
    
    let filtered = problems;
    
    // Apply AI filter criteria if available
    if (aiFilterCriteria) {
      filtered = AIFilteringService.applyFilterCriteria(filtered, aiFilterCriteria);
    } else {
      // Apply manual filters
      filtered = problems.filter((problem: Problem) => {
        const matchesSearch = debouncedSearchTerm === '' || 
                             problem.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                             problem.companies.some(company => company.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                             problem.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesDifficulty = selectedDifficulty === 'All' || problem.difficulty === selectedDifficulty;
        const matchesCategory = selectedCategory === 'All' || problem.category === selectedCategory;
        const matchesStatus = selectedStatus === 'All' || problem.status === selectedStatus;
        const matchesCompany = selectedCompany === 'All' || problem.companies.includes(selectedCompany);
        const matchesBookmark = selectedBookmark === 'All' || 
                               (selectedBookmark === 'Bookmarked' && problem.isBookmarked) ||
                               (selectedBookmark === 'Not Bookmarked' && !problem.isBookmarked);
        
        return matchesSearch && matchesDifficulty && matchesCategory && matchesStatus && matchesCompany && matchesBookmark;
      });
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a: Problem, b: Problem) => {
      switch (sortBy) {
        case 'difficulty-asc':
          const diffOrder = ['Easy', 'Medium', 'Hard', 'Very Hard'];
          return diffOrder.indexOf(a.difficulty) - diffOrder.indexOf(b.difficulty);
        case 'difficulty-desc':
          const diffOrderDesc = ['Very Hard', 'Hard', 'Medium', 'Easy'];
          return diffOrderDesc.indexOf(a.difficulty) - diffOrderDesc.indexOf(b.difficulty);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'time':
          return (a.timeEstimate || 0) - (b.timeEstimate || 0);
        default:
          return 0;
      }
    });
    
    timer();
    return sorted;
  }, [problems, debouncedSearchTerm, selectedDifficulty, selectedCategory, selectedStatus, selectedCompany, selectedBookmark, sortBy, aiFilterCriteria]);
  
  // Paginated problems for virtualization
  const paginatedProblems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProblems.slice(startIndex, endIndex);
  }, [filteredProblems, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredProblems.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Optimized handlers with performance monitoring
  const handleStatusChange = useCallback(async (problemId: string, newStatus: string) => {
    const timer = PerformanceMonitor.startTimer('problem_status_change');
    
    try {
      // Update local state immediately for better UX
      setProblems(prev => prev.map(p => 
        p.id === problemId ? { ...p, status: newStatus as Problem['status'] } : p
      ));
      
      // Batch update analytics for better performance
      if (newStatus === 'solved') {
        await batchUpdate({
          problemSolved: true,
          timeSpent: 0, // Could be tracked if needed
          topic: problems.find(p => p.id === problemId)?.category || 'General'
        });
      }
      
      timer();
    } catch (error) {
      console.error('Error updating problem status:', error);
      timer();
    }
  }, [problems, batchUpdate]);

  const handleBookmarkToggle = useCallback((problemId: string) => {
    const timer = PerformanceMonitor.startTimer('problem_bookmark_toggle');
    
    setProblems(prev => prev.map(p => 
      p.id === problemId ? { ...p, isBookmarked: !p.isBookmarked } : p
    ));
    
    timer();
  }, []);

  // Optimized clear filters
  const clearFilters = useCallback(() => {
    const timer = PerformanceMonitor.startTimer('clear_filters');
    
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedDifficulty('All');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedCompany('All');
    setSelectedBookmark('All');
    setSortBy('default');
    setItemsPerPage(20);
    setCurrentPage(1);
    setAiFilterCriteria(null); // Clear AI filters too
    setShowAISearch(false); // Reset to regular search mode
    
    timer();
  }, []);
  
  // Optimized search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  // Filter change handlers with page reset
  const handleFilterChange = useCallback((setter: (value: string) => void) => {
    return (value: string) => {
      setter(value);
      setCurrentPage(1);
    };
  }, []);
  
  // Pagination handlers
  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasNextPage]);
  
  const handlePrevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasPrevPage]);
  
  const handlePageJump = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [totalPages]);
  
  // Performance metrics
  useEffect(() => {
    PerformanceMonitor.recordMetric('problems_total', problems.length);
    PerformanceMonitor.recordMetric('problems_filtered', filteredProblems.length);
  }, [problems.length, filteredProblems.length]);

  // Scroll event listener for showing/hiding scroll button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Set scrolling state to true when user starts scrolling
      setIsScrolling(true);
      
      // Determine button direction (mobile-optimized thresholds)
      const isAtTop = scrollTop < 50; // Smaller threshold for mobile
      const isNearBottom = scrollTop + windowHeight >= documentHeight - 100; // Smaller threshold for mobile
      
      if (isAtTop) {
        setScrollButtonState('down'); // Show down arrow to scroll to bottom
      } else if (isNearBottom) {
        setScrollButtonState('up'); // Show up arrow to scroll to top
      } else {
        setScrollButtonState('down'); // Show down arrow to scroll to bottom when in middle
      }
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set timeout to hide button when scrolling stops (shorter for mobile)
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000); // Hide button 1 second after scrolling stops
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once to set initial state
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Scroll function that handles both directions
  const handleScrollButtonClick = useCallback(() => {
    if (scrollButtonState === 'down') {
      // Scroll to bottom
      bottomRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' 
      });
    } else if (scrollButtonState === 'up') {
      // Scroll to top
      containerRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [scrollButtonState]);

  // Removed unused functions - now handled by ProblemCard component



  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile-Optimized Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">DSA Problems</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Practice {problems.length} carefully curated problems
          </p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => window.open('/code-editor', '_blank')}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors text-sm sm:text-base"
            title="Open Code Editor in new tab"
          >
            <Code className="h-4 w-4" />
            <span className="hidden xs:inline">Code Editor</span>
            <span className="xs:hidden">Code</span>
          </button>
          <button
            onClick={() => setShowAIInsights(!showAIInsights)}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              showAIInsights
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {showAIInsights ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden xs:inline">{showAIInsights ? 'Hide' : 'Show'} AI Insights</span>
            <span className="xs:hidden">AI</span>
          </button>
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden xs:inline">Clear Filters</span>
            <span className="xs:hidden">Clear</span>
          </button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
        {/* Unified Mobile-Friendly Search */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            {/* Search Icon */}
            {showAISearch ? (
              <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 dark:text-purple-500 h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 sm:h-5 sm:w-5" />
            )}
            
            {/* Search Input */}
            <input
              type="text"
              placeholder={showAISearch 
                ? "Ask AI: 'easy array problems from Google' or 'unsolved medium DP'..." 
                : "Search problems, companies, or categories..."
              }
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (showAISearch && e.currentTarget.value.trim()) {
                    handleAIFilter(e.currentTarget.value);
                  }
                }
              }}
              onInput={(e) => {
                // Clear AI filter when user starts typing in regular mode
                if (!showAISearch && aiFilterCriteria) {
                  setAiFilterCriteria(null);
                }
              }}
              className={`w-full pl-9 sm:pl-10 pr-20 py-3 sm:py-3.5 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent transition-all duration-300 text-sm sm:text-base ${
                showAISearch
                  ? 'border-2 border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/10 placeholder-purple-500 dark:placeholder-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500'
                  : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-400'
              }`}
              disabled={isAIFiltering}
            />
            
            {/* Right Side Controls */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {/* AI Loading Spinner */}
              {isAIFiltering && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-1"></div>
              )}
              
              {/* Mobile Search Button (AI Mode) */}
              {showAISearch && searchTerm.trim() && !isAIFiltering && (
                <button
                  onClick={() => handleAIFilter(searchTerm)}
                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors sm:hidden"
                  title="Search with AI"
                >
                  <Search className="h-4 w-4" />
                </button>
              )}
              
              {/* Clear AI Filter Button */}
              {aiFilterCriteria && (
                <button
                  onClick={() => setAiFilterCriteria(null)}
                  className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  title="Clear AI Filter"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* AI Toggle Button */}
              <button
                onClick={() => setShowAISearch(!showAISearch)}
                className={`p-2 rounded-md transition-all duration-200 ${
                  showAISearch
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={showAISearch ? 'Switch to Regular Search' : 'Switch to AI Search'}
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Search Mode Indicator */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {showAISearch ? (
                <>
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  <span>AI Search Mode - Ask natural language questions</span>
                </>
              ) : (
                <>
                  <Search className="h-3 w-3" />
                  <span>Regular Search - Keywords and filters</span>
                </>
              )}
            </div>
            {aiFilterCriteria && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                AI Filtered
              </span>
            )}
          </div>
        </div>
        
        {/* Mobile-First Filter Grid with Labels */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Difficulty Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Difficulty
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => handleFilterChange(setSelectedDifficulty)(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300 text-sm sm:text-base touch-manipulation min-h-[44px]"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === 'All' ? 'All Difficulties' : difficulty}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange(setSelectedCategory)(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300 text-sm sm:text-base touch-manipulation min-h-[44px]"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'All' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange(setSelectedStatus)(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300 text-sm sm:text-base touch-manipulation min-h-[44px]"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'All' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Bookmark Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Bookmarks
            </label>
            <select
              value={selectedBookmark}
              onChange={(e) => handleFilterChange(setSelectedBookmark)(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300 text-sm sm:text-base touch-manipulation min-h-[44px]"
            >
              {bookmarkOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All Bookmarks' : option}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange(setSortBy)(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300 text-sm sm:text-base touch-manipulation min-h-[44px]"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Company Filter - Full Width on Mobile */}
        <div className="mt-3 sm:mt-4 space-y-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Company
          </label>
          <select
            value={selectedCompany}
            onChange={(e) => handleFilterChange(setSelectedCompany)(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300 text-sm sm:text-base touch-manipulation min-h-[44px]"
          >
            {companies.map(company => (
              <option key={company} value={company}>
                {company === 'All' ? 'All Companies' : company}
              </option>
            ))}
          </select>
        </div>
        
        {/* Filter Summary for Mobile */}
        <div className="mt-3 sm:hidden">
          <div className="flex flex-wrap gap-1 text-xs">
            {selectedDifficulty !== 'All' && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                {selectedDifficulty}
              </span>
            )}
            {selectedCategory !== 'All' && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                {selectedCategory}
              </span>
            )}
            {selectedStatus !== 'All' && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full">
                {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).replace('-', ' ')}
              </span>
            )}
            {selectedBookmark !== 'All' && (
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
                <Bookmark className="h-3 w-3 inline mr-1" />
                {selectedBookmark}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary with Page Size Selector */}
      {filteredProblems.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProblems.length)} of {filteredProblems.length} problems
          </p>
          <div className="flex flex-col xs:flex-row items-start xs:items-center space-y-2 xs:space-y-0 xs:space-x-4">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Show:
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent touch-manipulation min-h-[32px]"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">per page</span>
            </div>
            {totalPages > 1 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Problems Grid */}
      <div className="space-y-6">
        {paginatedProblems.map((problem) => (
          <ProblemCard
            key={problem.id}
            problem={problem}
            onStatusChange={handleStatusChange}
            onBookmarkToggle={handleBookmarkToggle}
            showAIInsights={showAIInsights}
          />
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage}
              className="px-3 py-2.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:active:bg-gray-600 touch-manipulation min-h-[40px]"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageJump(pageNum)}
                    className={`px-3 py-2.5 text-sm font-medium rounded-md touch-manipulation min-h-[40px] min-w-[40px] ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white active:bg-blue-700'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:active:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className="px-3 py-2.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:active:bg-gray-600 touch-manipulation min-h-[40px]"
            >
              Next
            </button>
          </div>
          
          {/* Jump to page */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Go to page:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (!isNaN(page)) {
                  handlePageJump(page);
                }
              }}
              className="w-16 px-2 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation min-h-[40px]"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProblems.length === 0 && (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No problems found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your filters to see more problems.</p>
          
          {/* Clear All Filters Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Clear All Filters</span>
            </button>
            
            {aiFilterCriteria && (
              <button
                onClick={() => setAiFilterCriteria(null)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear AI Filter</span>
              </button>
            )}
          </div>
          
          {/* Active Filters Summary */}
          {(searchTerm || debouncedSearchTerm || selectedDifficulty !== 'All' || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedCompany !== 'All' || selectedBookmark !== 'All' || aiFilterCriteria) && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Active filters:</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                {(searchTerm || debouncedSearchTerm) && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                    Search: "{searchTerm || debouncedSearchTerm}"
                  </span>
                )}
                {selectedDifficulty !== 'All' && (
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full">
                    {selectedDifficulty}
                  </span>
                )}
                {selectedCategory !== 'All' && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                    {selectedCategory}
                  </span>
                )}
                {selectedStatus !== 'All' && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full">
                    {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).replace('-', ' ')}
                  </span>
                )}
                {selectedCompany !== 'All' && (
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full">
                    {selectedCompany}
                  </span>
                )}
                {selectedBookmark !== 'All' && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
                    <Bookmark className="h-3 w-3 inline mr-1" />
                    {selectedBookmark}
                  </span>
                )}
                {aiFilterCriteria && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full">
                    AI Filter Active
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Bottom reference for scroll to bottom */}
      <div ref={bottomRef} className="h-1" />
      
      {/* Scroll Button - Mobile Optimized */}
      {scrollButtonState !== 'hidden' && isScrolling && (
        <button
          onClick={handleScrollButtonClick}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-2.5 sm:p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 animate-in fade-in-0 slide-in-from-bottom-2 touch-manipulation"
          aria-label={scrollButtonState === 'down' ? 'Scroll to bottom' : 'Scroll to top'}
        >
          {scrollButtonState === 'down' ? (
            <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </button>
      )}
    </div>
  );
}