/**
 * TestCaseRunnerService — LeetCode-Style Test Case Execution
 * ===========================================================
 * Wraps user code in a language-specific test harness, executes each test case
 * via PistonService, and compares actual output to expected output.
 */

import PistonService from './pistonService';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TestCase {
  input: string;          // e.g. "[1,8,6,2,5,4,8,3,7]" or "height = [1,8,6,2,5,4,8,3,7]"
  expectedOutput: string; // e.g. "49"
  explanation?: string;
}

export interface TestCaseResult {
  index: number;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  executionTime: number;
  error?: string;
}

export interface TestRunSummary {
  totalCases: number;
  passedCases: number;
  failedCases: number;
  allPassed: boolean;
  totalTime: number;
  results: TestCaseResult[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export class TestCaseRunnerService {

  /**
   * Run all test cases against user code. Returns detailed results.
   */
  static async runTestCases(
    language: string,
    userCode: string,
    testCases: TestCase[],
    functionName: string
  ): Promise<TestRunSummary> {
    const results: TestCaseResult[] = [];
    const overallStart = Date.now();

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const start = Date.now();

      try {
        // Build the full runnable code with test harness
        const runnableCode = this.buildTestHarness(language, userCode, tc.input, functionName);

        // Execute via Piston
        const execResult = await PistonService.executeCode(language, runnableCode);
        const elapsed = Date.now() - start;

        if (!execResult.success) {
          results.push({
            index: i,
            passed: false,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: '',
            executionTime: elapsed,
            error: execResult.error || 'Execution failed',
          });
          continue;
        }

        const actualOutput = this.normalizeOutput(execResult.output || '');
        const expectedOutput = this.normalizeOutput(tc.expectedOutput);
        const passed = this.compareOutputs(actualOutput, expectedOutput);

        results.push({
          index: i,
          passed,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: execResult.output?.trim() || '(no output)',
          executionTime: elapsed,
        });
      } catch (err) {
        results.push({
          index: i,
          passed: false,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: '',
          executionTime: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const passedCases = results.filter(r => r.passed).length;

    return {
      totalCases: testCases.length,
      passedCases,
      failedCases: testCases.length - passedCases,
      allPassed: passedCases === testCases.length,
      totalTime: Date.now() - overallStart,
      results,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CODE CLEANING — Strip existing main/test/print code
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Remove existing main() functions, standalone print/console.log calls,
   * and test boilerplate so the harness can inject its own clean test call.
   */
  private static stripUserTestCode(userCode: string, language: string): string {
    const lang = language.toLowerCase();
    let cleaned = userCode;

    if (['c', 'cpp', 'c++'].includes(lang)) {
      // Remove int main(...) { ... } block (greedy brace matching)
      cleaned = this.removeBracedBlock(cleaned, /int\s+main\s*\([^)]*\)\s*\{/);
    }

    if (lang === 'java') {
      // Remove public static void main(...) { ... } method
      cleaned = this.removeBracedBlock(cleaned, /public\s+static\s+void\s+main\s*\([^)]*\)\s*\{/);
    }

    if (['javascript', 'js', 'typescript', 'ts'].includes(lang)) {
      // Remove standalone console.log(...) lines at the top level
      cleaned = cleaned.replace(/^\s*console\.log\(.*\);\s*$/gm, '');
      // Remove "// Test your solution" comments and test calls
      cleaned = cleaned.replace(/^\s*\/\/\s*(Test|test).*$/gm, '');
    }

    if (['python', 'python3', 'py'].includes(lang)) {
      // Remove standalone print(...) at top level (not inside function defs)
      // Only remove lines that start with print( at indent level 0
      cleaned = cleaned.replace(/^print\(.*\)\s*$/gm, '');
      // Remove "# Test your solution" comments
      cleaned = cleaned.replace(/^\s*#\s*(Test|test).*$/gm, '');
      // Remove if __name__ block
      cleaned = cleaned.replace(/^if\s+__name__\s*==\s*['"]__main__['"]\s*:[\s\S]*$/m, '');
    }

    return cleaned.trim();
  }

  /**
   * Remove a braced block (e.g. main(){...}) by matching braces properly.
   * Handles nested braces correctly.
   */
  private static removeBracedBlock(code: string, startPattern: RegExp): string {
    const match = code.match(startPattern);
    if (!match || match.index === undefined) return code;

    const startIdx = match.index;
    // Find the opening brace
    const braceStart = code.indexOf('{', startIdx);
    if (braceStart === -1) return code;

    // Count braces to find the matching close
    let depth = 0;
    let endIdx = braceStart;
    for (let i = braceStart; i < code.length; i++) {
      if (code[i] === '{') depth++;
      if (code[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    // Remove the entire block
    return code.substring(0, startIdx).trimEnd() + '\n' + code.substring(endIdx + 1).trimStart();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST HARNESS BUILDERS (per language)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Wrap user code in a test harness that calls the user's function and prints
   * the result. The harness is language-specific.
   */
  private static buildTestHarness(
    language: string,
    userCode: string,
    testInput: string,
    functionName: string
  ): string {
    const lang = language.toLowerCase();
    const args = this.parseInputArgs(testInput);
    // Clean user code first — strip any existing main/test/print code
    const cleanCode = this.stripUserTestCode(userCode, language);

    switch (lang) {
      case 'javascript':
      case 'js':
        return this.buildJSHarness(cleanCode, args, functionName);
      case 'python':
      case 'python3':
      case 'py':
        return this.buildPythonHarness(cleanCode, args, functionName);
      case 'java':
        return this.buildJavaHarness(cleanCode, args, functionName);
      case 'cpp':
      case 'c++':
        return this.buildCppHarness(cleanCode, args, functionName);
      case 'c':
        return this.buildCHarness(cleanCode, args, functionName);
      case 'typescript':
      case 'ts':
        return this.buildTSHarness(cleanCode, args, functionName);
      default:
        return this.buildGenericHarness(cleanCode, args, functionName, lang);
    }
  }

  // ───── JavaScript ─────
  private static buildJSHarness(userCode: string, args: string, fnName: string): string {
    return `${userCode}

// === TEST HARNESS ===
const __result = ${fnName}(${args});
if (Array.isArray(__result)) {
  console.log(JSON.stringify(__result));
} else if (typeof __result === 'object' && __result !== null) {
  console.log(JSON.stringify(__result));
} else {
  console.log(String(__result));
}`;
  }

  // ───── TypeScript ─────
  private static buildTSHarness(userCode: string, args: string, fnName: string): string {
    return this.buildJSHarness(userCode, args, fnName);
  }

  // ───── Python ─────
  private static buildPythonHarness(userCode: string, args: string, fnName: string): string {
    return `import json

${userCode}

# === TEST HARNESS ===
__result = ${fnName}(${args})
if isinstance(__result, (list, dict, tuple)):
    print(json.dumps(__result))
elif isinstance(__result, bool):
    print(str(__result).lower())
else:
    print(__result)`;
  }

  // ───── Java ─────
  private static buildJavaHarness(userCode: string, args: string, fnName: string): string {
    // Check if there's a Solution class
    const hasSolutionClass = /class\s+Solution/.test(userCode);
    
    if (hasSolutionClass) {
      // Inject main inside the Solution class (before the last closing brace)
      const lastBrace = userCode.lastIndexOf('}');
      if (lastBrace !== -1) {
        const before = userCode.substring(0, lastBrace);
        const after = userCode.substring(lastBrace);
        return `import java.util.*;

${before}
    public static void main(String[] args) {
        Solution sol = new Solution();
        var result = sol.${fnName}(${args});
        if (result instanceof int[]) {
            System.out.println(java.util.Arrays.toString((int[])result));
        } else if (result instanceof String[]) {
            System.out.println(java.util.Arrays.toString((String[])result));
        } else if (result instanceof java.util.List) {
            System.out.println(result);
        } else {
            System.out.println(result);
        }
    }
${after}`;
      }
    }

    // Fallback: wrap everything
    return `import java.util.*;

${userCode}

class TestHarness {
    public static void main(String[] args) {
        System.out.println(${fnName}(${args}));
    }
}`;
  }

  // ───── C++ ─────
  private static buildCppHarness(userCode: string, args: string, fnName: string): string {
    // Ensure includes are present
    const needsIncludes = !userCode.includes('#include');
    const includeBlock = needsIncludes ? `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

` : '';

    return `${includeBlock}${userCode}

int main() {
    Solution sol;
    auto result = sol.${fnName}(${args});
    cout << result << endl;
    return 0;
}`;
  }

  // ───── C ─────
  private static buildCHarness(userCode: string, args: string, fnName: string): string {
    const needsIncludes = !userCode.includes('#include');
    const includeBlock = needsIncludes ? `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

` : '';

    return `${includeBlock}${userCode}

int main() {
    printf("%d\\n", ${fnName}(${args}));
    return 0;
}`;
  }

  // ───── Generic Fallback ─────
  private static buildGenericHarness(userCode: string, args: string, fnName: string, _lang: string): string {
    return `${userCode}

// Test call
console.log(${fnName}(${args}));`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INPUT / OUTPUT PARSING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Parse the test case input string into function arguments.
   * Handles formats like:
   *   "nums = [1,2,3], target = 9"  →  "[1,2,3], 9"
   *   "[1,8,6,2,5,4,8,3,7]"         →  "[1,8,6,2,5,4,8,3,7]"
   *   "height = [1,1]"              →  "[1,1]"
   *   "s = \"abc\", t = \"ahbgdc\"" →  "\"abc\", \"ahbgdc\""
   */
  static parseInputArgs(input: string): string {
    // If input has named parameters (e.g. "nums = [1,2,3], target = 9")
    // Extract just the values
    const namedParamPattern = /(\w+)\s*=\s*/g;
    if (namedParamPattern.test(input)) {
      // Split carefully — respect brackets and quotes
      const parts = this.smartSplit(input);
      return parts.map(part => {
        // Remove "varName = " prefix
        return part.replace(/^\s*\w+\s*=\s*/, '').trim();
      }).join(', ');
    }
    
    return input.trim();
  }

  /**
   * Smart split on commas that aren't inside brackets/quotes
   */
  private static smartSplit(input: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;      // bracket depth
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];

      if (inString) {
        current += ch;
        if (ch === stringChar && input[i - 1] !== '\\') {
          inString = false;
        }
        continue;
      }

      if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
        current += ch;
        continue;
      }

      if (ch === '[' || ch === '(' || ch === '{') {
        depth++;
        current += ch;
        continue;
      }

      if (ch === ']' || ch === ')' || ch === '}') {
        depth--;
        current += ch;
        continue;
      }

      // Split on comma only at depth 0 and when we see "varName =" next
      if (ch === ',' && depth === 0) {
        // Look ahead: is the next non-space char the start of "word ="?
        const rest = input.substring(i + 1).trimStart();
        if (/^\w+\s*=/.test(rest)) {
          parts.push(current.trim());
          current = '';
          continue;
        }
      }

      current += ch;
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }

  /**
   * Normalize output for comparison: trim, lowercase, remove extra spaces,
   * normalize array formatting.
   */
  private static normalizeOutput(output: string): string {
    let normalized = output.trim().toLowerCase();
    
    // Normalize whitespace
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Remove trailing newlines
    normalized = normalized.replace(/\n+$/, '');
    
    // Normalize array formatting: [1, 2, 3] → [1,2,3]
    normalized = normalized.replace(/\[\s*/g, '[');
    normalized = normalized.replace(/\s*\]/g, ']');
    normalized = normalized.replace(/,\s+/g, ',');
    
    // Normalize boolean output
    normalized = normalized.replace(/^true$/i, 'true');
    normalized = normalized.replace(/^false$/i, 'false');
    
    // Remove quotes around simple values if comparing numbers
    normalized = normalized.replace(/^["'](.+)["']$/, '$1');
    
    return normalized;
  }

  /**
   * Compare outputs with flexible matching
   */
  private static compareOutputs(actual: string, expected: string): boolean {
    // Direct match
    if (actual === expected) return true;
    
    // Try numeric comparison
    const numActual = Number(actual);
    const numExpected = Number(expected);
    if (!isNaN(numActual) && !isNaN(numExpected) && numActual === numExpected) return true;
    
    // Try parsing as JSON arrays and comparing sorted/unsorted
    try {
      const arrActual = JSON.parse(actual);
      const arrExpected = JSON.parse(expected);
      if (Array.isArray(arrActual) && Array.isArray(arrExpected)) {
        // Exact order match
        if (JSON.stringify(arrActual) === JSON.stringify(arrExpected)) return true;
      }
    } catch {
      // Not JSON, continue
    }
    
    return false;
  }
}
