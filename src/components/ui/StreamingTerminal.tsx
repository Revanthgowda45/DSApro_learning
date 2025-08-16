import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Play, Square, RotateCcw } from 'lucide-react';
import PistonService, { ExecutionResult } from '../../services/pistonService';

interface StreamingTerminalProps {
  language: string;
  code: string;
  onExecutionStart?: () => void;
  onExecutionEnd?: (result: { success: boolean; executionTime: number }) => void;
}

interface TerminalLine {
  id: string;
  type: 'output' | 'input' | 'prompt' | 'system' | 'error';
  content: string;
  timestamp: number;
}

const StreamingTerminal: React.FC<StreamingTerminalProps> = ({
  language,
  code,
  onExecutionStart,
  onExecutionEnd
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [executionStartTime, setExecutionStartTime] = useState<number>(0);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [expectedInputs, setExpectedInputs] = useState<number>(0);
  const [inputPrompts, setInputPrompts] = useState<string[]>([]);
  const [hasLoop, setHasLoop] = useState<boolean>(false);
  const [dynamicInputCount, setDynamicInputCount] = useState<number>(0);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  // Focus input when waiting for input
  useEffect(() => {
    if (waitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [waitingForInput]);

  const addTerminalLine = useCallback((line: Omit<TerminalLine, 'id'>) => {
    const newLine: TerminalLine = {
      ...line,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setTerminalLines(prev => [...prev, newLine]);
  }, []);

  // Detect if code requires input and analyze input patterns
  const analyzeInputRequirements = useCallback((code: string): { requiresInput: boolean; expectedInputs: number; inputPrompts: string[]; hasLoop: boolean } => {
    const inputPatterns = [
      /Scanner.*nextInt|nextLine|next\(\)/,
      /System\.in/,
      /BufferedReader/,
      /cin\s*>>/,
      /scanf/,
      /input\s*\(/,
      /raw_input\s*\(/,
      /Console\.ReadLine/,
      /Console\.Read/,
      /getchar\s*\(/,
      /gets\s*\(/
    ];
    
    const requiresInput = inputPatterns.some(pattern => pattern.test(code));
    
    if (!requiresInput) {
      return { requiresInput: false, expectedInputs: 0, inputPrompts: [], hasLoop: false };
    }

    // Check for loop patterns that affect input count
    const hasLoop = /for\s*\(.*\)\s*\{[\s\S]*?sc\.next/m.test(code) || 
                    /while\s*\(.*\)\s*\{[\s\S]*?sc\.next/m.test(code);

    // Extract prompts from print statements
    const lines = code.split('\n');
    const prompts: string[] = [];
    
    lines.forEach((line, index) => {
      if (line.includes('System.out.print')) {
        const promptMatch = line.match(/print(?:ln)?\("([^"]+)"/);
        if (promptMatch) {
          prompts.push(promptMatch[1]);
        }
      }
    });

    // For loop-based programs, start with minimal inputs and adapt
    const expectedInputs = hasLoop ? 1 : Math.max(prompts.length, 1);

    return { 
      requiresInput: true, 
      expectedInputs,
      inputPrompts: prompts,
      hasLoop
    };
  }, []);

  // Simulate real-time execution with interactive input
  const startExecution = async () => {
    if (!code.trim()) {
      addTerminalLine({
        type: 'system',
        content: 'No code to execute',
        timestamp: Date.now()
      });
      return;
    }

    setIsRunning(true);
    setWaitingForInput(false);
    setExecutionStartTime(Date.now());
    setTerminalLines([]);
    setInputHistory([]);
    
    addTerminalLine({
      type: 'system',
      content: `🚀 Starting ${language} execution...`,
      timestamp: Date.now()
    });

    onExecutionStart?.();

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const inputAnalysis = analyzeInputRequirements(code);
    setExpectedInputs(inputAnalysis.expectedInputs);
    setInputPrompts(inputAnalysis.inputPrompts);
    setHasLoop(inputAnalysis.hasLoop);
    
    if (inputAnalysis.requiresInput) {
      // Interactive mode - show prompt and wait for input
      let promptMessage;
      if (inputAnalysis.hasLoop) {
        promptMessage = `${inputAnalysis.inputPrompts[0] || "Enter input:"}\n💡 This program uses loops - provide ALL inputs at once, separated by spaces.\nExample: If asking for 2 users, enter: 2 John 25 85.5 Jane 30 92.0`;
      } else {
        promptMessage = inputAnalysis.inputPrompts.length > 0 
          ? `${inputAnalysis.inputPrompts[0]} (Input 1 of ${inputAnalysis.expectedInputs})`
          : `Program is waiting for input... (${inputAnalysis.expectedInputs} inputs expected)`;
      }
        
      addTerminalLine({
        type: 'prompt',
        content: promptMessage,
        timestamp: Date.now()
      });
      setWaitingForInput(true);
    } else {
      // Direct execution for non-interactive programs
      await executeCode();
    }
  };

  const executeCode = async (allInputs?: string[]) => {
    try {
      const inputString = allInputs ? allInputs.join('\n') : '';
      const result: ExecutionResult = await PistonService.executeCode(language, code, inputString);
      
      const executionTime = Date.now() - executionStartTime;
      
      if (result.success && result.output) {
        addTerminalLine({
          type: 'output',
          content: result.output,
          timestamp: Date.now()
        });
        addTerminalLine({
          type: 'system',
          content: `✅ Program completed successfully (${executionTime}ms)`,
          timestamp: Date.now()
        });
        onExecutionEnd?.({ success: true, executionTime });
      } else {
        addTerminalLine({
          type: 'error',
          content: `❌ Execution failed: ${result.error || 'Unknown error'}`,
          timestamp: Date.now()
        });
        onExecutionEnd?.({ success: false, executionTime });
      }
    } catch (error) {
      const executionTime = Date.now() - executionStartTime;
      addTerminalLine({
        type: 'error',
        content: `❌ Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      });
      onExecutionEnd?.({ success: false, executionTime });
    } finally {
      setIsRunning(false);
      setWaitingForInput(false);
    }
  };

  const sendInput = async () => {
    if (!currentInput.trim() || !waitingForInput) return;

    // Add input to terminal display
    addTerminalLine({
      type: 'input',
      content: `> ${currentInput}`,
      timestamp: Date.now()
    });

    // For loop-based programs, allow multiple inputs in one line
    if (hasLoop) {
      // Split input by spaces and newlines to handle multiple values
      const inputs = currentInput.trim().split(/[\s\n]+/).filter(input => input.length > 0);
      
      // Basic validation for loop programs - check if we have enough inputs
      if (inputs.length >= 1) {
        const numUsers = parseInt(inputs[0]);
        if (isNaN(numUsers) || numUsers < 0) {
          addTerminalLine({
            type: 'error',
            content: `⚠️ Invalid number of users: "${inputs[0]}". Please enter a valid number.`,
            timestamp: Date.now()
          });
          setCurrentInput('');
          return;
        }
        
        const expectedTotal = 1 + (numUsers * 3); // 1 for count + 3 per user (name, age, marks)
        
        if (inputs.length < expectedTotal) {
          addTerminalLine({
            type: 'error',
            content: `⚠️ Insufficient inputs! Expected ${expectedTotal} inputs total, but got ${inputs.length}.`,
            timestamp: Date.now()
          });
          addTerminalLine({
            type: 'error',
            content: `Format: [count] [name1] [age1] [marks1] [name2] [age2] [marks2] ...`,
            timestamp: Date.now()
          });
          addTerminalLine({
            type: 'prompt',
            content: `For ${numUsers} user(s), enter: ${numUsers} ${Array.from({length: numUsers}, (_, i) => `[name${i+1}] [age${i+1}] [marks${i+1}]`).join(' ')}`,
            timestamp: Date.now()
          });
          setCurrentInput('');
          return;
        }
      }
      
      const newInputHistory = [...inputHistory, ...inputs];
      setInputHistory(newInputHistory);
      setCurrentInput('');
      setWaitingForInput(false);
      
      // Show processing message
      addTerminalLine({
        type: 'system',
        content: `⚡ Processing ${newInputHistory.length} inputs...`,
        timestamp: Date.now()
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Execute with all collected inputs
      await executeCode(newInputHistory);
    } else {
      // Regular step-by-step input handling
      const newInputHistory = [...inputHistory, currentInput];
      setInputHistory(newInputHistory);
      setCurrentInput('');

      // Check if we need more inputs
      if (newInputHistory.length < expectedInputs) {
        // Show next prompt
        const nextInputIndex = newInputHistory.length;
        const nextPrompt = inputPrompts[nextInputIndex] || `Input ${nextInputIndex + 1}`;
        
        addTerminalLine({
          type: 'prompt',
          content: `${nextPrompt} (Input ${nextInputIndex + 1} of ${expectedInputs})`,
          timestamp: Date.now()
        });
        
        // Keep waiting for more input
        setWaitingForInput(true);
      } else {
        // All inputs collected, execute the program
        setWaitingForInput(false);
        
        // Show processing message
        addTerminalLine({
          type: 'system',
          content: '⚡ Processing all inputs...',
          timestamp: Date.now()
        });

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Execute with all collected inputs
        await executeCode(newInputHistory);
      }
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendInput();
    }
  };

  const terminateExecution = () => {
    setIsRunning(false);
    setWaitingForInput(false);
    addTerminalLine({
      type: 'system',
      content: '🛑 Execution terminated by user',
      timestamp: Date.now()
    });
  };

  const clearTerminal = () => {
    setTerminalLines([]);
  };

  const getLineColor = (type: string): string => {
    switch (type) {
      case 'output': return 'text-gray-100';
      case 'input': return 'text-blue-300';
      case 'prompt': return 'text-yellow-300';
      case 'system': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-300';
    }
  };

  const getLinePrefix = (type: string): string => {
    switch (type) {
      case 'output': return '▶';
      case 'input': return '◀';
      case 'prompt': return '?';
      case 'system': return '●';
      case 'error': return '✗';
      default: return '·';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></div>
          </div>
          <Terminal className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
          <span className="text-xs sm:text-sm text-gray-300 font-medium">Live Terminal</span>
          {isRunning && (
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></div>
          )}
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={clearTerminal}
            className="p-1.5 sm:px-2 sm:py-1 text-xs bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition-colors touch-manipulation"
            title="Clear Terminal"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          
          {!isRunning ? (
            <button
              onClick={startExecution}
              className="px-2 py-1.5 sm:px-3 sm:py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-1 touch-manipulation min-h-[32px]"
            >
              <Play className="w-3 h-3" />
              <span className="hidden xs:inline">Run</span>
            </button>
          ) : (
            <button
              onClick={terminateExecution}
              className="px-2 py-1.5 sm:px-3 sm:py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center space-x-1 touch-manipulation min-h-[32px]"
            >
              <Square className="w-3 h-3" />
              <span className="hidden xs:inline">Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-2 sm:p-3 font-mono text-xs sm:text-sm overflow-y-auto min-h-0">
        {terminalLines.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 px-4">
              <Terminal className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">Click "Run" to start live execution</p>
              <p className="text-xs mt-1 hidden sm:block">Real-time input/output will appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {terminalLines.map((line) => (
              <div key={line.id} className={`flex items-start space-x-2 ${getLineColor(line.type)}`}>
                <span className="text-gray-500 flex-shrink-0 mt-0.5">
                  {getLinePrefix(line.type)}
                </span>
                <span className="break-all whitespace-pre-wrap leading-relaxed">
                  {line.content}
                </span>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>

      {/* Input Section */}
      {waitingForInput && (
        <div className="p-2 sm:p-3 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-400 flex-shrink-0">▶</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleInputKeyPress}
              placeholder="Enter input..."
              className="flex-1 bg-gray-700 text-white text-xs sm:text-sm px-2 sm:px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none touch-manipulation min-h-[40px]"
            />
            <button
              onClick={sendInput}
              disabled={!currentInput.trim()}
              className="px-2 sm:px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[40px]"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            💡 Program is waiting for your input
          </p>
        </div>
      )}
    </div>
  );
};

export default StreamingTerminal;
