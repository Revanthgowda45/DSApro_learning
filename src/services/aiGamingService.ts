/**
 * Professional AI Gaming Service
 * Advanced AI-powered coding challenge platform with gaming mechanics
 */

// Types and Interfaces
export interface GameChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  hints: string[];
  solution: string;
  explanation: string;
  points: number;
  timeLimit: number;
  perfectTime: number;
  tags?: string[];
  companies?: string[];
  problemLink?: string;
}

export interface GameSession {
  id: string;
  challengeId: string;
  startTime: Date;
  endTime?: Date;
  timeSpent: number;
  hintsUsed: number;
  score: number;
  completed: boolean;
  userSolution?: string;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  provider?: string;
}

export interface SolutionEvaluation {
  isCorrect: boolean;
  score: number;
  feedback: string;
  suggestions: string[];
  hints?: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
  // Enhanced detailed analysis fields
  lineByLineAnalysis?: Array<{
    line: number;
    code: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  codeQualityMetrics?: {
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    duplicatedLines: number;
    codeSmells: string[];
    namingConventions: string;
  };
  performanceAnalysis?: {
    bottlenecks: string[];
    optimizationOpportunities: string[];
    memoryUsage: string;
    runtimePrediction: string;
  };
  edgeCaseAnalysis?: {
    coveredCases: string[];
    missedCases: string[];
    testCaseRecommendations: string[];
  };
  interviewFeedback?: {
    strengths: string[];
    weaknesses: string[];
    nextSteps: string[];
    industryReadiness: string;
  };
  reasoning?: string;
}

interface DSAProblem {
  id: number;
  topic: string;
  question: string;
  companies: string[];
  remarks: string;
  difficulty: string;
  link: string;
}

interface DSADataset {
  metadata: {
    title: string;
    total_questions: number;
    total_topics: number;
    recommended_pace: string;
    difficulty_guidelines: Record<string, string>;
    hard_questions_count: number;
  };
  questions: DSAProblem[];
}

/**
 * Professional AI Gaming Service Class
 * Handles AI-powered challenge generation, solution evaluation, and gaming mechanics
 */
export class AIGamingService {
  private static readonly GAMING_CONFIG = {
    POINTS: { easy: 100, medium: 250, hard: 500 },
    TIME_LIMITS: { easy: 300, medium: 600, hard: 1200 },
    PERFECT_TIME: { easy: 120, medium: 300, hard: 600 },
    HINT_PENALTY: 0.1,
  };

  private static readonly CATEGORY_MAP: Record<string, string> = {
    'arrays': 'Arrays',
    '2d arrays': '2D Arrays',
    '2darrays': '2D Arrays',
    'strings': 'Strings',
    'searching & sorting': 'Searching & Sorting',
    'searching-sorting': 'Searching & Sorting',
    'searchingsorting': 'Searching & Sorting',
    'dynamic programming': 'DP',
    'dynamicprogramming': 'DP',
    'dp': 'DP',
    'graphs': 'Graph',
    'binary trees': 'Binary Trees',
    'binarytrees': 'Binary Trees',
    'binary-trees': 'Binary Trees',
    'binary search trees': 'Binary Search Trees',
    'binarysearchtrees': 'Binary Search Trees',
    'linked list': 'Linked List',
    'linkedlist': 'Linked List',
    'linked-list': 'Linked List',
    'backtracking': 'Backtracking',
    'stacks & queues': 'Stacks & Queues',
    'stacksqueues': 'Stacks & Queues',
    'stacks-queues': 'Stacks & Queues',
    'heaps & hashing': 'Heaps & Hashing',
    'heapshashing': 'Heaps & Hashing',
    'heaps-hashing': 'Heaps & Hashing',
    'greedy': 'Greedy',
    'tries': 'Tries',
    'bit manipulation': 'Bit Manipulation',
    'bitmanipulation': 'Bit Manipulation',
    'segment trees': 'Segment Trees',
    'segmenttrees': 'Segment Trees',
  };

  static readonly CATEGORIES = [
    'Arrays', 'Strings', 'Searching & Sorting', 'Dynamic Programming',
    'Graphs', 'Binary Trees', 'Linked List', 'Backtracking', 
    'Stacks & Queues', 'Heaps & Hashing', 'Greedy'
  ];

  private static dsaDataCache: DSADataset | null = null;

  private static get OPENROUTER_API_KEY(): string {
    return import.meta.env.VITE_OPENROUTER_API_KEY || '';
  }

  private static get GEMINI_API_KEY(): string {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  /**
   * Initialize service
   */
  static initialize(): boolean {
    const hasProviders = !!(this.OPENROUTER_API_KEY || this.GEMINI_API_KEY);
    console.log(`🚀 AI Gaming Service ${hasProviders ? 'initialized' : 'using fallback mode'}`);
    return hasProviders;
  }

  /**
   * Generate new challenge
   */
  static async generateChallenge(
    difficulty: 'easy' | 'medium' | 'hard',
    category: string,
    userLevel: number = 1
  ): Promise<GameChallenge> {
    console.log(`🎯 Generating ${difficulty} ${category} challenge`);

    try {
      const aiChallenge = await this.generateAIChallenge(difficulty, category, userLevel);
      if (aiChallenge) {
        console.log('✅ AI challenge generated:', aiChallenge.title);
        return aiChallenge;
      }
    } catch (error) {
      console.warn('⚠️ AI generation failed:', error);
    }

    console.log('🔄 Using DSA dataset fallback');
    return await this.getDSAChallenge(difficulty, category);
  }

  /**
   * Generate AI challenge
   */
  private static async generateAIChallenge(
    difficulty: 'easy' | 'medium' | 'hard',
    category: string,
    userLevel: number
  ): Promise<GameChallenge | null> {
    const prompt = this.createChallengePrompt(difficulty, category, userLevel);
    
    // Try OpenRouter first
    if (this.OPENROUTER_API_KEY) {
      try {
        const response = await this.callOpenRouter(prompt);
        if (response.success && response.data) {
          return this.parseAIResponse(response.data, difficulty, category);
        }
      } catch (error) {
        console.warn('OpenRouter failed, trying Gemini:', error);
      }
    }

    // Try Gemini as fallback
    if (this.GEMINI_API_KEY) {
      try {
        const response = await this.callGemini(prompt);
        if (response.success && response.data) {
          return this.parseAIResponse(response.data, difficulty, category);
        }
      } catch (error) {
        console.warn('Gemini also failed:', error);
      }
    }

    return null;
  }

  private static async callOpenRouter(prompt: string): Promise<AIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.choices?.[0]?.message?.content,
        provider: 'OpenRouter'
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'OpenRouter'
      };
    }
  }

  private static async callGemini(prompt: string): Promise<AIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.candidates?.[0]?.content?.parts?.[0]?.text,
        provider: 'Gemini'
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'Gemini'
      };
    }
  }

  private static parseAIResponse(
    responseText: string,
    difficulty: 'easy' | 'medium' | 'hard',
    category: string
  ): GameChallenge | null {
    try {
      // Clean the response text
      let cleanedText = responseText.trim();
      
      // Remove markdown code blocks if present
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing text that's not JSON
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      }
      
      // Clean control characters and fix common JSON issues
      cleanedText = cleanedText
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\n/g, '\\n') // Escape newlines
        .replace(/\r/g, '\\r') // Escape carriage returns
        .replace(/\t/g, '\\t') // Escape tabs
        .replace(/"/g, '"') // Fix smart quotes
        .replace(/"/g, '"') // Fix smart quotes
        .replace(/'/g, "'") // Fix smart quotes
        .replace(/'/g, "'"); // Fix smart quotes

      console.log('🧹 Cleaned AI response for parsing');
      
      const parsed = JSON.parse(cleanedText);
      
      return {
        id: `ai-${Date.now()}`,
        title: parsed.title || `${category} Challenge`,
        description: parsed.description || 'AI-generated challenge',
        difficulty,
        category,
        hints: Array.isArray(parsed.hints) ? parsed.hints : ['Think step by step'],
        solution: parsed.solution || '// Solution not provided',
        explanation: parsed.explanation || 'No explanation provided',
        points: this.GAMING_CONFIG.POINTS[difficulty],
        timeLimit: this.GAMING_CONFIG.TIME_LIMITS[difficulty],
        perfectTime: this.GAMING_CONFIG.PERFECT_TIME[difficulty],
      };
    } catch (error) {
      console.warn('Failed to parse AI response, trying manual extraction:', error);
      return this.extractFieldsManually(responseText, difficulty, category);
    }
  }

  private static extractFieldsManually(
    responseText: string,
    difficulty: 'easy' | 'medium' | 'hard',
    category: string
  ): GameChallenge | null {
    try {
      const extract = (field: string): string => {
        const patterns = [
          new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, 'i'),
          new RegExp(`${field}\\s*:\\s*"([^"]*)"`, 'i'),
          new RegExp(`"${field}"\\s*:\\s*'([^']*)'`, 'i'),
        ];
        
        for (const pattern of patterns) {
          const match = responseText.match(pattern);
          if (match) return match[1];
        }
        return '';
      };

      const extractArray = (field: string): string[] => {
        const pattern = new RegExp(`"${field}"\\s*:\\s*\\[([^\\]]*)\\]`, 'i');
        const match = responseText.match(pattern);
        if (match) {
          return match[1]
            .split(',')
            .map(item => item.trim().replace(/['"]/g, ''))
            .filter(item => item.length > 0);
        }
        return [];
      };

      const title = extract('title') || `${category} Challenge`;
      const description = extract('description') || 'Challenge description';
      const solution = extract('solution') || '// Solution code';
      const explanation = extract('explanation') || 'Solution explanation';
      const hints = extractArray('hints');

      if (title && description) {
        console.log('✅ Manual extraction successful');
        return {
          id: `ai-manual-${Date.now()}`,
          title,
          description,
          difficulty,
          category,
          hints: hints.length > 0 ? hints : ['Think step by step', 'Consider edge cases'],
          solution,
          explanation,
          points: this.GAMING_CONFIG.POINTS[difficulty],
          timeLimit: this.GAMING_CONFIG.TIME_LIMITS[difficulty],
          perfectTime: this.GAMING_CONFIG.PERFECT_TIME[difficulty],
        };
      }
    } catch (error) {
      console.error('Manual extraction failed:', error);
    }
    
    return null;
  }

  /**
   * Load DSA dataset
   */
  private static async loadDSADataset(): Promise<DSADataset | null> {
    if (this.dsaDataCache) {
      return this.dsaDataCache;
    }

    try {
      console.log('📚 Loading DSA dataset...');
      const response = await fetch('/dsa.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Validate the data structure
      if (data && data.metadata && typeof data.metadata.total_questions === 'number') {
        this.dsaDataCache = data;
        console.log(`📚 DSA dataset loaded: ${data.metadata.total_questions} problems`);
        return this.dsaDataCache;
      } else {
        throw new Error('Invalid DSA dataset structure');
      }
    } catch (error) {
      console.error('Failed to load DSA dataset:', error);
      return null;
    }
  }

  /**
   * Get DSA challenge
   */
  private static async getDSAChallenge(
    difficulty: 'easy' | 'medium' | 'hard',
    category: string
  ): Promise<GameChallenge> {
    const dataset = await this.loadDSADataset();
    
    if (dataset) {
      const topic = this.mapCategoryToTopic(category);
      const difficultyLevel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      
      console.log(`🔍 Searching for: Topic="${topic}", Difficulty="${difficultyLevel}"`);
      
      const problems = dataset.questions.filter(q => 
        q.topic === topic && q.difficulty === difficultyLevel
      );
      
      console.log(`📊 Found ${problems.length} problems matching criteria`);
      
      if (problems.length > 0) {
        const problem = problems[Math.floor(Math.random() * problems.length)];
        console.log(`✅ Selected problem: "${problem.question}" (${problem.topic}, ${problem.difficulty})`);
        return this.createDSAChallenge(problem, difficulty, category);
      } else {
        // Try to find problems with the topic but any difficulty
        const topicProblems = dataset.questions.filter(q => q.topic === topic);
        console.log(`⚠️ No ${difficultyLevel} problems found for ${topic}. Found ${topicProblems.length} problems of any difficulty.`);
        
        if (topicProblems.length > 0) {
          const problem = topicProblems[Math.floor(Math.random() * topicProblems.length)];
          console.log(`🔄 Using ${problem.difficulty} problem instead: "${problem.question}"`);
          return this.createDSAChallenge(problem, difficulty, category);
        }
      }
    }

    console.log(`❌ No DSA problems found, using fallback challenge`);
    return this.createFallbackChallenge(difficulty, category);
  }

  private static mapCategoryToTopic(category: string): string {
    // Convert category to lowercase and create multiple possible keys
    const normalizedCategory = category.toLowerCase();
    const keyWithSpaces = normalizedCategory.replace(/[^a-z\s&]/g, '');
    const keyWithDashes = keyWithSpaces.replace(/\s+/g, '-');
    const keyWithoutSpaces = keyWithSpaces.replace(/[\s&]/g, '');
    
    // Try different key formats
    const possibleKeys = [
      normalizedCategory,
      keyWithSpaces,
      keyWithDashes,
      keyWithoutSpaces
    ];
    
    for (const key of possibleKeys) {
      if (this.CATEGORY_MAP[key]) {
        console.log(`🎯 Mapped category "${category}" to topic "${this.CATEGORY_MAP[key]}"`);
        return this.CATEGORY_MAP[key];
      }
    }
    
    console.warn(`⚠️ No mapping found for category "${category}", using Arrays as fallback`);
    return 'Arrays';
  }

  private static createDSAChallenge(
    problem: DSAProblem,
    difficulty: 'easy' | 'medium' | 'hard',
    category: string
  ): GameChallenge {
    const formattedDescription = `**Problem Statement:**
${problem.question}

**Example 1:**
Input: [Please refer to the problem link for specific examples]
Output: [Expected output format]
Explanation: [Detailed explanation of the approach]

**Example 2:**
Input: [Additional test case]
Output: [Expected output]
Explanation: [Step-by-step breakdown]

**Constraints:**
- Follow the problem constraints as specified in the reference
- Consider edge cases and boundary conditions
- Optimize for time and space complexity

**Companies:** ${problem.companies.slice(0, 5).join(', ')}${problem.companies.length > 5 ? ` and ${problem.companies.length - 5} more` : ''}

**Reference:** [View detailed examples and constraints](${problem.link})

**Difficulty:** ${problem.difficulty} | **Topic:** ${problem.topic}`;

    return {
      id: `dsa-${problem.id}`,
      title: problem.question,
      description: formattedDescription,
      difficulty,
      category,
      hints: [
        'Break down the problem into smaller steps',
        'Consider the time and space complexity',
        'Think about edge cases and constraints',
        'Look at the pattern and try to identify the optimal approach'
      ],
      solution: `// ${problem.difficulty} level ${problem.topic} problem
// Asked by: ${problem.companies.slice(0, 3).join(', ')}
// Reference: ${problem.link}

function solution() {
    // Implement your solution here
    // Consider the time and space complexity
    
    return result;
}

// Time Complexity: O(?)
// Space Complexity: O(?)`,
      explanation: `This is a ${problem.difficulty} level problem from the ${problem.topic} category. It has been frequently asked by top companies including ${problem.companies.slice(0, 3).join(', ')}. 

Key approaches to consider:
1. Understand the problem requirements clearly
2. Identify the optimal data structure and algorithm
3. Consider edge cases and constraints
4. Optimize for both time and space complexity

For detailed examples, test cases, and multiple solution approaches, visit the reference link.`,
      points: this.GAMING_CONFIG.POINTS[difficulty],
      timeLimit: this.GAMING_CONFIG.TIME_LIMITS[difficulty],
      perfectTime: this.GAMING_CONFIG.PERFECT_TIME[difficulty],
      companies: problem.companies,
      problemLink: problem.link,
    };
  }

  private static createFallbackChallenge(
    difficulty: 'easy' | 'medium' | 'hard',
    category: string
  ): GameChallenge {
    // Define the type for fallback problems structure
    type FallbackProblemsType = {
      [key: string]: {
        easy: {
          title: string;
          description: string;
          solution: string;
        };
        medium: {
          title: string;
          description: string;
          solution: string;
        };
        hard: {
          title: string;
          description: string;
          solution: string;
        };
      };
    };

    const fallbackProblems: FallbackProblemsType = {
      'Arrays': {
        easy: {
          title: 'Two Sum',
          description: `**Problem Statement:**
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

**Example 1:**
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

**Example 2:**
Input: nums = [3,2,4], target = 6
Output: [1,2]
Explanation: nums[1] + nums[2] == 6, so we return [1, 2].

**Constraints:**
- 2 ≤ nums.length ≤ 10⁴
- -10⁹ ≤ nums[i] ≤ 10⁹
- -10⁹ ≤ target ≤ 10⁹
- Only one valid answer exists.

**Follow-up:** Can you come up with an algorithm that is less than O(n²) time complexity?`,
          solution: `function twoSum(nums, target) {
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        
        map.set(nums[i], i);
    }
    
    return [];
}

// Time Complexity: O(n)
// Space Complexity: O(n)`
        },
        medium: {
          title: 'Maximum Subarray',
          description: `**Problem Statement:**
Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

**Example 1:**
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: [4,-1,2,1] has the largest sum = 6.

**Example 2:**
Input: nums = [1]
Output: 1

**Example 3:**
Input: nums = [5,4,-1,7,8]
Output: 23

**Constraints:**
- 1 ≤ nums.length ≤ 10⁵
- -10⁴ ≤ nums[i] ≤ 10⁴

**Follow-up:** If you have figured out the O(n) solution, try coding another solution using the divide and conquer approach.`,
          solution: `function maxSubArray(nums) {
    let maxSum = nums[0];
    let currentSum = nums[0];
    
    for (let i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    
    return maxSum;
}

// Time Complexity: O(n)
// Space Complexity: O(1)`
        },
        hard: {
          title: 'Median of Two Sorted Arrays',
          description: `**Problem Statement:**
Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

**Example 1:**
Input: nums1 = [1,3], nums2 = [2]
Output: 2.00000
Explanation: merged array = [1,2,3] and median is 2.

**Example 2:**
Input: nums1 = [1,2], nums2 = [3,4]
Output: 2.50000
Explanation: merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.

**Constraints:**
- nums1.length == m
- nums2.length == n
- 0 ≤ m ≤ 1000
- 0 ≤ n ≤ 1000
- 1 ≤ m + n ≤ 2000
- -10⁶ ≤ nums1[i], nums2[i] ≤ 10⁶

**Follow-up:** The overall run time complexity should be O(log (m+n)).`,
          solution: `function findMedianSortedArrays(nums1, nums2) {
    if (nums1.length > nums2.length) {
        [nums1, nums2] = [nums2, nums1];
    }
    
    const m = nums1.length;
    const n = nums2.length;
    let low = 0, high = m;
    
    while (low <= high) {
        const cut1 = Math.floor((low + high) / 2);
        const cut2 = Math.floor((m + n + 1) / 2) - cut1;
        
        const left1 = cut1 === 0 ? -Infinity : nums1[cut1 - 1];
        const left2 = cut2 === 0 ? -Infinity : nums2[cut2 - 1];
        const right1 = cut1 === m ? Infinity : nums1[cut1];
        const right2 = cut2 === n ? Infinity : nums2[cut2];
        
        if (left1 <= right2 && left2 <= right1) {
            if ((m + n) % 2 === 1) {
                return Math.max(left1, left2);
            } else {
                return (Math.max(left1, left2) + Math.min(right1, right2)) / 2;
            }
        } else if (left1 > right2) {
            high = cut1 - 1;
        } else {
            low = cut1 + 1;
        }
    }
    
    return 1.0;
}

// Time Complexity: O(log(min(m, n)))
// Space Complexity: O(1)`
        }
      }
    };

    const categoryProblems = fallbackProblems[category] || fallbackProblems['Arrays'];
    const problemData = categoryProblems[difficulty] || categoryProblems['easy'];

    return {
      id: `fallback-${Date.now()}`,
      title: problemData.title,
      description: problemData.description,
      difficulty,
      category,
      hints: [
        'Start with a brute force approach',
        'Think about optimizing time complexity',
        'Consider edge cases and constraints',
        'Look for patterns in the examples'
      ],
      solution: problemData.solution,
      explanation: `This is a classic ${category} problem that helps you practice fundamental algorithms and data structures. Focus on understanding the approach and optimizing your solution.`,
      points: this.GAMING_CONFIG.POINTS[difficulty],
      timeLimit: this.GAMING_CONFIG.TIME_LIMITS[difficulty],
      perfectTime: this.GAMING_CONFIG.PERFECT_TIME[difficulty],
    };
  }

  private static createChallengePrompt(
    difficulty: string,
    category: string,
    _userLevel: number
  ): string {
    return `Create a ${difficulty} level coding challenge for ${category}.

Generate a JSON response with this exact structure:
{
  "title": "Specific challenge title related to ${category}",
  "description": "**Problem Statement:**\nClear problem description\n\n**Example 1:**\nInput: [example input]\nOutput: [example output]\nExplanation: Brief explanation\n\n**Example 2:**\nInput: [example input]\nOutput: [example output]\nExplanation: Brief explanation\n\n**Constraints:**\n- Constraint 1\n- Constraint 2\n- Constraint 3\n\n**Follow-up:** Optional follow-up question",
  "hints": ["hint1", "hint2", "hint3"],
  "solution": "Complete working solution code with comments",
  "explanation": "Detailed explanation of approach and complexity"
}

STRICT REQUIREMENTS:
- Problem MUST be specifically about ${category}
- Difficulty MUST match ${difficulty} level complexity
- Format description EXACTLY like LeetCode with sections, examples, and constraints
- Include 2-3 concrete input/output examples with explanations
- Add proper constraints section
- Solution must be complete and runnable
- Return ONLY valid JSON, no additional text.`;
  }

  /**
   * Evaluate solution with comprehensive detailed analysis
   */
  static async evaluateSolution(
    challenge: GameChallenge,
    userSolution: string,
    timeSpent: number,
    hintsUsed: number = 0
  ): Promise<SolutionEvaluation> {
    console.log('🔍 Starting comprehensive AI evaluation with detailed analysis...');
    
    try {
      // Perform code complexity analysis first
      const complexityAnalysis = this.analyzeCodeComplexity(userSolution);
      const performanceAnalysis = this.analyzePerformance(userSolution, challenge.difficulty);
      const plagiarismCheck = this.checkCommonPatterns(userSolution, challenge.title);
      
      const prompt = `You are a SENIOR TECHNICAL INTERVIEWER at a top tech company (Google/Meta/Amazon level). 
Provide an EXTREMELY DETAILED, LINE-BY-LINE analysis of this coding solution with professional-grade feedback.

CHALLENGE: ${challenge.title}
DIFFICULTY: ${challenge.difficulty}
DESCRIPTION: ${challenge.description}

USER SOLUTION:
${userSolution}

PERFORMANCE METRICS:
- Time Spent: ${timeSpent}s (Limit: ${challenge.timeLimit}s)
- Hints Used: ${hintsUsed}
- Code Complexity Score: ${complexityAnalysis.score}/100
- Cyclomatic Complexity: ${complexityAnalysis.cyclomaticComplexity}
- Performance Rating: ${performanceAnalysis.rating}
- Pattern Similarity: ${plagiarismCheck.similarity}%

REQUIRED ANALYSIS DEPTH:
1. LINE-BY-LINE CODE REVIEW: Analyze each significant line, identify specific issues
2. ALGORITHM ANALYSIS: Detailed time/space complexity with mathematical proof
3. CODE QUALITY ASSESSMENT: Variable naming, structure, readability, maintainability
4. EDGE CASE COVERAGE: Specific test cases that would break the solution
5. PERFORMANCE BOTTLENECKS: Exact lines causing performance issues
6. OPTIMIZATION OPPORTUNITIES: Specific code improvements with line numbers

EVALUATION CRITERIA (Weighted):
- CORRECTNESS (40%): Functional correctness with specific test case analysis
- ALGORITHM EFFICIENCY (30%): Time/space complexity optimization
- CODE QUALITY (20%): Professional coding standards
- EDGE CASE HANDLING (10%): Robustness and error handling

SCORING STANDARDS (EXTREMELY HARSH - Real Interview Level):
- 95-100: Perfect solution, optimal algorithm, production-ready code
- 85-94: Excellent solution with minor optimizations possible
- 75-84: Good solution but has clear improvement areas
- 65-74: Working solution with significant algorithmic or quality issues
- 50-64: Partially working with major flaws
- 0-49: Incorrect or fundamentally broken solution

PENALTIES (Applied Automatically):
- Each hint: -10 points
- Time overrun: -15 points
- Poor naming: -5 points per violation
- Missing edge cases: -10 points per case
- Suboptimal complexity: -15 points
- Code duplication: -5 points
- No comments: -5 points
- Magic numbers: -3 points each

RESPOND WITH DETAILED JSON:
{
  "isCorrect": boolean,
  "score": number (0-100, be extremely harsh),
  "feedback": "DETAILED multi-paragraph professional feedback with specific line references",
  "suggestions": ["Specific improvements with line numbers and exact changes"],
  "timeComplexity": "O(...) with mathematical explanation",
  "spaceComplexity": "O(...) with memory usage breakdown",
  "lineByLineAnalysis": [
    {"line": number, "code": "actual code", "issue": "specific problem", "severity": "high/medium/low", "suggestion": "exact fix"}
  ],
  "codeQualityMetrics": {
    "cyclomaticComplexity": number,
    "maintainabilityIndex": number,
    "duplicatedLines": number,
    "codeSmells": ["specific issues"],
    "namingConventions": "score/10"
  },
  "performanceAnalysis": {
    "bottlenecks": ["specific performance issues with line numbers"],
    "optimizationOpportunities": ["exact optimizations possible"],
    "memoryUsage": "detailed analysis",
    "runtimePrediction": "expected performance on large inputs"
  },
  "edgeCaseAnalysis": {
    "coveredCases": ["cases the solution handles"],
    "missedCases": ["specific test cases that would fail"],
    "testCaseRecommendations": ["exact test cases to add"]
  },
  "interviewFeedback": {
    "strengths": ["specific positive aspects"],
    "weaknesses": ["specific areas needing improvement"],
    "nextSteps": ["what to study/practice next"],
    "industryReadiness": "percentage ready for production"
  },
  "reasoning": "Detailed explanation of score calculation with breakdown"
}`;

      console.log('🤖 Attempting AI evaluation with professional standards...');

      // Try OpenRouter first
      if (this.OPENROUTER_API_KEY) {
        const response = await this.callOpenRouter(prompt);
        if (response.success && response.data) {
          try {
            const evaluation = JSON.parse(response.data);
            console.log('✅ AI evaluation successful:', evaluation);
            
            // Apply additional realistic penalties
            let finalScore = evaluation.score || 0;
            finalScore -= (hintsUsed * 10); // Harsh hint penalty
            if (timeSpent > challenge.timeLimit) {
              finalScore -= 15; // Time penalty
            }
            finalScore = Math.max(finalScore, 0); // Don't go below 0
            
            return {
              isCorrect: evaluation.isCorrect && finalScore >= 70,
              score: Math.round(finalScore),
              feedback: evaluation.feedback || 'No detailed feedback available',
              suggestions: evaluation.suggestions || ['Review the solution approach', 'Practice similar problems'],
              timeComplexity: evaluation.timeComplexity,
              spaceComplexity: evaluation.spaceComplexity,
            };
          } catch (parseError) {
            console.warn('❌ Failed to parse AI evaluation, trying manual extraction...');
            return this.extractEvaluationFieldsManually(response.data, hintsUsed, timeSpent, challenge.timeLimit);
          }
        }
      }

      // Try Gemini as fallback
      if (this.GEMINI_API_KEY) {
        console.log('🔄 Trying Gemini as fallback...');
        const response = await this.callGemini(prompt);
        if (response.success && response.data) {
          try {
            const evaluation = JSON.parse(response.data);
            console.log('✅ Gemini evaluation successful:', evaluation);
            
            let finalScore = evaluation.score || 0;
            finalScore -= (hintsUsed * 10);
            if (timeSpent > challenge.timeLimit) {
              finalScore -= 15;
            }
            finalScore = Math.max(finalScore, 0);
            
            return {
              isCorrect: evaluation.isCorrect && finalScore >= 70,
              score: Math.round(finalScore),
              feedback: evaluation.feedback || 'No detailed feedback available',
              suggestions: evaluation.suggestions || ['Review the solution approach', 'Practice similar problems'],
              timeComplexity: evaluation.timeComplexity,
              spaceComplexity: evaluation.spaceComplexity,
            };
          } catch (parseError) {
            console.warn('❌ Failed to parse Gemini evaluation, trying manual extraction...');
            return this.extractEvaluationFieldsManually(response.data, hintsUsed, timeSpent, challenge.timeLimit);
          }
        }
      }

      // Enhanced fallback evaluation
      console.log('⚠️ AI evaluation failed, using enhanced fallback...');
      return this.realisticBasicEvaluation(userSolution, timeSpent, challenge.timeLimit, hintsUsed, challenge.difficulty);
    } catch (error) {
      console.error('❌ Solution evaluation failed:', error);
      return this.realisticBasicEvaluation(userSolution, timeSpent, challenge.timeLimit, hintsUsed, challenge.difficulty);
    }
  }

  private static extractEvaluationFieldsManually(
    responseText: string,
    hintsUsed: number,
    timeSpent: number,
    timeLimit: number
  ): SolutionEvaluation {
    console.log('🔧 Attempting manual field extraction from AI response...');
    
    try {
      // Extract fields using regex patterns
      const isCorrectMatch = responseText.match(/"isCorrect":\s*(true|false)/i);
      const scoreMatch = responseText.match(/"score":\s*(\d+)/);
      const feedbackMatch = responseText.match(/"feedback":\s*"([^"]+)"/);
      const suggestionsMatch = responseText.match(/"suggestions":\s*\[(.*?)\]/s);
      
      const isCorrect = isCorrectMatch ? isCorrectMatch[1].toLowerCase() === 'true' : false;
      let score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
      const feedback = feedbackMatch ? feedbackMatch[1] : 'AI evaluation completed with manual parsing.';
      
      // Parse suggestions array
      let suggestions: string[] = ['Review the solution approach', 'Practice similar problems'];
      if (suggestionsMatch) {
        try {
          const suggestionsStr = suggestionsMatch[1];
          const suggestionMatches = suggestionsStr.match(/"([^"]+)"/g);
          if (suggestionMatches) {
            suggestions = suggestionMatches.map(s => s.replace(/"/g, ''));
          }
        } catch (e) {
          console.warn('Failed to parse suggestions, using defaults');
        }
      }
      
      // Apply realistic penalties
      score -= (hintsUsed * 10);
      if (timeSpent > timeLimit) {
        score -= 15;
      }
      score = Math.max(score, 0);
      
      console.log('✅ Manual extraction successful:', { isCorrect, score, feedback });
      
      return {
        isCorrect: isCorrect && score >= 70,
        score: Math.round(score),
        feedback,
        suggestions,
        timeComplexity: 'Not analyzed',
        spaceComplexity: 'Not analyzed',
      };
    } catch (error) {
      console.error('❌ Manual extraction failed:', error);
      return this.realisticBasicEvaluation('', timeSpent, timeLimit, hintsUsed, 'medium');
    }
  }

  /**
   * Realistic basic evaluation with professional standards
   */
  private static realisticBasicEvaluation(
    solution: string,
    timeSpent: number,
    timeLimit: number,
    hintsUsed: number,
    difficulty: 'easy' | 'medium' | 'hard'
  ): SolutionEvaluation {
    console.log('🎯 Performing realistic basic evaluation...');
    
    // Code structure analysis
    const hasCode = solution.trim().length > 20;
    const hasFunction = /function|def|class|public|private|const\s+\w+\s*=/.test(solution);
    const hasLogic = /if|for|while|return|switch/.test(solution);
    const hasLoops = /for|while/.test(solution);
    const hasConditionals = /if|switch/.test(solution);
    const hasReturns = /return/.test(solution);
    const hasVariables = /let|const|var|\w+\s*=/.test(solution);
    
    // Code quality indicators
    const hasComments = /\/\/|\/\*|\#/.test(solution);
    const hasGoodNaming = !/\b[a-z]\b|\btemp\b|\bdata\b|\bvar\b/.test(solution);
    const hasEdgeCases = /null|undefined|empty|length|0/.test(solution);
    
    // Calculate base score with realistic standards
    let score = 0;
    
    // Basic implementation (40% max)
    if (hasCode) score += 10;
    if (hasFunction) score += 15;
    if (hasLogic) score += 15;
    
    // Algorithm completeness (30% max)
    if (hasLoops) score += 10;
    if (hasConditionals) score += 10;
    if (hasReturns) score += 10;
    
    // Code quality (20% max)
    if (hasVariables) score += 5;
    if (hasGoodNaming) score += 5;
    if (hasComments) score += 5;
    if (hasEdgeCases) score += 5;
    
    // Difficulty adjustment (harsh)
    const difficultyPenalty = {
      easy: 0,
      medium: -10,
      hard: -20
    };
    score += difficultyPenalty[difficulty];
    
    // Realistic penalties
    score -= (hintsUsed * 10); // Harsh hint penalty
    if (timeSpent > timeLimit) {
      score -= 15; // Time penalty
    }
    if (timeSpent > timeLimit * 1.5) {
      score -= 10; // Additional penalty for significant overtime
    }
    
    // Ensure realistic score range
    score = Math.max(score, 0);
    score = Math.min(score, 85); // Cap at 85 for basic evaluation
    
    // Determine correctness with high standards
    const isCorrect = score >= 70 && hasFunction && hasLogic && hasReturns;
    
    // Generate realistic feedback
    let feedback = '';
    let suggestions: string[] = [];
    
    if (score >= 70) {
      feedback = `Your solution demonstrates solid understanding of the problem. Score: ${score}/100. `;
      if (hintsUsed > 0) {
        feedback += `However, using ${hintsUsed} hint(s) reduced your score significantly. `;
      }
      if (timeSpent > timeLimit) {
        feedback += `Time management could be improved (${Math.round(timeSpent)}s vs ${timeLimit}s limit). `;
      }
      suggestions = [
        'Practice solving similar problems without hints',
        'Focus on optimizing your time complexity',
        'Consider edge cases and error handling'
      ];
    } else if (score >= 50) {
      feedback = `Your solution shows partial understanding but needs significant improvement. Score: ${score}/100. `;
      if (!hasFunction) feedback += 'Missing proper function structure. ';
      if (!hasLogic) feedback += 'Incomplete algorithm implementation. ';
      suggestions = [
        'Review the problem requirements carefully',
        'Implement complete algorithm logic',
        'Test your solution with sample inputs',
        'Practice basic programming constructs'
      ];
    } else {
      feedback = `Your solution needs major improvements to meet professional standards. Score: ${score}/100. `;
      feedback += 'Focus on implementing a complete, working solution first.';
      suggestions = [
        'Start with a working brute force solution',
        'Break down the problem into smaller steps',
        'Review similar solved examples',
        'Practice fundamental programming concepts'
      ];
    }
    
    console.log(`📊 Basic evaluation complete: ${score}/100, Correct: ${isCorrect}`);
    
    // Get detailed analysis data
    const complexityAnalysis = this.analyzeCodeComplexity(solution);
    const performanceAnalysis = this.analyzePerformance(solution, difficulty);
    const plagiarismCheck = this.checkCommonPatterns(solution, 'Challenge');
    
    return {
      isCorrect,
      score: Math.round(score),
      feedback,
      suggestions,
      timeComplexity: 'Not analyzed',
      spaceComplexity: 'Not analyzed',
      lineByLineAnalysis: [
        {
          line: 1,
          code: solution.split('\n')[0] || 'No code provided',
          issue: score < 70 ? 'Solution needs improvement' : 'Code structure looks good',
          severity: score < 50 ? 'high' as const : score < 70 ? 'medium' as const : 'low' as const,
          suggestion: score < 70 ? 'Review algorithm logic and implementation' : 'Consider adding more comments for clarity'
        }
      ],
      codeQualityMetrics: {
        cyclomaticComplexity: complexityAnalysis.cyclomaticComplexity,
        maintainabilityIndex: complexityAnalysis.maintainabilityIndex,
        duplicatedLines: this.findDuplicatedCode(solution),
        codeSmells: complexityAnalysis.codeSmells,
        namingConventions: "7/10"
      },
      performanceAnalysis: {
        bottlenecks: performanceAnalysis.bottlenecks,
        optimizationOpportunities: performanceAnalysis.optimizationOpportunities,
        memoryUsage: "Basic analysis - detailed profiling not available",
        runtimePrediction: performanceAnalysis.expectedComplexity
      },
      edgeCaseAnalysis: {
        coveredCases: ["Basic functionality"],
        missedCases: score < 70 ? ["Empty input", "Large datasets", "Edge values"] : ["Advanced edge cases"],
        testCaseRecommendations: [
          "Test with empty input",
          "Test with single element",
          "Test with maximum constraints",
          "Test with invalid input"
        ]
      },
      interviewFeedback: {
        strengths: score >= 70 ? ["Working solution", "Good problem understanding"] : ["Attempted solution"],
        weaknesses: score < 70 ? ["Algorithm implementation", "Code structure", "Edge case handling"] : ["Minor optimizations possible"],
        nextSteps: [
          "Practice similar algorithmic problems",
          "Focus on code optimization",
          "Study time/space complexity analysis",
          "Improve error handling"
        ],
        industryReadiness: `${Math.min(score + 10, 100)}% - ${score >= 80 ? 'Good progress' : score >= 60 ? 'Needs improvement' : 'Significant work needed'}`
      },
      reasoning: `Score: ${Math.round(score)}/100. Evaluation based on: correctness (${isCorrect ? 'PASS' : 'FAIL'}), code structure, hints used (${hintsUsed}), time management (${timeSpent}s/${timeLimit}s). ${hintsUsed > 0 ? `Hint penalty: -${hintsUsed * 10} points. ` : ''}${timeSpent > timeLimit ? `Time penalty: -15 points. ` : ''}Professional interview standards applied.`
    };
  }

  /**
   * Analyze code complexity with cyclomatic complexity scoring
   */
  private static analyzeCodeComplexity(code: string): {
    score: number;
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    codeSmells: string[];
  } {
    console.log('🔬 Analyzing code complexity...');
    
    // Calculate cyclomatic complexity
    let cyclomaticComplexity = 1; // Base complexity
    
    // Handle word-boundary keywords
    const wordKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch'];
    wordKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        cyclomaticComplexity += matches.length;
      }
    });
    
    // Handle special operator keywords that don't need word boundaries
    const operatorKeywords = [
      { pattern: '&&', regex: /&&/g },
      { pattern: '||', regex: /\|\|/g },
      { pattern: '?', regex: /\?/g }
    ];
    operatorKeywords.forEach(({ regex }) => {
      const matches = code.match(regex);
      if (matches) {
        cyclomaticComplexity += matches.length;
      }
    });
    
    // Analyze code smells
    const codeSmells: string[] = [];
    
    // Long method detection
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 50) {
      codeSmells.push('Method too long (>50 lines)');
    }
    
    // Magic numbers
    const magicNumbers = code.match(/\b\d{2,}\b/g);
    if (magicNumbers && magicNumbers.length > 2) {
      codeSmells.push(`Magic numbers detected: ${magicNumbers.join(', ')}`);
    }
    
    // Nested loops
    const nestedLoopPattern = /for\s*\([^}]*for\s*\(|while\s*\([^}]*while\s*\(/g;
    if (nestedLoopPattern.test(code)) {
      codeSmells.push('Nested loops detected - potential O(n²) complexity');
    }
    
    // Variable naming
    const poorNaming = /\b[a-z]\b|\btemp\b|\bdata\b|\bvar\d+\b/g;
    const poorNames = code.match(poorNaming);
    if (poorNames && poorNames.length > 0) {
      codeSmells.push(`Poor variable naming: ${poorNames.join(', ')}`);
    }
    
    // Code duplication
    const duplicatedLines = this.findDuplicatedCode(code);
    if (duplicatedLines > 0) {
      codeSmells.push(`${duplicatedLines} duplicated lines detected`);
    }
    
    // Calculate maintainability index (simplified)
    const maintainabilityIndex = Math.max(0, 100 - (cyclomaticComplexity * 2) - (codeSmells.length * 5));
    
    // Overall complexity score
    const score = Math.max(0, 100 - (cyclomaticComplexity * 3) - (codeSmells.length * 8));
    
    return {
      score: Math.round(score),
      cyclomaticComplexity,
      maintainabilityIndex: Math.round(maintainabilityIndex),
      codeSmells
    };
  }

  /**
   * Analyze performance characteristics
   */
  private static analyzePerformance(code: string, difficulty: string): {
    rating: string;
    bottlenecks: string[];
    optimizationOpportunities: string[];
    expectedComplexity: string;
  } {
    console.log('⚡ Analyzing performance characteristics...');
    
    const bottlenecks: string[] = [];
    const optimizationOpportunities: string[] = [];
    
    // Detect nested loops (O(n²) or worse)
    if (/for\s*\([^}]*for\s*\(|while\s*\([^}]*while\s*\(/g.test(code)) {
      bottlenecks.push('Nested loops detected - O(n²) time complexity');
      optimizationOpportunities.push('Consider using hash maps or two-pointer technique');
    }
    
    // Detect recursive calls without memoization
    if (/function\s+\w+.*\{[^}]*\w+\s*\(/g.test(code) && !code.includes('memo') && !code.includes('cache')) {
      bottlenecks.push('Recursive calls without memoization');
      optimizationOpportunities.push('Add memoization to avoid redundant calculations');
    }
    
    // Detect array operations in loops
    if (/for.*\{[^}]*\.push\(|for.*\{[^}]*\.splice\(/g.test(code)) {
      bottlenecks.push('Array modifications in loops');
      optimizationOpportunities.push('Pre-allocate arrays or use more efficient data structures');
    }
    
    // Detect string concatenation in loops
    if (/for.*\{[^}]*\+\s*=.*["'`]/g.test(code)) {
      bottlenecks.push('String concatenation in loops');
      optimizationOpportunities.push('Use array.join() or StringBuilder pattern');
    }
    
    // Detect inefficient sorting
    if (code.includes('sort()') && code.includes('for')) {
      bottlenecks.push('Sorting inside loops');
      optimizationOpportunities.push('Sort once outside the loop or use different approach');
    }
    
    // Expected complexity based on patterns
    let expectedComplexity = 'O(n)';
    if (/for\s*\([^}]*for\s*\(/g.test(code)) {
      expectedComplexity = 'O(n²)';
    } else if (code.includes('sort')) {
      expectedComplexity = 'O(n log n)';
    } else if (/while.*while|for.*while/g.test(code)) {
      expectedComplexity = 'O(n²)';
    }
    
    // Performance rating
    const bottleneckCount = bottlenecks.length;
    let rating = 'Excellent';
    if (bottleneckCount > 3) rating = 'Poor';
    else if (bottleneckCount > 1) rating = 'Fair';
    else if (bottleneckCount > 0) rating = 'Good';
    
    return {
      rating,
      bottlenecks,
      optimizationOpportunities,
      expectedComplexity
    };
  }

  /**
   * Check for common solution patterns (plagiarism detection)
   */
  private static checkCommonPatterns(code: string, problemTitle: string): {
    similarity: number;
    detectedPatterns: string[];
    originalityScore: number;
  } {
    console.log('🔍 Checking for common solution patterns...');
    
    const detectedPatterns: string[] = [];
    let similarityScore = 0;
    
    // Common algorithm patterns
    const patterns = {
      'Two Pointer': /left.*right|start.*end.*while/g,
      'Sliding Window': /window|left.*right.*while.*expand/g,
      'Hash Map': /Map\(\)|new Map|{.*}/g,
      'Binary Search': /left.*right.*mid|while.*left.*right/g,
      'Dynamic Programming': /dp\[|memo\[|cache\[/g,
      'Recursion': /function.*return.*\(/g,
      'Greedy': /Math\.max|Math\.min.*for/g,
      'Divide and Conquer': /merge|split.*recursive/g
    };
    
    Object.entries(patterns).forEach(([patternName, regex]) => {
      if (regex.test(code)) {
        detectedPatterns.push(patternName);
        similarityScore += 15; // Each pattern adds similarity
      }
    });
    
    // Check for extremely common variable names
    const commonVarNames = ['i', 'j', 'k', 'left', 'right', 'result', 'temp'];
    const varMatches = commonVarNames.filter(varName => 
      new RegExp(`\\b${varName}\\b`, 'g').test(code)
    );
    similarityScore += varMatches.length * 5;
    
    // Check for common function structures
    if (/function \w+\(.*\) \{[\s\S]*return[\s\S]*\}/.test(code)) {
      similarityScore += 10;
    }
    
    // Originality score (inverse of similarity)
    const originalityScore = Math.max(0, 100 - similarityScore);
    
    return {
      similarity: Math.min(100, similarityScore),
      detectedPatterns,
      originalityScore
    };
  }

  /**
   * Find duplicated code lines
   */
  private static findDuplicatedCode(code: string): number {
    const lines = code.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 5); // Ignore very short lines
    
    const lineCount = new Map<string, number>();
    let duplicatedLines = 0;
    
    lines.forEach(line => {
      const count = lineCount.get(line) || 0;
      lineCount.set(line, count + 1);
      
      if (count === 1) { // First duplicate
        duplicatedLines += 2; // Count both original and duplicate
      } else if (count > 1) { // Additional duplicates
        duplicatedLines += 1;
      }
    });
    
    return duplicatedLines;
  }

  private static basicSolutionEvaluation(
    solution: string,
    timeSpent: number,
    timeLimit: number
  ): SolutionEvaluation {
    // Legacy method - redirect to realistic evaluation
    return this.realisticBasicEvaluation(solution, timeSpent, timeLimit, 0, 'medium');
  }

  /**
   * Get hint for challenge
   */
  static async getHint(challenge: GameChallenge, progress: string): Promise<string> {
    try {
      const prompt = `Provide a helpful hint for this challenge:

CHALLENGE: ${challenge.title}
DESCRIPTION: ${challenge.description}
USER PROGRESS: ${progress}

Give a constructive hint without revealing the solution.`;

      if (this.OPENROUTER_API_KEY) {
        const response = await this.callOpenRouter(prompt);
        if (response.success && response.data) {
          return response.data.trim();
        }
      }
    } catch (error) {
      console.warn('AI hint generation failed:', error);
    }

    // Fallback to predefined hints
    const hints = challenge.hints || ['Think step by step', 'Consider edge cases'];
    return hints[Math.floor(Math.random() * hints.length)];
  }
}

// Default export for compatibility
export default AIGamingService;
