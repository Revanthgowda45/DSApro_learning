import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  ExternalLink,
  Clock,
  CheckCircle2,
  Trophy,
  PlayCircle,
  Lightbulb,
  Copy,
  Check,
  Brain,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Terminal,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dsaProblems } from '../data/dsaDatabase';
import { ProblemDescriptionService, ProblemDescription } from '../services/problemDescriptionService';
import { ProblemProgressService } from '../services/problemProgressService';
import { HindsightService } from '../services/hindsightService';
import { GroqAIService } from '../services/groqAIService';
import PistonService, { ExecutionResult } from '../services/pistonService';
import { TestCaseRunnerService, TestRunSummary } from '../services/testCaseRunnerService';
import CodeEditor from '../components/ui/CodeEditor';
import LanguageSelector from '../components/ui/LanguageSelector';

const ProblemSolver: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Problem data
  const problem = dsaProblems.find(p => p.id === problemId);
  const [description, setDescription] = useState<ProblemDescription | null>(null);
  const [isLoadingDesc, setIsLoadingDesc] = useState(true);
  const [descError, setDescError] = useState('');

  // Editor state
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('solver_language') || 'javascript';
  });
  const [userCode, setUserCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [codeOutput, setCodeOutput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [executionTime, setExecutionTime] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  // Test case state
  const [testResults, setTestResults] = useState<TestRunSummary | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'output' | 'testResults'>('output');

  // Problem state
  const [currentStatus, setCurrentStatus] = useState<"not-started" | "attempted" | "solved" | "mastered">(
    (problem?.status as "not-started" | "attempted" | "solved" | "mastered") || 'not-started'
  );
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // AI debug hint
  const [aiHint, setAiHint] = useState('');
  const [isGettingHint, setIsGettingHint] = useState(false);

  // Timer
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Panel control
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'editor'>('description');

  // Language categories for selector
  const languageCategories = {
    'Popular': [
      { value: 'javascript', label: 'JavaScript', defaultCode: '' },
      { value: 'python3', label: 'Python', defaultCode: '' },
      { value: 'java', label: 'Java', defaultCode: '' },
      { value: 'c++', label: 'C++', defaultCode: '' },
      { value: 'c', label: 'C', defaultCode: '' },
      { value: 'typescript', label: 'TypeScript', defaultCode: '' },
    ],
    'More': [
      { value: 'csharp', label: 'C#', defaultCode: '' },
      { value: 'go', label: 'Go', defaultCode: '' },
      { value: 'rust', label: 'Rust', defaultCode: '' },
      { value: 'kotlin', label: 'Kotlin', defaultCode: '' },
      { value: 'swift', label: 'Swift', defaultCode: '' },
      { value: 'ruby', label: 'Ruby', defaultCode: '' },
    ],
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Load problem description
  useEffect(() => {
    if (!problem) return;

    const loadDescription = async () => {
      setIsLoadingDesc(true);
      setDescError('');
      try {
        const desc = await ProblemDescriptionService.getDescription(
          problem.id,
          problem.title,
          problem.difficulty,
          problem.category,
          problem.companies,
          problem.remarks
        );
        setDescription(desc);

        // Set starter code for current language
        if (desc.starterCode[selectedLanguage]) {
          setUserCode(desc.starterCode[selectedLanguage]);
        } else if (desc.starterCode['javascript']) {
          setUserCode(desc.starterCode['javascript']);
        }
      } catch (err) {
        console.error('Failed to load problem description:', err);
        setDescError('Failed to generate problem description. You can still code!');
      } finally {
        setIsLoadingDesc(false);
      }
    };

    loadDescription();
  }, [problem?.id]);

  // Update starter code when language changes
  const handleLanguageChange = useCallback((lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem('solver_language', lang);

    if (description?.starterCode[lang]) {
      // Only override if user hasn't modified the code much
      const currentStarter = description.starterCode[selectedLanguage] || '';
      if (!userCode.trim() || userCode.trim() === currentStarter.trim()) {
        setUserCode(description.starterCode[lang]);
      }
    }
  }, [description, selectedLanguage, userCode]);

  // Run code
  const runCode = useCallback(async () => {
    if (!userCode.trim()) {
      setCodeError('Please write some code before running.');
      return;
    }

    setIsRunning(true);
    setCodeOutput('');
    setCodeError('');
    setAiHint('');
    const t0 = Date.now();

    try {
      let formattedInput = userInput;
      if (userInput) {
        const lang = selectedLanguage.toLowerCase();
        if (['java', 'c++', 'c', 'python', 'python3', 'csharp', 'go', 'rust', 'kotlin', 'swift'].includes(lang)) {
          formattedInput = userInput.trim().replace(/\s+/g, '\n');
        }
      }

      const result: ExecutionResult = await PistonService.executeCode(selectedLanguage, userCode, formattedInput);
      setExecutionTime(Date.now() - t0);

      if (result.success) {
        setCodeOutput(result.output || 'Program executed successfully (no output)');
      } else {
        setCodeError(result.error || 'Unknown execution error');
      }

      // Hindsight: remember this code attempt
      if (user?.id && problem) {
        HindsightService.retainCodeAttempt(
          user.id, problem.title, selectedLanguage, problem.category, result.success
        ).catch(() => {});
      }
    } catch (error) {
      setCodeError(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  }, [userCode, selectedLanguage, userInput, user?.id, problem]);

  // Get AI debug hint
  const getDebugHint = useCallback(async () => {
    if (!user?.id || !codeError || !userCode) return;
    setIsGettingHint(true);
    try {
      await HindsightService.retainCodeAttempt(user.id, problem?.title || 'unknown', selectedLanguage, 'Debugging', false);
      const context = await HindsightService.reflectOnLearning(user.id);
      const hint = await GroqAIService.generateDebugHint(codeError, userCode, context);
      setAiHint(hint);
    } catch (err) {
      setAiHint("Couldn't analyze the error right now. Check the stack trace for clues!");
    } finally {
      setIsGettingHint(false);
    }
  }, [user?.id, codeError, userCode, selectedLanguage, problem]);

  // Update problem status
  const handleStatusChange = useCallback(async (newStatus: "not-started" | "attempted" | "solved" | "mastered") => {
    if (!user?.id || !problemId) return;
    setIsSavingStatus(true);
    try {
      await ProblemProgressService.updateProblemStatus(user.id, problemId, {
        status: newStatus,
        time_spent: elapsed,
        attempts: (currentStatus === 'attempted' ? 1 : 0) + 1,
        solved_at: (newStatus === 'solved' || newStatus === 'mastered') ? new Date().toISOString() : undefined,
      });
      setCurrentStatus(newStatus);

      // Update localStorage for instant feedback on Problems page
      const statusKey = 'dsa_problem_statuses';
      const existing = localStorage.getItem(statusKey);
      const statuses = existing ? JSON.parse(existing) : {};
      statuses[problemId] = newStatus;
      localStorage.setItem(statusKey, JSON.stringify(statuses));

    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsSavingStatus(false);
    }
  }, [user?.id, problemId, elapsed, currentStatus]);

  // Run test cases (LeetCode-style)
  const runTests = useCallback(async () => {
    if (!userCode.trim()) {
      setCodeError('Please write some code before running tests.');
      return;
    }
    if (!description?.testCases || description.testCases.length === 0) {
      setCodeError('No test cases available for this problem. Use "Run" to execute your code.');
      return;
    }

    setIsRunningTests(true);
    setTestResults(null);
    setCodeOutput('');
    setCodeError('');
    setAiHint('');
    setActiveOutputTab('testResults');

    try {
      const summary = await TestCaseRunnerService.runTestCases(
        selectedLanguage,
        userCode,
        description.testCases,
        description.functionName || 'solve'
      );
      setTestResults(summary);

      // Hindsight: remember this attempt
      if (user?.id && problem) {
        HindsightService.retainCodeAttempt(
          user.id, problem.title, selectedLanguage, problem.category, summary.allPassed
        ).catch(() => {});
      }

      // Auto-suggest marking as solved if all tests pass
      if (summary.allPassed && currentStatus !== 'solved' && currentStatus !== 'mastered') {
        handleStatusChange('solved');
      }
    } catch (error) {
      setCodeError(`Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningTests(false);
    }
  }, [userCode, selectedLanguage, description, user?.id, problem, currentStatus, handleStatusChange]);

  // Copy code
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(userCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  }, [userCode]);

  // Format time
  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // 404
  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Problem Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">This problem ID doesn't exist in the database.</p>
          <button onClick={() => navigate('/problems')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            ← Back to Problems
          </button>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'Easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Hard': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Very Hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const statusButtons = [
    { key: 'attempted', label: 'Attempted', icon: <PlayCircle className="h-4 w-4" />, color: 'bg-yellow-500 hover:bg-yellow-600' },
    { key: 'solved', label: 'Solved', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-500 hover:bg-green-600' },
    { key: 'mastered', label: 'Mastered', icon: <Trophy className="h-4 w-4" />, color: 'bg-blue-500 hover:bg-blue-600' },
  ];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-900">
      {/* Top Bar */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-2 sm:px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0 gap-2">
        {/* Left: Back + Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 sm:flex-none">
          <button onClick={() => navigate('/problems')} className="p-1 sm:p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[150px] sm:max-w-[200px] md:max-w-xs">{problem.title}</h1>
              <span className={`hidden xs:inline-block px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400">{problem.category}</span>
            </div>
          </div>
        </div>

        {/* Center: Timer + Status */}
        <div className="hidden sm:flex items-center space-x-3 order-3 sm:order-none w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-1.5 text-gray-400 text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="font-mono">{formatTime(elapsed)}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            {statusButtons.map(btn => (
              <button
                key={btn.key}
                onClick={() => handleStatusChange(btn.key as "not-started" | "attempted" | "solved" | "mastered")}
                disabled={isSavingStatus}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-[10px] sm:text-xs font-medium text-white transition-all ${
                  currentStatus === btn.key ? `${btn.color} ring-2 ring-white/30` : 'bg-gray-700 hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                {btn.icon}
                <span className="hidden md:inline">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: External link */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {problem.link && (
            <a href={problem.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Original</span>
            </a>
          )}
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex border-b border-gray-700 bg-gray-800 flex-shrink-0">
        <button 
          onClick={() => setActiveTab('description')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-medium transition-colors ${activeTab === 'description' ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800' : 'text-gray-400 hover:text-gray-200 bg-gray-900/50'}`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Description</span>
        </button>
        <button 
          onClick={() => setActiveTab('editor')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-medium transition-colors ${activeTab === 'editor' ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800' : 'text-gray-400 hover:text-gray-200 bg-gray-900/50'}`}
        >
          <Terminal className="h-4 w-4" />
          <span>Code Editor</span>
        </button>
      </div>

      {/* Main Content — Split Panel */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Left Panel — Problem Description */}
        <div className={`${activeTab === 'description' ? 'flex' : 'hidden'} lg:flex border-r border-gray-700 bg-gray-800 flex-col transition-all duration-300 w-full h-full lg:h-auto ${
          leftPanelCollapsed ? 'lg:w-10' : 'lg:w-[40%] lg:min-w-[320px]'
        } relative`}>
          {/* Collapse toggle (Desktop only) */}
          <button
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className="hidden lg:flex absolute z-10 top-1/2 -translate-y-1/2 -right-3 w-6 h-12 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-r-md items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            {leftPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {!leftPanelCollapsed && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Loading skeleton */}
              {isLoadingDesc && (
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-400 animate-spin" />
                    <span className="text-purple-400 text-sm font-medium">AI is generating the problem description...</span>
                  </div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                  <div className="h-24 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  <div className="h-16 bg-gray-700 rounded"></div>
                </div>
              )}

              {/* Error */}
              {descError && (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{descError}</span>
                </div>
              )}

              {/* Description content */}
              {description && !isLoadingDesc && (
                <>
                  {/* Title */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen className="h-5 w-5 text-blue-400" />
                      <h2 className="text-lg font-bold text-white">{description.title}</h2>
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(description.difficulty)}`}>{description.difficulty}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400">{description.category}</span>
                    </div>
                  </div>

                  {/* Description text */}
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                      {description.description}
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white flex items-center space-x-1.5">
                      <Terminal className="h-4 w-4 text-green-400" />
                      <span>Examples</span>
                    </h3>
                    {description.examples.map((ex, i) => (
                      <div key={i} className="bg-gray-900 rounded-lg p-3 border border-gray-700 space-y-2">
                        <div className="text-xs text-gray-400">Example {i + 1}</div>
                        <div>
                          <span className="text-xs font-medium text-gray-500">Input: </span>
                          <code className="text-sm text-green-400 font-mono">{ex.input}</code>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500">Output: </span>
                          <code className="text-sm text-blue-400 font-mono">{ex.output}</code>
                        </div>
                        {ex.explanation && (
                          <div className="text-xs text-gray-400 mt-1 pt-1 border-t border-gray-700">
                            <span className="font-medium">Explanation: </span>
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Constraints */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white">Constraints</h3>
                    <ul className="space-y-1">
                      {description.constraints.map((c, i) => (
                        <li key={i} className="text-sm text-gray-400 flex items-start space-x-2">
                          <span className="text-gray-600 mt-0.5">•</span>
                          <code className="text-xs font-mono text-gray-300">{c}</code>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hints (collapsible) */}
                  <details className="group">
                    <summary className="flex items-center space-x-1.5 cursor-pointer text-sm font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">
                      <Lightbulb className="h-4 w-4" />
                      <span>Hints ({description.hints.length})</span>
                    </summary>
                    <div className="mt-2 space-y-2 pl-6">
                      {description.hints.map((h, i) => (
                        <div key={i} className="text-sm text-gray-400 bg-yellow-900/10 border border-yellow-800/30 rounded p-2">
                          💡 {h}
                        </div>
                      ))}
                    </div>
                  </details>

                  {/* Companies */}
                  {problem.companies.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white">Companies</h3>
                      <div className="flex flex-wrap gap-1">
                        {problem.companies.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Panel — Code Editor */}
        <div className={`${activeTab === 'editor' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-w-0 bg-gray-900 w-full h-full lg:h-auto`}>
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-2 sm:px-3 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0 flex-wrap gap-2">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                languageCategories={languageCategories}
                className="w-[110px] sm:min-w-[130px] text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 ml-auto">
              <button onClick={copyCode}
                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors" title="Copy code">
                {isCopied ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </button>
              <button onClick={() => {
                if (description?.starterCode[selectedLanguage]) {
                  setUserCode(description.starterCode[selectedLanguage]);
                }
                setCodeOutput('');
                setCodeError('');
                setAiHint('');
              }}
                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors" title="Reset code">
                <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button onClick={() => setShowInput(!showInput)}
                className={`px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs rounded transition-colors ${showInput ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                Input
              </button>
              <button
                onClick={runTests}
                disabled={isRunningTests || isRunning}
                className="flex items-center space-x-1 sm:space-x-1.5 px-3 py-1 sm:px-4 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
                title="Run against test cases"
              >
                {isRunningTests ? (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                <span>{isRunningTests ? 'Testing...' : 'Run Tests'}</span>
              </button>
              <button
                onClick={runCode}
                disabled={isRunning || isRunningTests}
                className="flex items-center space-x-1 sm:space-x-1.5 px-3 py-1 sm:px-4 sm:py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isRunning ? (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                <span>{isRunning ? 'Run...' : 'Run'}</span>
              </button>
            </div>
          </div>

          {/* Code Editor Area */}
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={userCode}
              onChange={(value) => setUserCode(value || '')}
              language={selectedLanguage}
              theme="vs-dark"
            />
          </div>

          {/* Input Panel */}
          {showInput && (
            <div className="px-3 py-2 bg-gray-800 border-t border-gray-700">
              <label className="block text-xs text-gray-400 mb-1">Standard Input (stdin)</label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full h-16 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm font-mono text-gray-200 resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter input values here..."
              />
            </div>
          )}

          {/* Output Panel — Tabbed */}
          <div className="h-52 flex-shrink-0 border-t border-gray-700 bg-gray-800 flex flex-col">
            {/* Tab bar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setActiveOutputTab('output')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeOutputTab === 'output'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Output</span>
                  {executionTime > 0 && activeOutputTab === 'output' && (
                    <span className="text-gray-500 ml-1">({executionTime}ms)</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveOutputTab('testResults')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeOutputTab === 'testResults'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Test Results</span>
                  {testResults && (
                    <span className={`ml-1 ${testResults.allPassed ? 'text-green-400' : 'text-red-400'}`}>
                      {testResults.passedCases}/{testResults.totalCases}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                {codeError && activeOutputTab === 'output' && (
                  <button
                    onClick={getDebugHint}
                    disabled={isGettingHint}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50"
                  >
                    <Brain className="h-3 w-3" />
                    <span>{isGettingHint ? 'Analyzing...' : 'AI Debug Hint'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-sm">
              {/* ── Output Tab ── */}
              {activeOutputTab === 'output' && (
                <>
                  {codeOutput && (
                    <pre className="text-green-400 whitespace-pre-wrap">{codeOutput}</pre>
                  )}
                  {codeError && (
                    <pre className="text-red-400 whitespace-pre-wrap">{codeError}</pre>
                  )}
                  {aiHint && (
                    <div className="mt-2 p-2 bg-purple-900/20 border border-purple-800 rounded text-purple-300 text-xs">
                      🧠 <strong>AI Hint:</strong> {aiHint}
                    </div>
                  )}
                  {!codeOutput && !codeError && !aiHint && (
                    <span className="text-gray-500">Click "Run" to execute your code...</span>
                  )}
                </>
              )}

              {/* ── Test Results Tab ── */}
              {activeOutputTab === 'testResults' && (
                <>
                  {isRunningTests && (
                    <div className="flex items-center space-x-2 text-blue-400">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Running test cases...</span>
                    </div>
                  )}

                  {testResults && (
                    <div className="space-y-3">
                      {/* Summary Header */}
                      <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                        testResults.allPassed
                          ? 'bg-green-900/20 border-green-700'
                          : 'bg-red-900/20 border-red-700'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {testResults.allPassed ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-400" />
                              <span className="text-green-400 font-semibold text-sm">
                                All {testResults.totalCases} Test Cases Passed! 🎉
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-5 w-5 text-red-400" />
                              <span className="text-red-400 font-semibold text-sm">
                                {testResults.passedCases}/{testResults.totalCases} Test Cases Passed
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{testResults.totalTime}ms total</span>
                      </div>

                      {/* Individual Test Case Results */}
                      {testResults.results.map((result, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg border p-3 space-y-2 ${
                            result.passed
                              ? 'border-green-800/50 bg-green-900/10'
                              : 'border-red-800/50 bg-red-900/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {result.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span className={`text-xs font-semibold ${
                                result.passed ? 'text-green-400' : 'text-red-400'
                              }`}>
                                Case {idx + 1}: {result.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">{result.executionTime}ms</span>
                          </div>

                          <div className="grid grid-cols-1 gap-1 text-xs">
                            <div>
                              <span className="text-gray-500 font-medium">Input: </span>
                              <code className="text-gray-300 bg-gray-900/50 px-1 py-0.5 rounded">
                                {result.input}
                              </code>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">Expected: </span>
                              <code className="text-green-400/80 bg-gray-900/50 px-1 py-0.5 rounded">
                                {result.expectedOutput}
                              </code>
                            </div>
                            {!result.passed && (
                              <div>
                                <span className="text-gray-500 font-medium">Actual: </span>
                                <code className="text-red-400/80 bg-gray-900/50 px-1 py-0.5 rounded">
                                  {result.error || result.actualOutput}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!testResults && !isRunningTests && (
                    <span className="text-gray-500">Click "Run Tests" to validate your solution against test cases...</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemSolver;
