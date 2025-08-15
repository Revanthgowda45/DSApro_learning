import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Lightbulb, Trophy, Clock, Zap, AlertCircle, CheckCircle, XCircle, Terminal, Maximize, Minimize } from 'lucide-react';
import AIGamingService, { GameChallenge, GameSession } from '../services/aiGamingService';
import PistonService, { ExecutionResult } from '../services/pistonService';
import { useAuth } from '../context/AuthContext';
import CodeEditor from '../components/ui/CodeEditor';

interface AIProviderStatus {
  openrouter: {
    configured: boolean;
    available: boolean;
  };
  gemini: {
    configured: boolean;
    available: boolean;
  };
  currentProvider: string | null;
  fallbackAvailable: boolean;
}

const Gaming: React.FC = () => {
  const { user } = useAuth();
  const [currentChallenge, setCurrentChallenge] = useState<GameChallenge | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userSolution, setUserSolution] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('java');
  const [solutionFeedback, setSolutionFeedback] = useState<string>('');
  const [solutionScore, setSolutionScore] = useState<number>(0);
  const [isCorrectSolution, setIsCorrectSolution] = useState<boolean>(false);
  const [solutionHints, setSolutionHints] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [codeOutput, setCodeOutput] = useState<string>('');
  const [codeError, setCodeError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'console' | 'feedback'>('console');
  const [isAutoFormatting, setIsAutoFormatting] = useState<boolean>(false);

  
  // Enhanced detailed analysis state
  const [lineByLineAnalysis, setLineByLineAnalysis] = useState<Array<{
    line: number;
    code: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    suggestion: string;
  }>>([]);
  const [codeQualityMetrics, setCodeQualityMetrics] = useState<{
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    duplicatedLines: number;
    codeSmells: string[];
    namingConventions: string;
  } | null>(null);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<{
    bottlenecks: string[];
    optimizationOpportunities: string[];
    memoryUsage: string;
    runtimePrediction: string;
  } | null>(null);
  const [edgeCaseAnalysis, setEdgeCaseAnalysis] = useState<{
    coveredCases: string[];
    missedCases: string[];
    testCaseRecommendations: string[];
  } | null>(null);
  const [interviewFeedback, setInterviewFeedback] = useState<{
    strengths: string[];
    weaknesses: string[];
    nextSteps: string[];
    industryReadiness: string;
  } | null>(null);
  const [evaluationReasoning, setEvaluationReasoning] = useState<string>('');
  const [providerStatus, setProviderStatus] = useState<AIProviderStatus>({
    openrouter: { configured: false, available: false },
    gemini: { configured: false, available: false },
    currentProvider: null,
    fallbackAvailable: false
  });

  // Programming language options
  const programmingLanguages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' }
  ];

  // Predefined challenge categories
  const challengeCategories = [
    { value: 'arrays', label: 'Arrays', icon: '📊' },
    { value: 'strings', label: 'Strings', icon: '📝' },
    { value: '2d-arrays', label: '2D Arrays', icon: '🔲' },
    { value: 'searching-sorting', label: 'Searching & Sorting', icon: '🔍' },
    { value: 'backtracking', label: 'Backtracking', icon: '🔄' },
    { value: 'linked-list', label: 'Linked List', icon: '🔗' },
    { value: 'stacks-queues', label: 'Stacks & Queues', icon: '📚' },
    { value: 'greedy', label: 'Greedy', icon: '🎯' },
    { value: 'binary-trees', label: 'Binary Trees', icon: '🌳' },
    { value: 'bst', label: 'Binary Search Trees', icon: '🌲' },
    { value: 'heaps-hashing', label: 'Heaps & Hashing', icon: '🗂️' },
    { value: 'graphs', label: 'Graphs', icon: '🕸️' },
    { value: 'tries', label: 'Tries', icon: '🔤' },
    { value: 'dp', label: 'Dynamic Programming', icon: '⚡' },
    { value: 'bit-manipulation', label: 'Bit Manipulation', icon: '🔢' },
    { value: 'segment-trees', label: 'Segment Trees', icon: '🌿' }
  ];

  // Difficulty levels
  const difficultyLevels = [
    { value: 'easy', label: 'Easy', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    { value: 'hard', label: 'Hard', color: 'text-red-400', bgColor: 'bg-red-500/20' }
  ];

  // State for category and difficulty selection
  const [selectedCategory, setSelectedCategory] = useState('arrays');
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');

  // Code templates for different languages
  const getCodeTemplate = (language: string): string => {
    switch (language) {
      case 'javascript':
        return `// Write your solution here...
function solution() {
  // Your code here
  return result;
}`;
      case 'python':
        return `# Write your solution here...
def solution():
    # Your code here
    return result`;
      case 'java':
        return `// Write your solution here...
public class Solution {
    public static void main(String[] args) {
        // Your code here
    }
}`;
      case 'cpp':
        return `// Write your solution here...
#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`;
      case 'c':
        return `// Write your solution here...
#include <stdio.h>

int main() {
    // Your code here
    return 0;
}`;
      case 'csharp':
        return `// Write your solution here...
using System;

class Program {
    static void Main() {
        // Your code here
    }
}`;
      case 'go':
        return `// Write your solution here...
package main

import "fmt"

func main() {
    // Your code here
}`;
      default:
        return '// Write your solution here...';
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentChallenge && !isCompleted) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentChallenge, isCompleted]);

  // Load AI provider status on component mount
  useEffect(() => {
    loadProviderStatus();
  }, []);

  // Handle keyboard shortcuts from Monaco Editor
  useEffect(() => {
    const handleEditorSave = () => {
      // Save current solution to localStorage or trigger save functionality
      localStorage.setItem('gamingSolution', JSON.stringify({
        code: userSolution,
        language: selectedLanguage,
        timestamp: Date.now()
      }));
    };

    const handleEditorFullscreen = () => {
      toggleFullscreen();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Enter / Cmd+Enter: Run code
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isRunning && !isCompleted) {
          runCode();
        }
      }
      
      // F5: Run code (alternative)
      if (event.key === 'F5') {
        event.preventDefault();
        if (!isRunning && !isCompleted) {
          runCode();
        }
      }
      
      // Ctrl+R / Cmd+R: Reset game
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        resetGame();
      }
      
      // Ctrl+S / Cmd+S: Save current solution
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleEditorSave();
      }
      
      // F11: Toggle fullscreen
      if (event.key === 'F11') {
        event.preventDefault();
        handleEditorFullscreen();
      }
    };

    window.addEventListener('editorSave', handleEditorSave as EventListener);
    window.addEventListener('editorFullscreen', handleEditorFullscreen);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('editorSave', handleEditorSave as EventListener);
      window.removeEventListener('editorFullscreen', handleEditorFullscreen);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userSolution, selectedLanguage, isRunning, isCompleted]);

  const loadProviderStatus = async () => {
    try {
      // Initialize provider status with default values
      setProviderStatus({
        openrouter: {
          configured: true,
          available: true
        },
        gemini: {
          configured: true,
          available: true
        },
        currentProvider: 'openrouter',
        fallbackAvailable: true
      });
    } catch (error) {
      console.error('Failed to load provider status:', error);
    }
  };

  const generateNewChallenge = useCallback(async () => {
    if (!user) {
      setError('Please log in to play AI-powered challenges');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get current values from DOM to avoid state timing issues
      const categorySelect = document.querySelector('select') as HTMLSelectElement;
      const currentCategory = categorySelect?.value || selectedCategory;
      
      // Get current difficulty from active button
      const activeDifficultyButton = document.querySelector('.border-2.border-current') as HTMLButtonElement;
      const currentDifficulty = activeDifficultyButton?.textContent?.toLowerCase() || selectedDifficulty;
      
      const categoryLabel = challengeCategories.find(cat => cat.value === currentCategory)?.label || 'Arrays';
      console.log(`🎮 Gaming Component: Current Category="${currentCategory}", Label="${categoryLabel}", Current Difficulty="${currentDifficulty}"`);
      console.log(`🔍 State values: Category="${selectedCategory}", Difficulty="${selectedDifficulty}"`);
      
      const challenge = await AIGamingService.generateChallenge(
        currentDifficulty as 'easy' | 'medium' | 'hard', 
        categoryLabel, 
        1
      );
      if (challenge) {
        setCurrentChallenge(challenge);
      } else {
        throw new Error('Failed to generate challenge');
      }
      setIsCompleted(false);
      setTimeElapsed(0);
      setHintsUsed(0);
      setCurrentHint('');
      setShowHint(false);
      setScore(0);
      setUserSolution(getCodeTemplate(selectedLanguage));
      setSolutionFeedback('');
      setSolutionScore(0);
      setIsCorrectSolution(false);
      setSolutionHints([]);
      setCodeOutput('');
      setCodeError('');
      
      // Create new game session
      const session: GameSession = {
        id: `session_${Date.now()}`,
        challengeId: challenge.id,
        startTime: new Date(),
        score: 0,
        hintsUsed: 0,
        completed: false,
        timeSpent: 0
      };
      setGameSession(session);
    } catch (error) {
      console.error('Failed to generate challenge:', error);
      setError('Failed to generate new challenge. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const startGame = () => {
    if (currentChallenge) {
      setIsPlaying(true);
      setTimeElapsed(0);
    }
  };

  // Auto-start timer when user begins typing
  const handleCodeChange = (value: string) => {
    setUserSolution(value);
    
    // Auto-start timer if not already playing and user has typed something meaningful
    if (currentChallenge && !isPlaying && !isCompleted && value.trim() !== getCodeTemplate(selectedLanguage).trim()) {
      setIsPlaying(true);
      if (timeElapsed === 0) {
        setTimeElapsed(0); // Reset timer if it's the first time starting
      }
    }
  };

  // Toggle fullscreen mode for code editor
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Auto format code function
  const autoFormatCode = () => {
    setIsAutoFormatting(true);
    
    try {
      let formattedCode = userSolution;
      
      // Basic formatting based on language
      if (selectedLanguage === 'java' || selectedLanguage === 'javascript' || selectedLanguage === 'c' || selectedLanguage === 'cpp' || selectedLanguage === 'csharp') {
        // Format curly braces and indentation
        formattedCode = formattedCode
          .replace(/\{\s*\n/g, '{\n')
          .replace(/\n\s*\}/g, '\n}')
          .replace(/;\s*\n/g, ';\n')
          .split('\n')
          .map((line, index, lines) => {
            let trimmed = line.trim();
            if (!trimmed) return '';
            
            let indent = 0;
            for (let i = 0; i < index; i++) {
              let prevLine = lines[i].trim();
              if (prevLine.includes('{') && !prevLine.includes('}')) indent++;
              if (prevLine.includes('}') && !prevLine.includes('{')) indent--;
            }
            if (trimmed.includes('}') && !trimmed.includes('{')) indent--;
            
            return '  '.repeat(Math.max(0, indent)) + trimmed;
          })
          .join('\n');
      } else if (selectedLanguage === 'python') {
        // Format Python indentation
        formattedCode = formattedCode
          .split('\n')
          .map((line, index, lines) => {
            let trimmed = line.trim();
            if (!trimmed) return '';
            
            let indent = 0;
            for (let i = 0; i < index; i++) {
              let prevLine = lines[i].trim();
              if (prevLine.endsWith(':')) indent++;
              if (prevLine === 'pass' || (prevLine && !prevLine.startsWith(' ') && i > 0)) {
                // Check if we're ending an indented block
                if (lines[i-1] && lines[i-1].startsWith('    ')) indent--;
              }
            }
            
            return '    '.repeat(Math.max(0, indent)) + trimmed;
          })
          .join('\n');
      }
      
      setUserSolution(formattedCode);
    } catch (error) {
      console.error('Auto-formatting error:', error);
    } finally {
      setTimeout(() => setIsAutoFormatting(false), 500);
    }
  };

  const pauseGame = () => {
    setIsPlaying(false);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setTimeElapsed(0);
    setHintsUsed(0);
    setCurrentHint('');
    setShowHint(false);
    setScore(0);
    setIsCompleted(false);
    setUserSolution(getCodeTemplate(selectedLanguage));
    setSolutionFeedback('');
    setSolutionScore(0);
    setIsCorrectSolution(false);
    setSolutionHints([]);
    setCodeOutput('');
    setCodeError('');
    if (gameSession) {
      setGameSession({
        ...gameSession,
        score: 0,
        hintsUsed: 0,
        completed: false,
        timeSpent: 0
      });
    }
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    if (!isCompleted && !isPlaying) {
      setUserSolution(getCodeTemplate(language));
    }
  };

  // Code execution function using Piston API
  const runCode = async () => {
    console.log('🚀 Run Code button clicked - Using Piston API');
    
    if (!userSolution.trim()) {
      setCodeError('Please write some code to run');
      setIsRunning(false);
      return;
    }

    console.log('📝 User solution:', userSolution);
    console.log('🔤 Selected language:', selectedLanguage);

    setIsRunning(true);
    setCodeOutput('');
    setCodeError('');

    try {
      // Check if language is supported by Piston API
      if (!PistonService.isLanguageSupported(selectedLanguage)) {
        throw new Error(`Language '${selectedLanguage}' is not supported by Piston API`);
      }

      console.log('🔍 Executing code with Piston API...');
      
      // Execute code using Piston API
      const result: ExecutionResult = await PistonService.executeCode(
        selectedLanguage,
        userSolution
      );

      console.log('📊 Piston execution result:', result);

      if (result.success) {
        setCodeOutput(result.output || '(no output)');
        console.log(`✅ Code executed successfully in ${result.executionTime}ms`);
      } else {
        setCodeError(result.error || 'Unknown execution error');
        if (result.output) {
          setCodeOutput(result.output);
        }
        console.error('❌ Code execution failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Piston API error:', error);
      setCodeError(`Execution Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };




  const getHint = async () => {
    if (!currentChallenge || hintsUsed >= currentChallenge.hints.length) return;
    
    setIsLoading(true);
    try {
      const hint = await AIGamingService.getHint(currentChallenge, userSolution || '');
      setCurrentHint(hint);
      setShowHint(true);
      setHintsUsed(prev => prev + 1);
      
      // Update game session
      if (gameSession) {
        setGameSession({
          ...gameSession,
          hintsUsed: hintsUsed + 1
        });
      }
    } catch (error) {
      console.error('Failed to get hint:', error);
      setError('Failed to get hint. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitSolution = async () => {
    if (!currentChallenge || !gameSession || !userSolution.trim()) {
      setError('Please enter your solution before submitting.');
      return;
    }
    
    console.log('🚀 Starting solution submission...');
    console.log('📝 User solution:', userSolution.substring(0, 100) + '...');
    
    setIsLoading(true);
    setError('');
    
    try {
      // Get AI evaluation of the solution with language context
      const languageLabel = programmingLanguages.find(l => l.value === selectedLanguage)?.label || 'JavaScript';
      const solutionWithContext = `Language: ${languageLabel}\n\n${userSolution}`;
      
      console.log('🤖 Calling AI evaluation...');
      const evaluation = await AIGamingService.evaluateSolution(currentChallenge, solutionWithContext, timeElapsed, hintsUsed);
      
      console.log('📊 Evaluation result:', evaluation);
      
      if (evaluation) {
        console.log('✅ Setting evaluation feedback...');
        setSolutionFeedback(evaluation.feedback);
        setSolutionScore(evaluation.score);
        setIsCorrectSolution(evaluation.isCorrect);
        setSolutionHints(evaluation.suggestions || []);
        
        // Set detailed analysis data
        setLineByLineAnalysis(evaluation.lineByLineAnalysis || []);
        setCodeQualityMetrics(evaluation.codeQualityMetrics || null);
        setPerformanceAnalysis(evaluation.performanceAnalysis || null);
        setEdgeCaseAnalysis(evaluation.edgeCaseAnalysis || null);
        setInterviewFeedback(evaluation.interviewFeedback || null);
        setEvaluationReasoning(evaluation.reasoning || '');
        
        // Calculate final score combining time, hints, and solution quality
        const timeScore = calculateScore();
        const finalScore = Math.floor((timeScore + evaluation.score) / 2);
        setScore(finalScore);
        
        setIsCompleted(true);
        setIsPlaying(false);
        
        // Update game session
        const updatedSession: GameSession = {
          ...gameSession,
          endTime: new Date(),
          score: finalScore,
          completed: true,
          timeSpent: timeElapsed
        };
        setGameSession(updatedSession);
        
        console.log('🎉 Game completed with AI evaluation:', updatedSession);
      } else {
        // Fallback if AI evaluation fails
        const finalScore = calculateScore();
        setScore(finalScore);
        setIsCompleted(true);
        setIsPlaying(false);
        setSolutionFeedback('Solution submitted successfully! AI evaluation unavailable.');
        setIsCorrectSolution(finalScore >= 70);
        setSolutionHints([]);
      }
    } catch (error) {
      console.error('Failed to evaluate solution:', error);
      setError('Failed to evaluate solution. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateScore = (): number => {
    if (!currentChallenge) return 0;
    
    let baseScore = currentChallenge.points;
    
    // Time bonus (if completed within perfect time)
    if (timeElapsed <= currentChallenge.perfectTime) {
      baseScore += Math.floor(baseScore * 0.5); // 50% bonus
    }
    
    // Hint penalty
    const hintPenalty = hintsUsed * Math.floor(baseScore * 0.1); // 10% per hint
    baseScore -= hintPenalty;
    
    return Math.max(baseScore, Math.floor(currentChallenge.points * 0.1)); // Minimum 10% of base points
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProviderStatusIcon = (provider: 'openrouter' | 'gemini') => {
    const status = providerStatus[provider];
    if (status.configured && status.available) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (status.configured && !status.available) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎮 AI Gaming Challenge
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Test your problem-solving skills with AI-generated challenges
          </p>
        </div>



        {/* Game Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
          {/* Challenge Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Challenge Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  console.log(`🔄 Category changed from "${selectedCategory}" to "${e.target.value}"`);
                  setSelectedCategory(e.target.value);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {challengeCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Level
              </label>
              <div className="flex space-x-2">
                {difficultyLevels.map((difficulty) => (
                  <button
                    key={difficulty.value}
                    onClick={() => {
                      console.log(`🔄 Difficulty changed from "${selectedDifficulty}" to "${difficulty.value}"`);
                      setSelectedDifficulty(difficulty.value);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedDifficulty === difficulty.value
                        ? `${difficulty.bgColor} ${difficulty.color} border-2 border-current`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {difficulty.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <button
              onClick={generateNewChallenge}
              disabled={isLoading || isPlaying}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>{isLoading ? 'Generating...' : 'New Challenge'}</span>
            </button>
            
            {currentChallenge && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={isPlaying ? pauseGame : startGame}
                  disabled={isCompleted}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause' : 'Start'}</span>
                </button>
                
                <button
                  onClick={resetGame}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>

          {/* Game Stats - Compact */}
          {currentChallenge && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                <Clock className="w-4 h-4 mx-auto mb-0.5 text-blue-600" />
                <div className="text-sm font-bold text-gray-900 dark:text-white">{formatTime(timeElapsed)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Time</div>
              </div>
              
              <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                <Lightbulb className="w-4 h-4 mx-auto mb-0.5 text-yellow-600" />
                <div className="text-sm font-bold text-gray-900 dark:text-white">{hintsUsed}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Hints Used</div>
              </div>
              
              <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                <Trophy className="w-4 h-4 mx-auto mb-0.5 text-purple-600" />
                <div className="text-sm font-bold text-gray-900 dark:text-white">{score}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
              </div>
              
              <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                <div className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getDifficultyColor(currentChallenge.difficulty)}`}>
                  {currentChallenge.difficulty.toUpperCase()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Difficulty</div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Fullscreen Code Editor Overlay */}
        {isFullscreen && currentChallenge && (
          <div className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-white dark:bg-gray-900 flex flex-col">
            {/* Fullscreen Code Editor */}
            <div className="bg-white dark:bg-gray-800 flex flex-col h-full min-h-0">
              {/* Code Editor Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Code - Fullscreen</span>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Language Selection */}
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    disabled={isCompleted}
                    className="px-2 sm:px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm text-gray-900 dark:text-gray-200 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[80px]"
                  >
                    {programmingLanguages.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <span className="text-xs text-gray-500">Auto</span>
                  </button>
                  <button 
                    onClick={toggleFullscreen}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Exit Fullscreen"
                  >
                    <Minimize className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  {isCompleted && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                      <CheckCircle className="w-3 h-3" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fullscreen Main Content Area */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                {/* Code Editor Section */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1">
                    <CodeEditor
                      value={userSolution}
                      onChange={handleCodeChange}
                      language={selectedLanguage}
                      isRunning={isRunning}
                      isDisabled={isCompleted}
                      height="100%"
                      theme="vs-dark"
                      minimal={true}
                    />
                  </div>
                </div>

                {/* Output Panel - Right Side */}
                <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900">
                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    <button
                      onClick={() => setActiveOutputTab('console')}
                      className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
                        activeOutputTab === 'console'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-b-2 border-blue-500'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Terminal className="w-4 h-4" />
                      <span>Console</span>
                      {(codeOutput || codeError) && (
                        <div className={`w-2 h-2 rounded-full ${codeError ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveOutputTab('feedback')}
                      className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
                        activeOutputTab === 'feedback'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-b-2 border-purple-500'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-xs">🧠</span>
                      </div>
                      <span>AI Feedback</span>
                      {solutionFeedback && (
                        <div className={`w-2 h-2 rounded-full ${isCorrectSolution ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      )}
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Console Tab */}
                    {activeOutputTab === 'console' && (
                      <div className="h-full flex flex-col">
                        {(codeOutput || codeError) ? (
                          <div className="flex-1 p-4 min-h-0">
                            {/* Professional Terminal Output */}
                            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-sm border border-gray-700 h-full flex flex-col">
                              {/* Terminal Header */}
                              <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  </div>
                                  <span className="text-xs text-gray-300 font-medium">
                                    {codeError ? 'Compile Error' : 'Test Result'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${codeError ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                  <span className="text-xs text-gray-400">
                                    {codeError ? 'Failed' : 'Success'}
                                  </span>
                                </div>
                              </div>

                              {/* Terminal Content */}
                              <div className="flex-1 p-3 bg-gray-900 font-mono text-xs overflow-y-auto">
                                {codeError ? (
                                  <div className="space-y-2">
                                    <div className="text-red-400 font-semibold flex items-center space-x-2">
                                      <XCircle className="w-4 h-4" />
                                      <span>BUILD FAILED</span>
                                    </div>
                                    <div className="text-red-300 whitespace-pre-wrap leading-relaxed">
                                      {codeError.split('\n').map((line, index) => (
                                        <div key={index} className="flex text-xs">
                                          <span className="text-red-500 mr-2 flex-shrink-0">
                                            {line.includes('Line') ? '⚠' : line.includes('Error') ? '✗' : '│'}
                                          </span>
                                          <span className="break-all">{line}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-green-400 font-semibold">
                                      <CheckCircle className="w-4 h-4" />
                                      <span>BUILD SUCCESSFUL</span>
                                    </div>
                                    <div className="mt-4">
                                      <div className="text-blue-400 text-xs mb-2">OUTPUT:</div>
                                      <div className="bg-gray-800 border-l-4 border-blue-500 p-3 rounded">
                                        <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                                          {codeOutput.split('\n').map((line, index) => (
                                            <div key={index} className="flex text-xs">
                                              <span className="text-gray-500 mr-2 flex-shrink-0">▶</span>
                                              <span className="break-all">{line || '(no output)'}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center p-4">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Run your code to see output here</p>
                              <p className="text-xs mt-1">Click "Run" to execute your solution</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Feedback Tab */}
                    {activeOutputTab === 'feedback' && (
                      <div className="h-full flex flex-col">
                        {solutionFeedback ? (
                          <div className="flex-1 p-4 min-h-0">
                            <div className={`h-full rounded-lg border flex flex-col ${
                              isCorrectSolution 
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                : solutionScore >= 60 
                                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}>
                              {/* AI Feedback Header */}
                              <div className={`px-4 py-3 border-b flex items-center justify-between flex-shrink-0 ${
                                isCorrectSolution 
                                  ? 'border-green-200 dark:border-green-800 bg-green-100 dark:bg-green-900/40' 
                                  : solutionScore >= 60 
                                    ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-900/40'
                                    : 'border-red-200 dark:border-red-800 bg-red-100 dark:bg-red-900/40'
                              }`}>
                                <div className={`flex items-center space-x-2 font-semibold text-sm ${
                                  isCorrectSolution 
                                    ? 'text-green-800 dark:text-green-200' 
                                    : solutionScore >= 60 
                                      ? 'text-yellow-800 dark:text-yellow-200' 
                                      : 'text-red-800 dark:text-red-200'
                                }`}>
                                  {isCorrectSolution ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                  <span>AI Analysis</span>
                                </div>
                                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  isCorrectSolution 
                                    ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' 
                                    : solutionScore >= 60 
                                      ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                                      : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                                }`}>
                                  {solutionScore}/100
                                </div>
                              </div>
                              
                              {/* AI Feedback Content */}
                              <div className="flex-1 overflow-y-auto min-h-0">
                                <div className="p-4">
                                  <div className={`text-sm whitespace-pre-wrap leading-relaxed ${
                                    isCorrectSolution 
                                      ? 'text-green-700 dark:text-green-300' 
                                      : solutionScore >= 60 
                                        ? 'text-yellow-700 dark:text-yellow-300' 
                                        : 'text-red-700 dark:text-red-300'
                                  }`}>
                                    {solutionFeedback.replace(/\\n/g, '\n')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center p-4">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center opacity-50">
                                <span className="text-white text-sm">🧠</span>
                              </div>
                              <p className="text-sm">Submit your solution to get AI feedback</p>
                              <p className="text-xs mt-1">Click "Submit" to receive detailed analysis</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fullscreen Bottom Action Bar - Mobile Optimized */}
              <div className="flex-shrink-0 p-2 sm:p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 overflow-x-auto">
                    <span>Saved</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(timeElapsed)}</span>
                    {score > 0 && (
                      <>
                        <Trophy className="w-3 h-3" />
                        <span>{score} pts</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                    <button
                      onClick={isPlaying ? pauseGame : startGame}
                      disabled={isCompleted}
                      className="flex-shrink-0 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs disabled:opacity-50 transition-colors flex items-center space-x-1 min-h-[36px] touch-manipulation"
                    >
                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{isPlaying ? 'Pause' : 'Start'}</span>
                    </button>
                    <button
                      onClick={resetGame}
                      className="flex-shrink-0 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors flex items-center space-x-1 min-h-[36px] touch-manipulation"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={runCode}
                      disabled={isRunning || !userSolution.trim() || isCompleted}
                      className="flex-shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs disabled:opacity-50 transition-colors flex items-center space-x-1 min-h-[36px] touch-manipulation"
                    >
                      <Play className="w-3 h-3" />
                      <span>{isRunning ? 'Running...' : 'Run'}</span>
                    </button>
                    <button
                      onClick={submitSolution}
                      disabled={isCompleted || !userSolution.trim() || isLoading}
                      className="flex-shrink-0 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs disabled:opacity-50 transition-colors flex items-center space-x-1 min-h-[36px] touch-manipulation"
                    >
                      <Trophy className="w-3 h-3" />
                      <span>{isLoading ? 'Submitting...' : 'Submit'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Challenge Display - Mobile-Optimized Layout */}
        {currentChallenge && !isFullscreen && (
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-3 sm:gap-4 mb-6 min-h-[400px] lg:h-[500px]">
            {/* Problem Description Panel - Left Side */}
            <div className="bg-white dark:bg-gray-800 lg:border-r border-gray-200 dark:border-gray-700 flex flex-col rounded-lg overflow-hidden shadow-sm border lg:border-0">
              {/* Problem Header - Mobile Optimized */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">{currentChallenge.title}</h2>
                  <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                    currentChallenge.difficulty.toLowerCase() === 'easy' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                    currentChallenge.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                    'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                  }`}>
                    {currentChallenge.difficulty}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{formatTime(timeElapsed)}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20">
                  📋 Description
                </button>
                <button className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  📝 Editorial
                </button>
                <button className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  💡 Solutions
                </button>
                <button className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  📊 Submissions
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4">
              
                <div className="prose dark:prose-invert max-w-none">
                  <div 
                    className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: currentChallenge.description
                        // Handle bold text with colors for different sections
                        .replace(/\*\*(Problem Statement:)\*\*/g, '<strong class="font-bold text-purple-600 dark:text-purple-400 text-base">$1</strong>')
                        .replace(/\*\*(Example \d+:)\*\*/g, '<strong class="font-bold text-blue-600 dark:text-blue-400 text-base">$1</strong>')
                        .replace(/\*\*(Constraints:)\*\*/g, '<strong class="font-bold text-orange-600 dark:text-orange-400 text-base">$1</strong>')
                        .replace(/\*\*(Follow-up:)\*\*/g, '<strong class="font-bold text-green-600 dark:text-green-400 text-base">$1</strong>')
                        .replace(/\*\*(Companies:)\*\*/g, '<strong class="font-bold text-indigo-600 dark:text-indigo-400 text-base">$1</strong>')
                        .replace(/\*\*(Reference:)\*\*/g, '<strong class="font-bold text-cyan-600 dark:text-cyan-400 text-base">$1</strong>')
                        .replace(/\*\*(Difficulty:)\*\*/g, '<strong class="font-bold text-red-600 dark:text-red-400 text-base">$1</strong>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white text-base">$1</strong>')
                        // Handle bullet points
                        .replace(/^• (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>')
                        // Handle numbered examples
                        .replace(/^(\d+\.\s)/gm, '<div class="mt-3 mb-2"><strong class="text-blue-600 dark:text-blue-400">$1</strong>')
                        // Handle Input/Output/Explanation
                        .replace(/^(Input:|Output:|Explanation:)/gm, '<div class="mt-2"><strong class="text-green-600 dark:text-green-400">$1</strong>')
                        // Handle line breaks and paragraphs
                        .replace(/\n\n/g, '</div><div class="mt-3">')
                        .replace(/\n/g, '<br>')
                        // Wrap everything
                        .replace(/^/, '<div>')
                        .replace(/$/, '</div>')
                        // Wrap consecutive list items in ul
                        .replace(/(<li.*?<\/li>)(\s*<li.*?<\/li>)*/g, '<ul class="list-none space-y-1 my-2">$&</ul>')
                    }}
                  />
                </div>

                {/* Hint Section */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span>Hints ({hintsUsed}/{currentChallenge.hints.length})</span>
                    </h3>
                    <button
                      onClick={getHint}
                      disabled={isLoading || hintsUsed >= currentChallenge.hints.length || isCompleted}
                      className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                    >
                      <Lightbulb className="w-3 h-3" />
                      <span>Hint</span>
                    </button>
                  </div>
                  
                  {showHint && currentHint && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm">
                      <p className="text-yellow-800 dark:text-yellow-200">{currentHint}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Code Editor Panel - Right Side - Mobile Optimized */}
            <div className="bg-white dark:bg-gray-800 flex flex-col rounded-lg overflow-hidden shadow-sm border mt-3 lg:mt-0">
              {/* Code Editor Header - Styled */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-green-400">&lt;/&gt;</span>
                    <span className="text-sm font-medium text-white">Code</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Language Selection - Mobile Fill */}
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    disabled={isCompleted}
                    className="px-2 py-2 sm:py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-green-400 min-w-[70px] sm:min-w-[70px] w-full sm:w-auto"
                  >
                    {programmingLanguages.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  {/* Fullscreen Button - Desktop Only */}
                  <button 
                    onClick={toggleFullscreen}
                    className="hidden sm:block p-1.5 hover:bg-gray-700 rounded transition-colors"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-3 h-3 text-gray-400" />
                    ) : (
                      <Maximize className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                  {isCompleted && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-xs">
                      <CheckCircle className="w-3 h-3" />
                      <span className="hidden sm:inline">Done</span>
                      <span className="sm:hidden">✓</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Code Editor Area - Mobile Fit Layout */}
              <div className="flex-1 flex flex-col">
                {/* Monaco Code Editor */}
                <div 
                  className="w-full bg-gray-900 rounded-lg overflow-hidden"
                  style={{ 
                    height: '400px',
                    minHeight: '400px',
                    maxHeight: '500px'
                  }}
                >
                  <CodeEditor
                    value={userSolution}
                    onChange={handleCodeChange}
                    language={selectedLanguage}
                    isRunning={isRunning}
                    isDisabled={isCompleted}
                    height="400px"
                    theme="vs-dark"
                    minimal={true}
                  />
                </div>

                {/* Bottom Action Bar - Mobile Optimized */}
                <div className="p-2 sm:p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    {/* Status Info - Mobile Compact */}
                    <div className="flex items-center space-x-3 sm:space-x-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                      <span className="flex-shrink-0">Saved</span>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{formatTime(timeElapsed)}</span>
                      </div>
                      {score > 0 && (
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{score} pts</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons - Mobile Optimized */}
                    <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto pb-1">
                      {!isPlaying && !isCompleted && (
                        <button
                          onClick={startGame}
                          className="flex-shrink-0 px-3 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded text-xs sm:text-sm flex items-center space-x-1 font-medium touch-manipulation min-h-[36px] transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Start</span>
                        </button>
                      )}
                      {isPlaying && (
                        <button
                          onClick={pauseGame}
                          className="flex-shrink-0 px-3 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded text-xs sm:text-sm flex items-center space-x-1 font-medium touch-manipulation min-h-[36px] transition-colors"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Pause</span>
                        </button>
                      )}
                      <button
                        onClick={() => setUserSolution(getCodeTemplate(selectedLanguage))}
                        disabled={isCompleted}
                        className="flex-shrink-0 px-3 py-2 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white rounded text-xs sm:text-sm disabled:opacity-50 font-medium touch-manipulation min-h-[36px] transition-colors"
                      >
                        <span className="sm:hidden">↻</span>
                        <span className="hidden sm:inline">Reset</span>
                      </button>
                      <button
                        onClick={runCode}
                        disabled={isRunning || isCompleted}
                        className="flex-shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded text-xs sm:text-sm disabled:opacity-50 font-medium touch-manipulation min-h-[36px] transition-colors"
                      >
                        {isRunning ? (
                          <span className="flex items-center space-x-1">
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="hidden sm:inline">Running...</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <Play className="w-3 h-3" />
                            <span>Run</span>
                          </span>
                        )}
                      </button>
                      <button
                        onClick={submitSolution}
                        disabled={isLoading || isCompleted}
                        className="flex-shrink-0 px-3 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded text-xs sm:text-sm disabled:opacity-50 font-medium touch-manipulation min-h-[36px] transition-colors"
                      >
                        {isLoading ? (
                          <span className="flex items-center space-x-1">
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="hidden sm:inline">Submitting...</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <Trophy className="w-3 h-3" />
                            <span>Submit</span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>




              

              
              {/* Final Results */}
              {isCompleted && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Challenge Completed! 🎉</h4>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <p><strong>Final Score:</strong> {score} points</p>
                    <p><strong>Time:</strong> {formatTime(timeElapsed)}</p>
                    <p><strong>Hints Used:</strong> {hintsUsed}</p>
                    {solutionScore > 0 && <p><strong>Solution Quality:</strong> {solutionScore}/100</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}



        {/* Professional Terminal Output - Outside Fixed Container */}
        {currentChallenge && (codeOutput || codeError) && (
          <div className="mb-6">
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300 font-medium">
                      {codeError ? 'Compile Error' : 'Test Result'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${codeError ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className="text-xs text-gray-400">
                    {codeError ? 'Failed' : 'Success'}
                  </span>
                </div>
              </div>

              {/* Terminal Content */}
              <div className="p-4 bg-gray-900 font-mono text-sm max-h-64 overflow-y-auto">
                {codeError ? (
                  <div className="space-y-2">
                    <div className="text-red-400 font-semibold">Compile Error</div>
                    <div className="text-red-300 whitespace-pre-wrap leading-relaxed">
                      {codeError.split('\n').map((line, index) => (
                        <div key={index} className="flex">
                          <span className="text-red-500 mr-2">
                            {line.includes('Line') ? '⚠' : line.includes('Error') ? '✗' : '│'}
                          </span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-green-400 font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Output:</span>
                    </div>
                    <div className="text-gray-100 whitespace-pre-wrap leading-relaxed pl-6">
                      {codeOutput.split('\n').map((line, index) => (
                        <div key={index} className="flex">
                          <span className="text-gray-500 mr-2">▶</span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal Footer */}
              <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>Language: {programmingLanguages.find(l => l.value === selectedLanguage)?.label}</span>
                    <span>Status: {codeError ? 'Error' : 'Success'}</span>
                  </div>
                  {selectedLanguage !== 'javascript' && selectedLanguage !== 'python' && (
                    <span className="text-yellow-400">
                      ⚡ Simulated execution
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Feedback Section - Outside Fixed Container */}
        {currentChallenge && solutionFeedback && (
          <div className="mb-6">
            <div className={`p-4 rounded-lg border ${
              isCorrectSolution 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : solutionScore >= 85
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : solutionScore >= 60
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : solutionScore >= 30
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            } shadow-lg`}>
              <h4 className={`font-semibold flex items-center space-x-2 mb-3 ${
                solutionScore >= 85 
                  ? 'text-green-800 dark:text-green-200'
                  : solutionScore >= 60
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : solutionScore >= 30
                  ? 'text-orange-800 dark:text-orange-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {solutionScore >= 85 ? (
                  <CheckCircle className="w-5 h-5" />
                ) : solutionScore >= 60 ? (
                  <AlertCircle className="w-5 h-5" />
                ) : solutionScore >= 30 ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span>
                  {solutionScore >= 85 ? '✅ Excellent Solution!' : 
                   solutionScore >= 60 ? '🟡 Good Progress' :
                   solutionScore >= 30 ? '🟠 Needs Improvement' :
                   '🔴 Incorrect Solution'}
                </span>
              </h4>
              
              <div className={`text-sm mb-3 ${
                solutionScore >= 85 
                  ? 'text-green-700 dark:text-green-300'
                  : solutionScore >= 60
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : solutionScore >= 30
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium">Solution Score:</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          solutionScore >= 85 ? 'bg-green-600' :
                          solutionScore >= 60 ? 'bg-yellow-600' :
                          solutionScore >= 30 ? 'bg-orange-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${solutionScore}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold">{solutionScore}/100</span>
                  </div>
                </div>
              </div>
              
              <div className={`text-sm whitespace-pre-wrap mb-4 ${
                solutionScore >= 85 
                  ? 'text-green-700 dark:text-green-300'
                  : solutionScore >= 60
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : solutionScore >= 30
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {solutionFeedback.replace(/\\n/g, '\n')}
              </div>

              {/* Hints for Wrong/Partial Solutions */}
              {solutionScore < 85 && solutionHints.length > 0 && (
                <div className="border-t pt-3 mt-3 border-gray-200 dark:border-gray-600">
                  <h5 className={`font-medium mb-2 flex items-center space-x-1 ${
                    solutionScore >= 60 ? 'text-yellow-800 dark:text-yellow-200' : 
                    solutionScore >= 30 ? 'text-orange-800 dark:text-orange-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    <Lightbulb className="w-4 h-4" />
                    <span>Helpful Hints:</span>
                  </h5>
                  <ul className="space-y-1">
                    {solutionHints.map((hint, index) => (
                      <li key={index} className={`text-sm flex items-start space-x-2 ${
                        solutionScore >= 60 ? 'text-yellow-700 dark:text-yellow-300' : 
                        solutionScore >= 30 ? 'text-orange-700 dark:text-orange-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        <span className="font-bold mt-0.5">•</span>
                        <span className="whitespace-pre-wrap">{hint.replace(/\\n/g, '\n')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Enhanced Detailed Analysis Section */}
              {(lineByLineAnalysis.length > 0 || codeQualityMetrics || performanceAnalysis || edgeCaseAnalysis || interviewFeedback) && (
                <div className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-600">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Terminal className="w-5 h-5" />
                    <span>Detailed Code Analysis</span>
                  </h5>
                  
                  {/* Analysis Tabs */}
                  <div className="space-y-4">
                    
                    {/* Line-by-Line Analysis */}
                    {lineByLineAnalysis.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h6 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <span className="text-blue-600">📝</span>
                          <span>Line-by-Line Code Review</span>
                        </h6>
                        <div className="space-y-3">
                          {lineByLineAnalysis.map((analysis, index) => (
                            <div key={index} className={`border-l-4 pl-4 py-2 ${
                              analysis.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                              analysis.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                              'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            }`}>
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                  Line {analysis.line}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  analysis.severity === 'high' ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' :
                                  analysis.severity === 'medium' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
                                  'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                                }`}>
                                  {analysis.severity.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded mb-2">
                                {analysis.code}
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                <strong>Issue:</strong> {analysis.issue}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Suggestion:</strong> {analysis.suggestion}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Code Quality Metrics */}
                    {codeQualityMetrics && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h6 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <span className="text-green-600">📊</span>
                          <span>Code Quality Metrics</span>
                        </h6>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-white dark:bg-gray-700 p-3 rounded">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Cyclomatic Complexity</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {codeQualityMetrics.cyclomaticComplexity}
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Maintainability Index</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {codeQualityMetrics.maintainabilityIndex}/100
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Duplicated Lines</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {codeQualityMetrics.duplicatedLines}
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Naming Score</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {codeQualityMetrics.namingConventions}
                            </div>
                          </div>
                        </div>
                        {codeQualityMetrics.codeSmells.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code Smells Detected:</div>
                            <div className="flex flex-wrap gap-2">
                              {codeQualityMetrics.codeSmells.map((smell, index) => (
                                <span key={index} className="text-xs bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200 px-2 py-1 rounded-full">
                                  {smell}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Performance Analysis */}
                    {performanceAnalysis && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h6 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <span className="text-purple-600">⚡</span>
                          <span>Performance Analysis</span>
                        </h6>
                        <div className="space-y-3">
                          {performanceAnalysis.bottlenecks.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Performance Bottlenecks:</div>
                              <ul className="space-y-1">
                                {performanceAnalysis.bottlenecks.map((bottleneck, index) => (
                                  <li key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start space-x-2">
                                    <span className="font-bold mt-0.5">⚠️</span>
                                    <span>{bottleneck}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {performanceAnalysis.optimizationOpportunities.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Optimization Opportunities:</div>
                              <ul className="space-y-1">
                                {performanceAnalysis.optimizationOpportunities.map((opportunity, index) => (
                                  <li key={index} className="text-sm text-blue-600 dark:text-blue-400 flex items-start space-x-2">
                                    <span className="font-bold mt-0.5">💡</span>
                                    <span>{opportunity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-700 p-3 rounded">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Memory Usage</div>
                              <div className="text-sm text-gray-900 dark:text-white">{performanceAnalysis.memoryUsage}</div>
                            </div>
                            <div className="bg-white dark:bg-gray-700 p-3 rounded">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Runtime Prediction</div>
                              <div className="text-sm text-gray-900 dark:text-white">{performanceAnalysis.runtimePrediction}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Edge Case Analysis */}
                    {edgeCaseAnalysis && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h6 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <span className="text-orange-600">🎯</span>
                          <span>Edge Case Analysis</span>
                        </h6>
                        <div className="space-y-3">
                          {edgeCaseAnalysis.coveredCases.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">✅ Covered Cases:</div>
                              <ul className="space-y-1">
                                {edgeCaseAnalysis.coveredCases.map((case_, index) => (
                                  <li key={index} className="text-sm text-green-600 dark:text-green-400 flex items-start space-x-2">
                                    <span className="font-bold mt-0.5">•</span>
                                    <span>{case_}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {edgeCaseAnalysis.missedCases.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">❌ Missed Cases:</div>
                              <ul className="space-y-1">
                                {edgeCaseAnalysis.missedCases.map((case_, index) => (
                                  <li key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start space-x-2">
                                    <span className="font-bold mt-0.5">•</span>
                                    <span>{case_}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {edgeCaseAnalysis.testCaseRecommendations.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">💡 Recommended Test Cases:</div>
                              <ul className="space-y-1">
                                {edgeCaseAnalysis.testCaseRecommendations.map((recommendation, index) => (
                                  <li key={index} className="text-sm text-blue-600 dark:text-blue-400 flex items-start space-x-2">
                                    <span className="font-bold mt-0.5">•</span>
                                    <span>{recommendation}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interview Feedback */}
                    {interviewFeedback && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h6 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <span className="text-indigo-600">🎤</span>
                          <span>Technical Interview Feedback</span>
                        </h6>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {interviewFeedback.strengths.length > 0 && (
                              <div>
                                <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">💪 Strengths:</div>
                                <ul className="space-y-1">
                                  {interviewFeedback.strengths.map((strength, index) => (
                                    <li key={index} className="text-sm text-green-600 dark:text-green-400 flex items-start space-x-2">
                                      <span className="font-bold mt-0.5">+</span>
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {interviewFeedback.weaknesses.length > 0 && (
                              <div>
                                <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">🔧 Areas for Improvement:</div>
                                <ul className="space-y-1">
                                  {interviewFeedback.weaknesses.map((weakness, index) => (
                                    <li key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start space-x-2">
                                      <span className="font-bold mt-0.5">-</span>
                                      <span>{weakness}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          {interviewFeedback.nextSteps.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">📚 Next Steps:</div>
                              <ul className="space-y-1">
                                {interviewFeedback.nextSteps.map((step, index) => (
                                  <li key={index} className="text-sm text-blue-600 dark:text-blue-400 flex items-start space-x-2">
                                    <span className="font-bold mt-0.5">{index + 1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="bg-white dark:bg-gray-700 p-3 rounded">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Industry Readiness</div>
                            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                              {interviewFeedback.industryReadiness}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Evaluation Reasoning */}
                    {evaluationReasoning && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h6 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                          <span className="text-gray-600">🧠</span>
                          <span>Evaluation Reasoning</span>
                        </h6>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {evaluationReasoning}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Welcome Message */}
        {!currentChallenge && !isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center shadow-sm">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome to AI Gaming!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Challenge yourself with AI-generated programming problems. Test your skills, learn new concepts, 
              and compete for high scores. Each challenge is unique and tailored to help you grow as a developer.
            </p>
            <button
              onClick={generateNewChallenge}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold flex items-center space-x-2 mx-auto"
            >
              <Zap className="w-5 h-5" />
              <span>Start Your First Challenge</span>
            </button>
          </div>
        )}
      </div>
  );
};

export default Gaming;
