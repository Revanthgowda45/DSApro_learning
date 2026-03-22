/**
 * ProblemDescriptionService — AI-Generated LeetCode-Style Problem Descriptions
 * =============================================================================
 * Generates full problem descriptions (examples, constraints, hints) using Groq AI.
 * Caches results in Supabase so each problem is only generated once.
 */

import { supabase } from '../lib/supabase';
import { GroqAIService } from './groqAIService';

export interface ProblemDescription {
  problemId: string;
  title: string;
  difficulty: string;
  category: string;
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  hints: string[];
  starterCode: Record<string, string>; // language -> code template
  testCases: {
    input: string;
    expectedOutput: string;
  }[];
  functionName: string;
  generatedAt: string;
}

// In-memory cache to avoid repeated Supabase reads in same session
const memoryCache = new Map<string, ProblemDescription>();

export class ProblemDescriptionService {

  /**
   * Get a problem description — from memory cache, then Supabase, then AI generation
   */
  static async getDescription(
    problemId: string,
    title: string,
    difficulty: string,
    category: string,
    companies: string[],
    remarks?: string
  ): Promise<ProblemDescription> {
    // 1. Check memory cache
    if (memoryCache.has(problemId)) {
      console.log(`🧠 ProblemDescription: memory cache hit for #${problemId}`);
      return memoryCache.get(problemId)!;
    }

    // 2. Check Supabase cache
    const cached = await this.loadFromSupabase(problemId);
    if (cached) {
      console.log(`💾 ProblemDescription: Supabase cache hit for #${problemId}`);
      memoryCache.set(problemId, cached);
      return cached;
    }

    // 3. Generate with AI (first time only)
    console.log(`🤖 ProblemDescription: generating for #${problemId} "${title}"...`);
    const generated = await this.generateWithAI(problemId, title, difficulty, category, companies, remarks);
    
    // 4. Save to Supabase for future use (non-blocking)
    this.saveToSupabase(problemId, generated).catch(err => {
      console.warn('Failed to cache problem description:', err);
    });

    // 5. Cache in memory
    memoryCache.set(problemId, generated);
    
    return generated;
  }

  /**
   * Load from Supabase ai_insights table
   */
  private static async loadFromSupabase(problemId: string): Promise<ProblemDescription | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('data')
        .eq('insight_type', `problem_description_${problemId}`)
        .single();

      if (error || !data) return null;
      return data.data as ProblemDescription;
    } catch {
      return null;
    }
  }

  /**
   * Save to Supabase ai_insights table
   */
  private static async saveToSupabase(problemId: string, description: ProblemDescription): Promise<void> {
    if (!supabase) return;

    try {
      await supabase
        .from('ai_insights')
        .upsert({
          user_id: '00000000-0000-0000-0000-000000000000', // Global, not user-specific
          insight_type: `problem_description_${problemId}`,
          data: description as any,
          confidence_score: 1.0,
        }, {
          onConflict: 'user_id,insight_type'
        });
    } catch (err) {
      console.warn('Failed to save problem description to Supabase:', err);
    }
  }

  /**
   * Generate a full LeetCode-style description using Groq AI
   */
  private static async generateWithAI(
    problemId: string,
    title: string,
    difficulty: string,
    category: string,
    companies: string[],
    remarks?: string
  ): Promise<ProblemDescription> {
    const prompt = `You are an expert problem setter for coding platforms like LeetCode and GeeksforGeeks.

Generate a COMPLETE coding problem description for the following:

**Problem Title**: ${title}
**Category**: ${category}
**Difficulty**: ${difficulty}
**Companies that ask this**: ${companies.slice(0, 5).join(', ')}
${remarks ? `**Hint/Notes**: ${remarks}` : ''}

You MUST respond with ONLY valid JSON (no markdown, no code fences, no extra text) in this exact format:
{
  "description": "A clear, detailed problem statement (2-4 paragraphs). Describe what the function should do, what inputs it takes, and what output is expected.",
  "functionName": "maxArea",
  "examples": [
    {
      "input": "nums = [2, 7, 11, 15], target = 9",
      "output": "[0, 1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    },
    {
      "input": "nums = [3, 2, 4], target = 6",
      "output": "[1, 2]",
      "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."
    }
  ],
  "testCases": [
    { "input": "nums = [2,7,11,15], target = 9", "expectedOutput": "[0,1]" },
    { "input": "nums = [3,2,4], target = 6", "expectedOutput": "[1,2]" },
    { "input": "nums = [3,3], target = 6", "expectedOutput": "[0,1]" }
  ],
  "constraints": [
    "1 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "Only one valid answer exists"
  ],
  "hints": [
    "Think about what data structure allows O(1) lookups",
    "Can you solve it in a single pass?"
  ],
  "starterCode": {
    "javascript": "function solution(nums, target) {\\n  // Write your code here\\n}",
    "python": "def solution(nums, target):\\n    # Write your code here\\n    pass",
    "java": "class Solution {\\n    public int[] solve(int[] nums, int target) {\\n        // Write your code here\\n        return new int[]{};\\n    }\\n\\n    public static void main(String[] args) {\\n        Solution sol = new Solution();\\n        // Test your solution here\\n    }\\n}",
    "cpp": "#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nclass Solution {\\npublic:\\n    vector<int> solve(vector<int>& nums, int target) {\\n        // Write your code here\\n        return {};\\n    }\\n};\\n\\nint main() {\\n    Solution sol;\\n    // Test your solution here\\n    return 0;\\n}",
    "c": "#include <stdio.h>\\n\\n// Write your solution here\\n\\nint main() {\\n    // Test your solution here\\n    return 0;\\n}",
    "python3": "def solution(nums, target):\\n    # Write your code here\\n    pass",
    "typescript": "function solution(nums: number[], target: number): number[] {\\n  // Write your code here\\n  return [];\\n}"
  }
}

IMPORTANT RULES:
- "functionName" is the name of the main solving function used in ALL starterCode templates. This MUST be consistent across all languages.
- "testCases" are structured test inputs that will be automatically parsed and passed to the function. Include at least 3 test cases covering normal cases and edge cases.
- "testCases" input format must match the parameter names in the starterCode (e.g. "nums = [1,2,3], target = 9").
- "testCases" expectedOutput must be the exact return value as a string (e.g. "[0,1]", "49", "true").
- Make the problem description detailed and professional, matching real LeetCode quality.
- Include at least 2 examples with explanations.
- The starter code should have the correct function signature for this specific problem.`;

    try {
      // Try Groq first
      if (GroqAIService.isConfigured()) {
        const response = await GroqAIService.chat([{ role: 'user', content: prompt }]);
        const parsed = this.parseAIResponse(response, problemId, title, difficulty, category);
        return parsed;
      }
    } catch (err) {
      console.warn('Groq generation failed, using fallback:', err);
    }

    // Fallback: generate a basic description without AI
    return this.createFallbackDescription(problemId, title, difficulty, category, remarks);
  }

  /**
   * Parse AI JSON response into ProblemDescription
   */
  private static parseAIResponse(
    response: string,
    problemId: string,
    title: string,
    difficulty: string,
    category: string
  ): ProblemDescription {
    try {
      // Try to extract JSON object using regex if there's conversational text
      let cleaned = response.trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      } else if (cleaned.startsWith('```')) {
        // Fallback for markdown blocks
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```[\s\S]*$/, '').trim();
      }

      const parsed = JSON.parse(cleaned);

      return {
        problemId,
        title,
        difficulty,
        category,
        description: parsed.description || `Solve the "${title}" problem.`,
        examples: parsed.examples || [{ input: 'See problem statement', output: 'Expected result', explanation: 'Apply the algorithm' }],
        constraints: parsed.constraints || ['Check the problem constraints'],
        hints: parsed.hints || ['Think step by step'],
        starterCode: parsed.starterCode || this.getDefaultStarterCode(title),
        testCases: parsed.testCases || (parsed.examples || []).map((ex: any) => ({
          input: ex.input || '',
          expectedOutput: ex.output || '',
        })),
        functionName: parsed.functionName || 'solve',
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Failed to parse AI response:', err);
      return this.createFallbackDescription(problemId, title, difficulty, category);
    }
  }

  /**
   * Fallback description when AI is unavailable
   */
  private static createFallbackDescription(
    problemId: string,
    title: string,
    difficulty: string,
    category: string,
    remarks?: string
  ): ProblemDescription {
    return {
      problemId,
      title,
      difficulty,
      category,
      description: `**${title}**\n\nThis is a ${difficulty.toLowerCase()} level ${category} problem. ${remarks || 'Implement the solution efficiently considering time and space complexity.'}\n\nAnalyze the problem carefully and think about edge cases before coding.`,
      examples: [
        {
          input: 'See the problem statement for sample inputs',
          output: 'Expected output based on problem logic',
          explanation: 'Apply the appropriate algorithm for this problem type.'
        }
      ],
      constraints: [
        `Difficulty: ${difficulty}`,
        `Category: ${category}`,
        'Consider time and space complexity',
      ],
      hints: [
        `This is a ${category} problem — think about common patterns for this topic`,
        `The difficulty is ${difficulty} — consider the expected time complexity`,
      ],
      starterCode: this.getDefaultStarterCode(title),
      testCases: [],
      functionName: 'solve',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Default starter code templates
   */
  private static getDefaultStarterCode(title: string): Record<string, string> {
    return {
      javascript: `// ${title}\nfunction solve() {\n  // Write your solution here\n  \n}\n\n// Test your solution\nconsole.log(solve());`,
      python: `# ${title}\ndef solve():\n    # Write your solution here\n    pass\n\n# Test your solution\nprint(solve())`,
      python3: `# ${title}\ndef solve():\n    # Write your solution here\n    pass\n\n# Test your solution\nprint(solve())`,
      java: `// ${title}\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n        System.out.println("Hello from Java");\n    }\n}`,
      'c++': `// ${title}\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    cout << "Hello from C++" << endl;\n    return 0;\n}`,
      cpp: `// ${title}\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    cout << "Hello from C++" << endl;\n    return 0;\n}`,
      c: `// ${title}\n#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    printf("Hello from C\\n");\n    return 0;\n}`,
      typescript: `// ${title}\nfunction solve(): void {\n  // Write your solution here\n  \n}\n\nconsole.log(solve());`,
    };
  }

  /**
   * Clear memory cache (useful for development)
   */
  static clearCache(): void {
    memoryCache.clear();
    console.log('🧹 ProblemDescription: memory cache cleared');
  }
}
