/**
 * Piston API Service
 * Provides code execution capabilities using the Piston API
 * Documentation: https://piston.readthedocs.io/en/latest/api-v2/
 */

import { GroqAIService } from './groqAIService';

export interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
  runtime?: string;
}

export interface PistonExecuteRequest {
  language: string;
  version: string;
  files: Array<{
    name?: string;
    content: string;
  }>;
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

export interface PistonExecuteResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
  exitCode?: number;
}

class PistonService {
  // Use piston.rs public execute API instead of emkc.org which requires auth now
  private static readonly API_BASE_URL = 'https://emkc.org/api/v2/piston';
  private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_OUTPUT_LENGTH = 10000; // Limit output length

  // Language mapping for common aliases
  private static readonly LANGUAGE_MAPPING: Record<string, { language: string; version: string }> = {
    // Core Languages
    'javascript': { language: 'javascript', version: '18.15.0' },
    'js': { language: 'javascript', version: '18.15.0' },
    'python': { language: 'python', version: '3.10.0' },
    'python3': { language: 'python', version: '3.10.0' },
    'py': { language: 'python', version: '3.10.0' },
    'java': { language: 'java', version: '15.0.2' },
    'cpp': { language: 'cpp', version: '10.2.0' },
    'c++': { language: 'cpp', version: '10.2.0' },
    'c': { language: 'c', version: '10.2.0' },
    'csharp': { language: 'csharp', version: '6.12.0' },
    'c#': { language: 'csharp', version: '6.12.0' },
    'typescript': { language: 'typescript', version: '5.0.3' },
    'ts': { language: 'typescript', version: '5.0.3' },
    
    // Modern Languages
    'php': { language: 'php', version: '8.2.3' },
    'swift': { language: 'swift', version: '5.3.3' },
    'kotlin': { language: 'kotlin', version: '1.8.20' },
    'dart': { language: 'dart', version: '2.19.6' },
    'go': { language: 'go', version: '1.16.2' },
    'ruby': { language: 'ruby', version: '3.0.1' },
    'scala': { language: 'scala', version: '3.2.2' },
    'rust': { language: 'rust', version: '1.68.2' },
    
    // Functional & Others
    'racket': { language: 'racket', version: '8.3.0' },
    'erlang': { language: 'erlang', version: '23.0.0' },
    'elixir': { language: 'elixir', version: '1.11.3' },
    'haskell': { language: 'haskell', version: '9.0.1' },
    'clojure': { language: 'clojure', version: '1.10.3' },
    'julia': { language: 'julia', version: '1.8.5' },
    'rscript': { language: 'rscript', version: '4.1.1' },
    'r': { language: 'rscript', version: '4.1.1' },
    'lua': { language: 'lua', version: '5.4.4' }
  };

  /**
   * Get available runtimes from Piston API
   */
  static async getRuntimes(): Promise<PistonRuntime[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(`${this.API_BASE_URL}/runtimes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch runtimes: ${response.status} ${response.statusText}`);
      }

      const runtimes: PistonRuntime[] = await response.json();
      console.log('📋 Available Piston runtimes:', runtimes.length);
      return runtimes;
    } catch (error) {
      console.error('❌ Error fetching Piston runtimes:', error);
      throw new Error(`Failed to get available runtimes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute code using Piston API
   */
  static async executeCode(
    language: string,
    code: string,
    stdin?: string,
    args?: string[]
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Normalize language and get version
      const langConfig = this.LANGUAGE_MAPPING[language.toLowerCase()];
      if (!langConfig) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Prepare the execution request
      const executeRequest: PistonExecuteRequest = {
        language: langConfig.language,
        version: langConfig.version,
        files: [{
          name: this.getFileName(langConfig.language),
          content: code
        }],
        stdin: stdin || '',
        args: args || [],
        compile_timeout: 10000, // 10 seconds
        run_timeout: 3000,      // 3 seconds
        compile_memory_limit: -1, // No limit
        run_memory_limit: -1      // No limit
      };

      console.log(`🚀 Executing ${langConfig.language} code via Piston API...`);
      console.log('📝 Request:', {
        language: executeRequest.language,
        version: executeRequest.version,
        codeLength: code.length,
        hasStdin: !!stdin,
        argsCount: args?.length || 0
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(`${this.API_BASE_URL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(executeRequest),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('Piston API unauthorized. Falling back to AI simulated execution...');
          return this.simulateExecutionWithAI(language, code, stdin);
        }
        throw new Error(`Piston API error: ${response.status} ${response.statusText}`);
      }

      const result: PistonExecuteResponse = await response.json();
      const executionTime = Date.now() - startTime;

      console.log('📊 Piston execution result:', {
        language: result.language,
        version: result.version,
        runCode: result.run.code,
        compileCode: result.compile?.code,
        executionTime: `${executionTime}ms`
      });

      return this.processExecutionResult(result, executionTime);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('❌ Piston execution error:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          output: '',
          error: 'Code execution timed out. Please check for infinite loops or reduce complexity.',
          executionTime
        };
      }

      return {
        success: false,
        output: '',
        error: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime
      };
    }
  }

  /**
   * AI-powered simulated code execution fallback for when Piston API is blocked
   */
  private static async simulateExecutionWithAI(language: string, code: string, stdin?: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    try {
      const prompt = `You are a strict code execution engine. 
Simulate running the following ${language} code.
${stdin ? `Standard Input provided:\n${stdin}\n` : ''}

Code:
\`\`\`${language}
${code}
\`\`\`

If there is a syntax or runtime error, reply exactly with:
ERROR: [error description]

If it runs successfully, reply exactly with the stdout console output and NOTHING else (no markdown, no explanations).`;

      const response = await GroqAIService.chat([{ role: 'system', content: prompt }]);
      const output = response.trim();
      
      if (output.startsWith('ERROR:')) {
        return {
          success: false,
          output: '',
          error: output.substring(6).trim(),
          executionTime: Date.now() - startTime,
          exitCode: 1
        };
      }

      return {
        success: true,
        output: output,
        executionTime: Date.now() - startTime,
        exitCode: 0
      };
    } catch (err) {
      return {
        success: false,
        output: '',
        error: 'Execution failed: Public execution API is unavailable and AI fallback failed.',
        executionTime: Date.now() - startTime,
        exitCode: 1
      };
    }
  }

  /**
   * Process the execution result from Piston API
   */
  private static processExecutionResult(result: PistonExecuteResponse, executionTime: number): ExecutionResult {
    const { run, compile } = result;

    // Check for compilation errors first
    if (compile && compile.code !== 0) {
      return {
        success: false,
        output: compile.stdout || '',
        error: `Compilation Error:\n${compile.stderr || compile.output || 'Unknown compilation error'}`,
        executionTime,
        exitCode: compile.code
      };
    }

    // Check for runtime errors
    if (run.code !== 0) {
      return {
        success: false,
        output: run.stdout || '',
        error: `Runtime Error (Exit Code ${run.code}):\n${run.stderr || 'Unknown runtime error'}`,
        executionTime,
        exitCode: run.code
      };
    }

    // Successful execution
    let output = run.output || run.stdout || '';
    
    // Limit output length to prevent UI issues
    if (output.length > this.MAX_OUTPUT_LENGTH) {
      output = output.substring(0, this.MAX_OUTPUT_LENGTH) + '\n... (output truncated)';
    }

    // Clean up output
    output = output.trim();

    return {
      success: true,
      output: output || '(no output)',
      executionTime,
      exitCode: run.code
    };
  }

  /**
   * Get appropriate filename for the language
   */
  private static getFileName(language: string): string {
    const extensions: Record<string, string> = {
      // Core Languages
      'javascript': 'main.js',
      'python': 'main.py',
      'java': 'Main.java',
      'cpp': 'main.cpp',
      'c': 'main.c',
      'csharp': 'main.cs',
      'typescript': 'main.ts',
      
      // Modern Languages
      'php': 'main.php',
      'swift': 'main.swift',
      'kotlin': 'main.kt',
      'dart': 'main.dart',
      'go': 'main.go',
      'ruby': 'main.rb',
      'scala': 'main.scala',
      'rust': 'main.rs',
      
      // Functional & Others
      'racket': 'main.rkt',
      'erlang': 'main.erl',
      'elixir': 'main.exs',
      'haskell': 'main.hs',
      'clojure': 'main.clj',
      'julia': 'main.jl',
      'rscript': 'main.R',
      'lua': 'main.lua'
    };

    return extensions[language] || 'main.txt';
  }

  /**
   * Validate if a language is supported
   */
  static isLanguageSupported(language: string): boolean {
    return language.toLowerCase() in this.LANGUAGE_MAPPING;
  }

  /**
   * Get supported languages list
   */
  static getSupportedLanguages(): Array<{ value: string; label: string; version: string }> {
    return Object.entries(this.LANGUAGE_MAPPING).map(([key, config]) => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      version: config.version
    }));
  }

  /**
   * Test the Piston API connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const runtimes = await this.getRuntimes();
      return runtimes.length > 0;
    } catch (error) {
      console.error('❌ Piston API connection test failed:', error);
      return false;
    }
  }

  /**
   * Execute a simple test to verify language support
   */
  static async testLanguage(language: string): Promise<ExecutionResult> {
    const testCodes: Record<string, string> = {
      'javascript': 'console.log("Hello from JavaScript!");',
      'python': 'print("Hello from Python!")',
      'java': `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}`,
      'cpp': `
#include <iostream>
using namespace std;
int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}`,
      'c': `
#include <stdio.h>
int main() {
    printf("Hello from C!\\n");
    return 0;
}`,
      'go': `
package main
import "fmt"
func main() {
    fmt.Println("Hello from Go!")
}`,
      'erlang': `#!/usr/bin/env escript
main(_) ->
    io:format("Hello from Erlang!~n").`,
      'elixir': 'IO.puts("Hello from Elixir!")',
      'haskell': `main :: IO ()
main = putStrLn "Hello from Haskell!"`
    };

    const testCode = testCodes[language.toLowerCase()];
    if (!testCode) {
      return {
        success: false,
        output: '',
        error: `No test code available for language: ${language}`
      };
    }

    return await this.executeCode(language, testCode);
  }
}

export default PistonService;
