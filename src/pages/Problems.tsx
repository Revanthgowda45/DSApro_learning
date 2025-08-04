import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Filter, RotateCcw, Eye, EyeOff, Bookmark, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { transformDSAQuestions, getTopics, Problem } from '../data/dsaDatabase';
import ProblemCard from '../components/problems/ProblemCard';
import { useOptimizedAnalytics } from '../hooks/useOptimizedAnalytics';
import { PerformanceMonitor } from '../utils/performanceMonitor';

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
  
  // Optimized problem loading with performance monitoring
  const loadProblemsWithProgress = useCallback(() => {
    const timer = PerformanceMonitor.startTimer('problems_load');
    const userProgress: Record<string, any> = {};
    
    try {
      // Load all problem statuses from localStorage
      const statusKey = 'dsa_problem_statuses';
      const existingStatuses = localStorage.getItem(statusKey);
      const problemStatuses: Record<string, string> = existingStatuses ? JSON.parse(existingStatuses) : {};
      
      // Build user progress object from all statuses
      Object.entries(problemStatuses).forEach(([problemId, status]) => {
        userProgress[problemId] = { status };
      });
      
      const result = transformDSAQuestions(userProgress);
      timer(); // End timing
      return result;
    } catch (error) {
      console.error('Error loading problem statuses:', error);
      timer(); // End timing even on error
      return transformDSAQuestions({});
    }
  }, []);
  
  // Initialize problems with lazy loading
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  
  // Refs for performance optimization
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Lazy load problems on component mount
  useEffect(() => {
    const loadProblems = async () => {
      setIsLoading(true);
      try {
        // Use setTimeout to prevent blocking the UI
        await new Promise(resolve => setTimeout(resolve, 0));
        const loadedProblems = loadProblemsWithProgress();
        setProblems(loadedProblems);
      } catch (error) {
        console.error('Error loading problems:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProblems();
  }, [loadProblemsWithProgress]);
  
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
  
  // Memoized derived data for better performance
  const categories = useMemo(() => ['All', ...getTopics()], []);
  const difficulties = useMemo(() => ['All', 'Easy', 'Medium', 'Hard', 'Very Hard'], []);
  const statuses = useMemo(() => ['All', 'not-started', 'attempted', 'solved', 'mastered'], []);
  const companies = useMemo(() => {
    if (problems.length === 0) return ['All'];
    return ['All', ...Array.from(new Set(problems.flatMap(p => p.companies))).sort()];
  }, [problems]);
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
    
    const filtered = problems.filter((problem: Problem) => {
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
  }, [problems, debouncedSearchTerm, selectedDifficulty, selectedCategory, selectedStatus, selectedCompany, selectedBookmark, sortBy]);
  
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading problems...</p>
          </div>
        </div>
      </div>
    );
  }

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
        {/* Search Bar */}
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 sm:h-5 sm:w-5" />
          <input
            type="text"
            placeholder="Search problems, companies, or categories..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300 text-sm sm:text-base"
          />
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
            {companies.slice(0, 20).map(company => (
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
      {filteredProblems.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No problems found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters to see more problems.</p>
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