import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Terminal, Save, FileText, Settings, Maximize, Minimize, Download, Copy, CheckCircle, XCircle, Sun, Moon, Monitor, Trash2, Edit3, Brain, Sparkles } from 'lucide-react';
import PistonService, { ExecutionResult } from '../services/pistonService';
import CodeEditor from '../components/ui/CodeEditor';
import LanguageSelector from '../components/ui/LanguageSelector';
import DSALogo from '../components/ui/DSALogo';
import StreamingTerminal from '../components/ui/StreamingTerminal';
import { useAuth } from '../context/AuthContext';
import { codeFilesService, CodeFile } from '../services/codeFilesService';
import { HindsightService } from '../services/hindsightService';
import { GroqAIService } from '../services/groqAIService';

const CodeEditorPage: React.FC = () => {
  const { user } = useAuth();
  // Initialize state from localStorage or defaults
  const [userCode, setUserCode] = useState(() => {
    const saved = localStorage.getItem('codeEditor_currentCode');
    return saved || '';
  });
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const saved = localStorage.getItem('codeEditor_currentLanguage');
    return saved || 'javascript';
  });
  const [currentFileName, setCurrentFileName] = useState(() => {
    const saved = localStorage.getItem('codeEditor_currentFileName');
    return saved || 'untitled';
  });
  const [currentFileId, setCurrentFileId] = useState<string | null>(() => {
    const saved = localStorage.getItem('codeEditor_currentFileId');
    return saved || null;
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [codeOutput, setCodeOutput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'console' | 'settings'>('console');
  const [useStreamingTerminal, setUseStreamingTerminal] = useState(true);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<Array<{type: 'output' | 'input', content: string}>>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<string>('');
  const [savedFiles, setSavedFiles] = useState<CodeFile[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [aiDebugHint, setAiDebugHint] = useState<string>('');
  const [isDetectingHint, setIsDetectingHint] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('codeEditorTheme');
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved as 'light' | 'dark' | 'system';
    }
    return 'system';
  });


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
      { value: 'erlang', label: 'Erlang', defaultCode: '#!/usr/bin/env escript\nmain(_) ->\n    io:format("Hello, World!~n").' },
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

  // Load saved files from Supabase or localStorage
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files = await codeFilesService.getFiles(user?.id);
        setSavedFiles(files);
      } catch (error) {
        console.error('Error loading saved files:', error);
      }
    };
    
    loadFiles();
  }, [user]);

  // Sync local files to Supabase when user logs in
  useEffect(() => {
    if (user?.id) {
      codeFilesService.syncLocalToSupabase(user.id).catch(error => {
        console.error('Error syncing local files to Supabase:', error);
      });
    }
  }, [user?.id]);

  // Track unsaved changes
  useEffect(() => {
    if (userCode.trim()) {
      setSaveStatus('unsaved');
    }
  }, [userCode, selectedLanguage, currentFileName]);

  // Auto-save for existing files only (debounced - waits for user to stop typing)
  useEffect(() => {
    if (currentFileId && saveStatus === 'unsaved' && userCode.trim()) {
      const timer = setTimeout(() => {
        // Only auto-save if file exists in savedFiles
        const fileExists = savedFiles.some(file => file.id === currentFileId);
        if (fileExists) {
          silentAutoSave();
        }
      }, 3000); // Auto-save after 3 seconds of no typing activity

      return () => clearTimeout(timer);
    }
  }, [userCode, currentFileId, saveStatus, savedFiles]);

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

  // Save current editor state to localStorage
  useEffect(() => {
    localStorage.setItem('codeEditor_currentCode', userCode);
  }, [userCode]);

  useEffect(() => {
    localStorage.setItem('codeEditor_currentLanguage', selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem('codeEditor_currentFileName', currentFileName);
  }, [currentFileName]);

  useEffect(() => {
    if (currentFileId) {
      localStorage.setItem('codeEditor_currentFileId', currentFileId);
    } else {
      localStorage.removeItem('codeEditor_currentFileId');
    }
  }, [currentFileId]);

  // Initialize default code when language changes (only if no saved code)
  useEffect(() => {
    const language = programmingLanguages.find(lang => lang.value === selectedLanguage);
    if (language && !userCode.trim()) {
      setUserCode(language.defaultCode);
    }
  }, [selectedLanguage]);

  const handleLanguageChange = (language: string) => {
    const langConfig = programmingLanguages.find(lang => lang.value === language);
    if (langConfig) {
      // Always set the default code for the new language
      setUserCode(langConfig.defaultCode);
      
      // Update filename extension
      if (currentFileName.startsWith('untitled')) {
        setCurrentFileName(`untitled.${getFileExtension(language)}`);
      }
    }
    
    setSelectedLanguage(language);
    // Clear previous output
    setCodeOutput('');
    setCodeError('');
    setSaveStatus('unsaved');
    setCurrentFileId(null); // Reset file ID for new language
  };

  const getFileExtension = (language: string): string => {
    const extensions: { [key: string]: string } = {
      // Core Languages
      javascript: 'js',
      python: 'py',
      python3: 'py',
      java: 'java',
      cpp: 'cpp',
      'c++': 'cpp',
      c: 'c',
      csharp: 'cs',
      'c#': 'cs',
      typescript: 'ts',
      
      // Modern Languages
      php: 'php',
      swift: 'swift',
      kotlin: 'kt',
      dart: 'dart',
      go: 'go',
      ruby: 'rb',
      scala: 'scala',
      rust: 'rs',
      
      // Functional & Others
      racket: 'rkt',
      erlang: 'erl',
      elixir: 'exs',
      haskell: 'hs',
      clojure: 'clj',
      julia: 'jl',
      rscript: 'R',
      r: 'R',
      lua: 'lua'
    };
    return extensions[language] || 'txt';
  };

  const runCode = async () => {
    if (!userCode.trim()) {
      setCodeError('Please write some code before running.');
      return;
    }

    // Check if code likely requires interactive input
    const requiresInput = userCode.includes('cin') || userCode.includes('scanf') || 
                         userCode.includes('input(') || userCode.includes('Scanner') ||
                         userCode.includes('readline') || userCode.includes('gets');

    if (requiresInput && !userInput.trim()) {
      setInteractiveMode(true);
      setTerminalHistory([
        { type: 'output', content: '🔄 Interactive mode detected. Program is waiting for input...' },
        { type: 'output', content: 'Please provide input below and press Enter to continue.' }
      ]);
      setIsRunning(true);
      return;
    }

    setIsRunning(true);
    setCodeOutput('');
    setCodeError('');
    setAiDebugHint('');
    setInteractiveMode(false);
    setTerminalHistory([]);
    const startTime = Date.now();

    try {
      // Format input for different languages
      let formattedInput = userInput;
      if (userInput) {
        const lang = selectedLanguage.toLowerCase();
        // Languages that expect newline-separated inputs
        if (['java', 'cpp', 'c++', 'c', 'python', 'python3', 'csharp', 'c#', 'go', 'rust', 'kotlin', 'swift', 'dart', 'scala'].includes(lang)) {
          // Convert space-separated inputs to newline-separated
          formattedInput = userInput.trim().replace(/\s+/g, '\n');
        }
      }
      
      const result: ExecutionResult = await PistonService.executeCode(selectedLanguage, userCode, formattedInput);
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      
      if (result.success) {
        setCodeOutput(result.output || 'Program executed successfully (no output)');
        setMemoryUsage('N/A');
      } else {
        setCodeError(result.error || 'Unknown execution error');
      }
    } catch (error) {
      setCodeError(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleInteractiveInput = async (input: string) => {
    if (!input.trim()) return;

    // Add user input to history
    setTerminalHistory(prev => [...prev, { type: 'input', content: `> ${input}` }]);
    setCurrentInput('');

    // Execute with the provided input
    setTerminalHistory(prev => [...prev, { type: 'output', content: '⚡ Executing with your input...' }]);
    
    const startTime = Date.now();
    setAiDebugHint('');
    
    try {
      // Format input for different languages
      let formattedInput = input;
      if (input) {
        const lang = selectedLanguage.toLowerCase();
        // Languages that expect newline-separated inputs
        if (['java', 'cpp', 'c++', 'c', 'python', 'python3', 'csharp', 'c#', 'go', 'rust', 'kotlin', 'swift', 'dart', 'scala'].includes(lang)) {
          // Convert space-separated inputs to newline-separated
          formattedInput = input.trim().replace(/\s+/g, '\n');
        }
      }
      
      const result: ExecutionResult = await PistonService.executeCode(selectedLanguage, userCode, formattedInput);
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      
      if (result.success) {
        setTerminalHistory(prev => [...prev, { type: 'output', content: result.output || 'Program executed successfully (no output)' }]);
        setCodeOutput(result.output || 'Program executed successfully (no output)');
      } else {
        setTerminalHistory(prev => [...prev, { type: 'output', content: `❌ Error: ${result.error || 'Unknown execution error'}` }]);
        setCodeError(result.error || 'Unknown execution error');
      }
    } catch (error) {
      const errorMsg = `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setTerminalHistory(prev => [...prev, { type: 'output', content: `❌ ${errorMsg}` }]);
      setCodeError(errorMsg);
    } finally {
      setIsRunning(false);
      setInteractiveMode(false);
    }
  };

  const clearCode = () => {
    const language = programmingLanguages.find(lang => lang.value === selectedLanguage);
    setUserCode(language?.defaultCode || '');
    setCodeOutput('');
    setCodeError('');
    setAiDebugHint('');
    setCurrentFileName(`untitled.${getFileExtension(selectedLanguage)}`);
    setSaveStatus('unsaved');
    setCurrentFileId(null); // Reset file ID when clearing
  };

  const getDebugHint = async () => {
    if (!user?.id || !codeError || !userCode) return;
    
    setIsDetectingHint(true);
    try {
      // 1. Remember this code attempt mistake in Hindsight
      await HindsightService.retainCodeAttempt(user.id, currentFileName || 'unknown-problem', selectedLanguage, 'Debugging', false);
      
      // 2. Recall user's learning context for personalized hint
      const context = await HindsightService.reflectOnLearning(user.id);
      
      // 3. Generate hint
      const hint = await GroqAIService.generateDebugHint(codeError, userCode, context);
      setAiDebugHint(hint);
    } catch (err) {
      console.error('Debug hint failed:', err);
      setAiDebugHint("I couldn't analyze the error right now. Make sure your context is clear and check the stack trace!");
    } finally {
      setIsDetectingHint(false);
    }
  };

  // Silent auto-save function (no visual feedback)
  const silentAutoSave = async () => {
    if (!userCode.trim()) return;

    try {
      // Check if file with same name already exists
      const existingFileIndex = savedFiles.findIndex(file => file.name === currentFileName);
      
      const fileId = existingFileIndex >= 0 ? savedFiles[existingFileIndex].id : Date.now().toString();
      const fileData: CodeFile = {
        id: fileId,
        name: currentFileName,
        language: selectedLanguage,
        code: userCode,
        timestamp: new Date()
      };

      // Save to Supabase/localStorage via service
      await codeFilesService.saveFile(fileData, user?.id);
      
      // Update local state
      let updatedFiles;
      if (existingFileIndex >= 0) {
        // Update existing file
        updatedFiles = [...savedFiles];
        updatedFiles[existingFileIndex] = fileData;
        // Move updated file to top
        updatedFiles = [fileData, ...updatedFiles.filter((_, index) => index !== existingFileIndex)];
      } else {
        // Create new file
        updatedFiles = [fileData, ...savedFiles.slice(0, 9)]; // Keep only 10 most recent files
      }

      setSavedFiles(updatedFiles);
      
      // Silent save - no visual feedback, just mark as saved
      setSaveStatus('saved');
      
    } catch (error) {
      console.error('Silent auto-save failed:', error);
    }
  };

  // Manual save function (with visual feedback)
  const saveCurrentFile = async () => {
    if (!userCode.trim()) {
      alert('Cannot save empty code!');
      return;
    }

    setSaveStatus('saving');

    try {
      // Check if file with same name already exists
      const existingFileIndex = savedFiles.findIndex(file => file.name === currentFileName);
      
      const fileId = existingFileIndex >= 0 ? savedFiles[existingFileIndex].id : Date.now().toString();
      const fileData: CodeFile = {
        id: fileId,
        name: currentFileName,
        language: selectedLanguage,
        code: userCode,
        timestamp: new Date()
      };

      // Set current file ID for auto-save tracking
      setCurrentFileId(fileId);

      // Save to Supabase/localStorage via service
      await codeFilesService.saveFile(fileData, user?.id);
      
      // Update local state
      let updatedFiles;
      if (existingFileIndex >= 0) {
        // Update existing file
        updatedFiles = [...savedFiles];
        updatedFiles[existingFileIndex] = fileData;
        // Move updated file to top
        updatedFiles = [fileData, ...updatedFiles.filter((_, index) => index !== existingFileIndex)];
      } else {
        // Create new file
        updatedFiles = [fileData, ...savedFiles.slice(0, 9)]; // Keep only 10 most recent files
      }

      setSavedFiles(updatedFiles);
      
      setSaveStatus('saved');
      
      // Show success feedback briefly for manual saves only
      setTimeout(() => {
        setSaveStatus('unsaved');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Failed to save file!');
      setSaveStatus('unsaved');
    }
  };

  const loadFile = (file: typeof savedFiles[0]) => {
    console.log('Loading file:', file.name, 'with code length:', file.code.length);
    setUserCode(file.code);
    setSelectedLanguage(file.language);
    setCurrentFileName(file.name);
    setCurrentFileId(file.id); // Set file ID for auto-save tracking
    setCodeOutput('');
    setCodeError('');
    setSaveStatus('saved');
    
    // Force Monaco Editor to refresh by triggering a small delay
    setTimeout(() => {
      setUserCode(file.code);
    }, 10);
  };

  const deleteFile = async (fileId: string, fileName: string) => {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      try {
        // Delete from Supabase/localStorage via service
        await codeFilesService.deleteFile(fileId, user?.id);
        
        // Update local state
        const updatedFiles = savedFiles.filter(file => file.id !== fileId);
        setSavedFiles(updatedFiles);
        
        // If deleted file was the current file, reset current file ID
        if (currentFileId === fileId) {
          setCurrentFileId(null);
          localStorage.removeItem('codeEditor_currentFileId');
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file!');
      }
    }
  };

  const renameFile = async (fileId: string, oldName: string) => {
    const newName = prompt('Enter new filename:', oldName);
    if (newName && newName.trim() && newName !== oldName) {
      try {
        // Find the file to rename
        const fileToRename = savedFiles.find(file => file.id === fileId);
        if (!fileToRename) return;
        
        // Create updated file data
        const updatedFileData: CodeFile = {
          ...fileToRename,
          name: newName.trim(),
          timestamp: new Date()
        };
        
        // Save updated file to Supabase/localStorage via service
        await codeFilesService.saveFile(updatedFileData, user?.id);
        
        // Update local state
        const updatedFiles = savedFiles.map(file => 
          file.id === fileId 
            ? updatedFileData
            : file
        );
        setSavedFiles(updatedFiles);
        
        // If renamed file is the current file, update current filename
        if (currentFileId === fileId) {
          setCurrentFileName(newName.trim());
        }
      } catch (error) {
        console.error('Error renaming file:', error);
        alert('Failed to rename file!');
      }
    }
  };

  const clearAllFiles = async () => {
    if (confirm(`Are you sure you want to delete all ${savedFiles.length} saved files? This action cannot be undone.`)) {
      try {
        // Clear all files from Supabase/localStorage via service
        await codeFilesService.clearAllFiles(user?.id);
        
        // Update local state
        setSavedFiles([]);
        
        // Reset current file ID since all files are deleted
        setCurrentFileId(null);
        localStorage.removeItem('codeEditor_currentFileId');
      } catch (error) {
        console.error('Error clearing all files:', error);
        alert('Failed to clear all files!');
      }
    }
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
                disabled={saveStatus === 'saving'}
                className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center space-x-1 shadow-sm hover:shadow-md font-medium ${
                  saveStatus === 'saved' 
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                    : saveStatus === 'saving'
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                <span>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
                </span>
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
              disabled={saveStatus === 'saving'}
              className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md font-medium ${
                saveStatus === 'saved' 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                  : saveStatus === 'saving'
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
              }`}
            >
              {saveStatus === 'saving' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
              </span>
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
        <div className="w-full lg:w-96 h-80 lg:h-full border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 min-h-0 shadow-sm">
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
                {/* Terminal Mode Toggle */}
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Mode
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs transition-colors ${!useStreamingTerminal ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        Traditional
                      </span>
                      <button
                        onClick={() => setUseStreamingTerminal(!useStreamingTerminal)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-800 ${
                          useStreamingTerminal
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all duration-200 ${
                            useStreamingTerminal ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`text-xs transition-colors ${useStreamingTerminal ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        Live
                      </span>
                    </div>
                  </div>
                  
                  {/* Traditional Input Section - Only show when not using streaming terminal */}
                  {!useStreamingTerminal && (
                    <div className="space-y-1 mt-2">
                      <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Enter input for your program here..."
                        className="w-full h-12 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono resize-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        💡 Separate multiple inputs with new lines or spaces
                      </p>
                    </div>
                  )}
                  
                  {/* Live Terminal Info - Only show when using streaming terminal */}
                  {useStreamingTerminal && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      💬 Interactive mode - programs will prompt for input when needed
                    </p>
                  )}
                </div>
                
                {useStreamingTerminal ? (
                  <div className="flex-1 p-2 sm:p-4 min-h-0">
                    <StreamingTerminal
                      language={selectedLanguage}
                      code={userCode}
                      onExecutionStart={() => setIsRunning(true)}
                      onExecutionEnd={(result) => {
                        setIsRunning(false);
                        setExecutionTime(result.executionTime);
                      }}
                    />
                  </div>
                ) : (codeOutput || codeError || interactiveMode) ? (
                  <div className="flex-1 p-2 sm:p-4 min-h-0">
                    {/* Interactive Terminal or Professional Terminal Output */}
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
                            {interactiveMode ? 'Interactive Terminal' : codeError ? 'Error' : 'Output'}
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
                        {interactiveMode ? (
                          <div className="space-y-2">
                            {/* Terminal History */}
                            {terminalHistory.map((entry, index) => (
                              <div key={index} className={`flex text-xs ${entry.type === 'input' ? 'text-blue-300' : 'text-gray-100'}`}>
                                <span className={`mr-2 flex-shrink-0 ${entry.type === 'input' ? 'text-blue-400' : 'text-green-400'}`}>
                                  {entry.type === 'input' ? '▶' : '●'}
                                </span>
                                <span className="break-all whitespace-pre-wrap">{entry.content}</span>
                              </div>
                            ))}
                            
                            {/* Interactive Input Line */}
                            {isRunning && (
                              <div className="flex items-center space-x-2 mt-4 p-2 bg-gray-800 rounded border border-gray-600">
                                <span className="text-yellow-400 flex-shrink-0">▶</span>
                                <input
                                  type="text"
                                  value={currentInput}
                                  onChange={(e) => setCurrentInput(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleInteractiveInput(currentInput);
                                    }
                                  }}
                                  placeholder="Enter your input and press Enter..."
                                  className="flex-1 bg-transparent text-white text-xs outline-none placeholder-gray-400"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleInteractiveInput(currentInput)}
                                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                >
                                  Send
                                </button>
                              </div>
                            )}
                          </div>
                        ) : codeError ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="text-red-400 font-semibold flex items-center space-x-2">
                                <XCircle className="w-4 h-4" />
                                <span>EXECUTION FAILED</span>
                              </div>
                              <div className="text-red-300 whitespace-pre-wrap leading-relaxed border-l-2 border-red-500/50 pl-3">
                                {codeError.split('\n').map((line, index) => (
                                  <div key={index} className="flex text-xs">
                                    <span className="break-all">{line}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* AI Mentor Debugging Help block */}
                            {user && HindsightService.isConfigured() && GroqAIService.isConfigured() && (
                              <div className="mt-4 p-3 bg-indigo-900/30 border border-indigo-500/30 rounded-lg">
                                {!aiDebugHint && !isDetectingHint ? (
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-indigo-300">
                                      <Brain className="w-4 h-4" />
                                      <span className="text-xs font-medium">Stuck on this error?</span>
                                    </div>
                                    <button 
                                      onClick={getDebugHint}
                                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      Ask AI Mentor
                                    </button>
                                  </div>
                                ) : isDetectingHint ? (
                                  <div className="flex items-center gap-2 text-indigo-300 text-xs">
                                    <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                    Analyzing your code and past mistakes...
                                  </div>
                                ) : (
                                  <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
                                      <Brain className="w-3.5 h-3.5" />
                                      AI Mentor Suggestion
                                    </div>
                                    <div className="text-indigo-100 leading-relaxed pl-5 border-l-2 border-indigo-500/30">
                                      {aiDebugHint}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
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
                  {/* Manual Save Info */}
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">Manual Save Mode</div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">Click Save button to store code in localStorage</div>
                      </div>
                    </div>
                  </div>

                  {/* Streaming Terminal Toggle */}
                  <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Real-Time Terminal</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Enable live input/output streaming</div>
                      </div>
                      <button
                        onClick={() => setUseStreamingTerminal(!useStreamingTerminal)}
                        className={`relative inline-flex h-4 w-7 sm:h-5 sm:w-9 items-center rounded-full transition-colors flex-shrink-0 ml-2 ${
                          useStreamingTerminal ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 transform rounded-full bg-white transition-transform ${
                            useStreamingTerminal ? 'translate-x-3.5 sm:translate-x-5' : 'translate-x-0.5 sm:translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Saved Files */}
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Recent Files</h3>
                      {savedFiles.length > 0 && (
                        <button
                          onClick={clearAllFiles}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete all files"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {savedFiles.length > 0 ? (
                      <div className="space-y-1.5 sm:space-y-2">
                        {savedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="group p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => loadFile(file)}
                              >
                                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {file.name}
                                  {currentFileId === file.id && (
                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(current)</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {file.language} • {new Date(file.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="ml-2 flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    renameFile(file.id, file.name);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  title="Rename file"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFile(file.id, file.name);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  title="Delete file"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
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
