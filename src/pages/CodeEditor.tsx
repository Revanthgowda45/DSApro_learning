import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Terminal, Save, FileText, Settings, Maximize, Minimize, Download, Copy, CheckCircle, XCircle, Sun, Moon, Monitor } from 'lucide-react';
import PistonService, { ExecutionResult } from '../services/pistonService';
import CodeEditor from '../components/ui/CodeEditor';
import LanguageSelector from '../components/ui/LanguageSelector';
import DSALogo from '../components/ui/DSALogo';
import { useAuth } from '../context/AuthContext';

const CodeEditorPage: React.FC = () => {
  const { user } = useAuth();
  const [userCode, setUserCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [codeOutput, setCodeOutput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'console' | 'settings'>('console');
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<string>('');
  const [savedFiles, setSavedFiles] = useState<Array<{id: string, name: string, language: string, code: string, timestamp: Date}>>([]);
  const [currentFileName, setCurrentFileName] = useState('untitled');
  const [isAutoSave, setIsAutoSave] = useState(true);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    // Check localStorage or default to system
    const saved = localStorage.getItem('codeEditorTheme');
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved as 'light' | 'dark' | 'system';
    }
    return 'system';
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  // Programming language options organized by categories
  const languageCategories = {
    'Core Languages': [
      { value: 'c++', label: 'C++', defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
      { value: 'java', label: 'Java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
      { value: 'python', label: 'Python', defaultCode: 'print("Hello, World!")' },
      { value: 'python3', label: 'Python3', defaultCode: 'print("Hello, World!")' },
      { value: 'c', label: 'C', defaultCode: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}' },
      { value: 'csharp', label: 'C#', defaultCode: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}' },
      { value: 'javascript', label: 'JavaScript', defaultCode: 'console.log("Hello, World!");' },
      { value: 'typescript', label: 'TypeScript', defaultCode: 'console.log("Hello, World!");' }
    ],
    'Modern Languages': [
      { value: 'php', label: 'PHP', defaultCode: '<?php\necho "Hello, World!";\n?>' },
      { value: 'swift', label: 'Swift', defaultCode: 'print("Hello, World!")' },
      { value: 'kotlin', label: 'Kotlin', defaultCode: 'fun main() {\n    println("Hello, World!")\n}' },
      { value: 'dart', label: 'Dart', defaultCode: 'void main() {\n    print("Hello, World!");\n}' },
      { value: 'go', label: 'Go', defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}' },
      { value: 'ruby', label: 'Ruby', defaultCode: 'puts "Hello, World!"' },
      { value: 'scala', label: 'Scala', defaultCode: 'object Main extends App {\n    println("Hello, World!")\n}' },
      { value: 'rust', label: 'Rust', defaultCode: 'fn main() {\n    println!("Hello, World!");\n}' }
    ],
    'Functional & Others': [
      { value: 'racket', label: 'Racket', defaultCode: '#lang racket\n(displayln "Hello, World!")' },
      { value: 'erlang', label: 'Erlang', defaultCode: '-module(hello).\n-export([start/0]).\n\nstart() ->\n    io:format("Hello, World!~n").' },
      { value: 'elixir', label: 'Elixir', defaultCode: 'IO.puts("Hello, World!")' },
      { value: 'haskell', label: 'Haskell', defaultCode: 'main = putStrLn "Hello, World!"' },
      { value: 'clojure', label: 'Clojure', defaultCode: '(println "Hello, World!")' },
      { value: 'julia', label: 'Julia', defaultCode: 'println("Hello, World!")' },
      { value: 'rscript', label: 'R', defaultCode: 'print("Hello, World!")' },
      { value: 'lua', label: 'Lua', defaultCode: 'print("Hello, World!")' }
    ]
  };

  // Flatten all languages for compatibility
  const programmingLanguages = Object.values(languageCategories).flat();

  // Load saved files from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('codeEditorFiles');
    if (saved) {
      try {
        const files = JSON.parse(saved);
        setSavedFiles(files);
      } catch (error) {
        console.error('Error loading saved files:', error);
      }
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (isAutoSave && userCode.trim() && currentFileName) {
      const timer = setTimeout(() => {
        saveCurrentFile();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [userCode, isAutoSave, currentFileName]);

  // Theme management (only for non-logged-in users)
  useEffect(() => {
    // If user is logged in, don't manage theme locally - use main app theme
    if (user) return;

    const updateTheme = () => {
      let shouldBeDark = false;
      
      if (themeMode === 'dark') {
        shouldBeDark = true;
      } else if (themeMode === 'light') {
        shouldBeDark = false;
      } else { // system
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      setIsDarkMode(shouldBeDark);
      
      // Apply theme to document
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();
    
    // Listen for system theme changes when in system mode
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [themeMode, user]);

  // Save theme preference (only for non-logged-in users)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('codeEditorTheme', themeMode);
    }
  }, [themeMode, user]);

  const cycleTheme = () => {
    setThemeMode(current => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      return 'light';
    });
  };

  // Handle keyboard shortcuts from Monaco Editor
  useEffect(() => {
    const handleEditorSave = () => {
      saveCurrentFile();
    };

    const handleEditorFullscreen = () => {
      toggleFullscreen();
    };

    window.addEventListener('editorSave', handleEditorSave as EventListener);
    window.addEventListener('editorFullscreen', handleEditorFullscreen);

    return () => {
      window.removeEventListener('editorSave', handleEditorSave as EventListener);
      window.removeEventListener('editorFullscreen', handleEditorFullscreen);
    };
  }, []);

  // Initialize default code when language changes
  useEffect(() => {
    const language = programmingLanguages.find(lang => lang.value === selectedLanguage);
    if (language && !userCode.trim()) {
      setUserCode(language.defaultCode);
    }
  }, [selectedLanguage]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    const langConfig = programmingLanguages.find(lang => lang.value === language);
    if (langConfig) {
      setUserCode(langConfig.defaultCode);
      setCurrentFileName(`untitled.${getFileExtension(language)}`);
    }
    // Clear previous output
    setCodeOutput('');
    setCodeError('');
  };

  const getFileExtension = (language: string): string => {
    const extensions: { [key: string]: string } = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      go: 'go'
    };
    return extensions[language] || 'txt';
  };

  const runCode = async () => {
    if (!userCode.trim()) {
      setCodeError('Please write some code before running.');
      return;
    }

    setIsRunning(true);
    setCodeOutput('');
    setCodeError('');
    const startTime = Date.now();

    try {
      const result: ExecutionResult = await PistonService.executeCode(selectedLanguage, userCode);
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      
      if (result.success) {
        setCodeOutput(result.output || 'Program executed successfully (no output)');
        setMemoryUsage('N/A'); // Memory usage not available in current ExecutionResult type
      } else {
        setCodeError(result.error || 'Unknown execution error');
      }
    } catch (error) {
      setCodeError(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearCode = () => {
    const language = programmingLanguages.find(lang => lang.value === selectedLanguage);
    setUserCode(language?.defaultCode || '');
    setCodeOutput('');
    setCodeError('');
    setCurrentFileName(`untitled.${getFileExtension(selectedLanguage)}`);
  };

  const saveCurrentFile = () => {
    if (!userCode.trim()) return;

    const newFile = {
      id: Date.now().toString(),
      name: currentFileName,
      language: selectedLanguage,
      code: userCode,
      timestamp: new Date()
    };

    const updatedFiles = [newFile, ...savedFiles.slice(0, 9)]; // Keep only 10 most recent files
    setSavedFiles(updatedFiles);
    localStorage.setItem('codeEditorFiles', JSON.stringify(updatedFiles));
  };

  const loadFile = (file: typeof savedFiles[0]) => {
    console.log('Loading file:', file.name, 'with code length:', file.code.length);
    setUserCode(file.code);
    setSelectedLanguage(file.language);
    setCurrentFileName(file.name);
    setCodeOutput('');
    setCodeError('');
    
    // Force Monaco Editor to refresh by triggering a small delay
    setTimeout(() => {
      setUserCode(file.code);
    }, 10);
  };

  const downloadCode = () => {
    const blob = new Blob([userCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(userCode);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 touch-manipulation">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-6 py-3 sm:py-4 shadow-sm">
        {/* Mobile Header Layout */}
        <div className="flex flex-col space-y-3 sm:hidden">
          {/* Top Row - Title and Main Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                {!user ? <DSALogo size="sm" clickable={true} /> : <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Code Editor</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Professional IDE Experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={runCode}
                disabled={isRunning}
                className="px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md font-medium"
              >
                {isRunning ? (
                  <Pause className="w-4 h-4 animate-pulse" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span className="hidden xs:inline">{isRunning ? 'Running...' : 'Run'}</span>
              </button>
              {!user && (
                <button
                  onClick={cycleTheme}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md"
                  title={`Theme: ${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)} (Click to cycle)`}
                >
                  {themeMode === 'light' ? <Sun className="w-4 h-4" /> : 
                   themeMode === 'dark' ? <Moon className="w-4 h-4" /> : 
                   <Monitor className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={toggleFullscreen}
                className="px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Second Row - File Controls */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={currentFileName}
              onChange={(e) => setCurrentFileName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-0 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="File name"
            />
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
              languageCategories={languageCategories}
              className="min-w-[120px]"
            />
          </div>
          
          {/* Third Row - Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <button
                onClick={saveCurrentFile}
                className="px-3 py-2 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-1 shadow-sm hover:shadow-md font-medium"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
              <button
                onClick={clearCode}
                className="px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center space-x-1 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center space-x-1 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
              <button
                onClick={downloadCode}
                className="px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center space-x-1 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Header Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                {!user ? <DSALogo size="md" clickable={true} /> : <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Code Editor</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Professional IDE Experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={currentFileName}
                onChange={(e) => setCurrentFileName(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-0 w-32 lg:w-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="File name"
              />
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                languageCategories={languageCategories}
                className="min-w-[140px]"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center space-x-2 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md font-medium"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            <button
              onClick={downloadCode}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center space-x-2 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={saveCurrentFile}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={clearCode}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center space-x-2 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={runCode}
              disabled={isRunning}
              className="px-6 py-2 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg font-semibold"
            >
              {isRunning ? (
                <Pause className="w-4 h-4 animate-pulse" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
            {!user && (
              <button
                onClick={cycleTheme}
                className="px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md"
                title={`Theme: ${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)} (Click to cycle)`}
              >
                {themeMode === 'light' ? <Sun className="w-4 h-4" /> : 
                 themeMode === 'dark' ? <Moon className="w-4 h-4" /> : 
                 <Monitor className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] sm:h-[calc(100vh-81px)] bg-gray-50 dark:bg-gray-900">
        {/* Code Editor - Left Side */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 min-h-0 shadow-sm">
          <div className="flex-1 p-3 sm:p-6 min-h-0">
            <div className="h-full border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col shadow-lg bg-white dark:bg-gray-900">
              {/* Monaco Editor */}
              <div className="flex-1 min-h-0">
                <CodeEditor
                  value={userCode}
                  onChange={setUserCode}
                  language={selectedLanguage}
                  isRunning={isRunning}
                  isDisabled={false}
                  height="100%"
                  theme="vs-dark"
                  minimal={true}
                />
              </div>
              
              {/* Professional Status Bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 text-xs text-gray-300 flex-shrink-0">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium">Lines: {userCode.split('\n').length}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="font-medium">Characters: {userCode.length}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="capitalize font-medium text-blue-400">{selectedLanguage}</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-green-400 font-medium">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Output Console - Right Side */}
        <div className="w-full lg:w-96 h-64 lg:h-full border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 min-h-0 shadow-sm">
          {/* Professional Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex-shrink-0">
            <button
              onClick={() => setActiveOutputTab('console')}
              className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center space-x-1 sm:space-x-2 transition-all duration-200 min-h-[44px] ${
                activeOutputTab === 'console'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-b-2 border-blue-500 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Terminal className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Console</span>
              {(codeOutput || codeError) && (
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${codeError ? 'bg-red-500' : 'bg-green-500'}`}></div>
              )}
            </button>
            <button
              onClick={() => setActiveOutputTab('settings')}
              className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center space-x-1 sm:space-x-2 transition-all duration-200 min-h-[44px] ${
                activeOutputTab === 'settings'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-b-2 border-purple-500 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Files</span>
              {savedFiles.length > 0 && (
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></div>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Console Tab */}
            {activeOutputTab === 'console' && (
              <div className="h-full flex flex-col min-h-0">
                {(codeOutput || codeError) ? (
                  <div className="flex-1 p-2 sm:p-4 min-h-0">
                    {/* Professional Terminal Output */}
                    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-sm border border-gray-700 h-full flex flex-col min-h-0">
                      {/* Terminal Header */}
                      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="flex items-center space-x-0.5 sm:space-x-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></div>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500"></div>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></div>
                          </div>
                          <span className="text-xs text-gray-300 font-medium">
                            {codeError ? 'Error' : 'Output'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${codeError ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          <span className="text-xs text-gray-400">
                            {codeError ? 'Failed' : `${executionTime}ms`}
                          </span>
                        </div>
                      </div>

                      {/* Terminal Content */}
                      <div className="flex-1 p-2 sm:p-3 bg-gray-900 font-mono text-xs overflow-y-auto min-h-0">
                        {codeError ? (
                          <div className="space-y-2">
                            <div className="text-red-400 font-semibold flex items-center space-x-2">
                              <XCircle className="w-4 h-4" />
                              <span>EXECUTION FAILED</span>
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
                              <span>EXECUTION SUCCESSFUL</span>
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
                              {executionTime > 0 && (
                                <div className="mt-3 text-xs text-gray-400">
                                  <div>Execution Time: {executionTime}ms</div>
                                  {memoryUsage && <div>Memory Usage: {memoryUsage}</div>}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <Terminal className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">Run your code to see output here</p>
                      <p className="text-xs mt-1">Click "Run" to execute your code</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Files Tab */}
            {activeOutputTab === 'settings' && (
              <div className="h-full flex flex-col min-h-0">
                <div className="p-2 sm:p-4 overflow-y-auto">
                  {/* Auto-save toggle */}
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Auto-save</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Automatically save changes</div>
                      </div>
                      <button
                        onClick={() => setIsAutoSave(!isAutoSave)}
                        className={`relative inline-flex h-4 w-7 sm:h-5 sm:w-9 items-center rounded-full transition-colors flex-shrink-0 ml-2 ${
                          isAutoSave ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 transform rounded-full bg-white transition-transform ${
                            isAutoSave ? 'translate-x-3.5 sm:translate-x-5' : 'translate-x-0.5 sm:translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Saved Files */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">Recent Files</h3>
                    {savedFiles.length > 0 ? (
                      <div className="space-y-1.5 sm:space-y-2">
                        {savedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
                            onClick={() => loadFile(file)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {file.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {file.language} • {new Date(file.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0">
                                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-4 sm:py-8">
                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs sm:text-sm">No saved files yet</p>
                        <p className="text-xs mt-1">Save your code to see it here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorPage;
