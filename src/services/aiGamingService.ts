interface GameChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  hints: string[];
  solution: string;
  explanation: string;
  points: number;
  timeLimit: number; // in seconds
  perfectTime: number; // perfect completion time in seconds for bonus scoring
}

interface GameSession {
  id: string;
  userId: string;
  challengeId: string;
  startTime: Date;
  endTime?: Date;
  score: number;
  hintsUsed: number;
  completed: boolean;
  timeSpent: number;
}

interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class AIGamingService {
  private static readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
  private static readonly API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // Game categories for DSA learning
  private static readonly GAME_CATEGORIES = [
    'Array Manipulation',
    'String Processing',
    'Linked Lists',
    'Stacks & Queues',
    'Trees & Graphs',
    'Sorting Algorithms',
    'Searching Techniques',
    'Dynamic Programming',
    'Recursion',
    'Hash Tables'
  ];

  /**
   * Calculate perfect time based on difficulty level (aligned with DSA project guidelines)
   */
  private static getPerfectTime(difficulty: 'easy' | 'medium' | 'hard'): number {
    switch (difficulty) {
      case 'easy':
        return 480; // 8 minutes - perfect time for easy problems (5-10 mins range)
      case 'medium':
        return 1080; // 18 minutes - perfect time for medium problems (15-20 mins range)
      case 'hard':
        return 3000; // 50 minutes - perfect time for hard problems (40-60 mins range)
      default:
        return 1080;
    }
  }

  /**
   * Generate a new game challenge using AI
   */
  static async generateChallenge(
    difficulty: 'easy' | 'medium' | 'hard',
    category: string,
    userLevel: number = 1
  ): Promise<GameChallenge | null> {
    console.log(`🎯 Generating ${difficulty} challenge for ${category} (level ${userLevel})`);
    
    try {
      const prompt = this.createChallengePrompt(difficulty, category, userLevel);
      const response = await this.callGeminiAPI(prompt);
      
      if (response.success && response.data) {
        console.log('✅ AI response received, parsing...');
        const challenge = this.parseAIResponse(response.data, difficulty, category);
        console.log('✅ Challenge parsed successfully:', challenge.title);
        return challenge;
      }
      
      console.warn('⚠️ AI response failed, using fallback challenge');
      return this.getFallbackChallenge(difficulty, category);
    } catch (error) {
      console.error('❌ Error generating challenge:', error);
      console.log('🔄 Using fallback challenge instead');
      return this.getFallbackChallenge(difficulty, category);
    }
  }

  /**
   * Get AI-powered hint for a challenge
   */
  static async getHint(challenge: GameChallenge, currentProgress: string): Promise<string> {
    try {
      const prompt = `
        Challenge: ${challenge.title}
        Description: ${challenge.description}
        User's current progress: ${currentProgress}
        
        Provide a helpful hint that guides the user toward the solution without giving it away completely.
        The hint should be encouraging and educational, suitable for a beginner.
        Keep it under 100 words.
      `;

      const response = await this.callGeminiAPI(prompt);
      
      if (response.success && response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text.trim();
      }
      
      return challenge.hints[Math.floor(Math.random() * challenge.hints.length)];
    } catch (error) {
      console.error('Error getting hint:', error);
      return challenge.hints[Math.floor(Math.random() * challenge.hints.length)];
    }
  }

  /**
   * Get AI explanation for solution
   */
  static async getExplanation(challenge: GameChallenge, userSolution: string): Promise<string> {
    try {
      const prompt = `
        Challenge: ${challenge.title}
        Correct Solution: ${challenge.solution}
        User's Solution: ${userSolution}
        
        Provide a detailed explanation of the solution, highlighting:
        1. The approach used
        2. Time and space complexity
        3. Why this solution works
        4. Any optimizations possible
        
        If the user's solution is different, compare it with the optimal solution.
        Keep the explanation beginner-friendly and encouraging.
      `;

      const response = await this.callGeminiAPI(prompt);
      
      if (response.success && response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text.trim();
      }
      
      return challenge.explanation;
    } catch (error) {
      console.error('Error getting explanation:', error);
      return challenge.explanation;
    }
  }

  /**
   * Generate personalized learning path
   */
  static async generateLearningPath(
    userProgress: any,
    weakAreas: string[],
    strengths: string[]
  ): Promise<string[]> {
    try {
      const prompt = `
        User Progress Analysis:
        - Completed challenges: ${userProgress.completedChallenges || 0}
        - Average score: ${userProgress.averageScore || 0}
        - Weak areas: ${weakAreas.join(', ')}
        - Strong areas: ${strengths.join(', ')}
        
        Generate a personalized learning path with 5 recommended topics/challenges
        that will help improve the user's weak areas while building on their strengths.
        Focus on DSA concepts suitable for beginners.
        
        Return as a simple list of topics, one per line.
      `;

      const response = await this.callGeminiAPI(prompt);
      
      if (response.success && response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = response.data.candidates[0].content.parts[0].text.trim();
        return text.split('\n').filter((line: string) => line.trim()).slice(0, 5);
      }
      
      return this.getDefaultLearningPath();
    } catch (error) {
      console.error('Error generating learning path:', error);
      return this.getDefaultLearningPath();
    }
  }

  /**
   * Call Gemini API with improved error handling
   */
  private static async callGeminiAPI(prompt: string): Promise<AIResponse> {
    if (!this.API_KEY) {
      console.warn('🔑 Gemini API key not configured - using fallback responses');
      return { success: false, error: 'API key not configured' };
    }

    try {
      console.log('🌐 Making API call to Gemini...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${this.GEMINI_API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ API request failed: ${response.status} - ${errorText}`);
        
        if (response.status === 404) {
          throw new Error(`API endpoint not found. Please check if the Gemini API model is available.`);
        } else if (response.status === 403) {
          throw new Error(`API key invalid or quota exceeded. Please check your Gemini API key.`);
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Please wait a moment and try again.`);
        } else {
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('✅ API response received successfully');
      return { success: true, data };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('⏰ API request timed out');
        return { success: false, error: 'Request timed out' };
      }
      
      console.error('❌ Gemini API call failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create challenge generation prompt
   */
  private static createChallengePrompt(
    difficulty: string,
    category: string,
    userLevel: number
  ): string {
    return `
      Create a ${difficulty} level coding challenge for the topic: ${category}
      Target audience: DSA beginners (level ${userLevel})
      
      Generate a JSON response with the following structure:
      {
        "title": "Challenge title",
        "description": "Clear problem description with examples",
        "hints": ["hint1", "hint2", "hint3"],
        "solution": "Sample solution code",
        "explanation": "Step-by-step explanation of the solution",
        "timeLimit": 300
      }
      
      Requirements:
      - Make it educational and engaging
      - Include 2-3 helpful hints
      - Provide a clear, commented solution
      - Explanation should teach the concept
      - Time limit appropriate for difficulty level
      
      Return only valid JSON.
    `;
  }

  /**
   * Parse AI response into GameChallenge
   */
  private static parseAIResponse(
    data: any,
    difficulty: string,
    category: string
  ): GameChallenge {
    try {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No text in response');

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: parsed.title || 'AI Generated Challenge',
        description: parsed.description || 'Solve this coding challenge',
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        category,
        hints: Array.isArray(parsed.hints) ? parsed.hints : ['Think step by step', 'Consider edge cases'],
        solution: parsed.solution || '// Solution code here',
        explanation: parsed.explanation || 'This solution works by...',
        points: this.getPointsForDifficulty(difficulty),
        timeLimit: parsed.timeLimit || this.getTimeLimitForDifficulty(difficulty),
        perfectTime: this.getPerfectTime(difficulty as 'easy' | 'medium' | 'hard')
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw error;
    }
  }

  /**
   * Get fallback challenge when AI fails
   */
  private static getFallbackChallenge(
    difficulty: string,
    category: string
  ): GameChallenge {
    const fallbackChallenges = {
      easy: {
        title: 'Find Maximum Element',
        description: 'Write a function to find the maximum element in an array of integers.',
        hints: ['Iterate through the array', 'Keep track of the maximum value seen so far', 'Update maximum when you find a larger value'],
        solution: 'function findMax(arr) {\n  let max = arr[0];\n  for (let i = 1; i < arr.length; i++) {\n    if (arr[i] > max) max = arr[i];\n  }\n  return max;\n}',
        explanation: 'We iterate through the array once, keeping track of the maximum value. Time complexity: O(n), Space complexity: O(1).'
      },
      medium: {
        title: 'Two Sum Problem',
        description: 'Given an array of integers and a target sum, find two numbers that add up to the target.',
        hints: ['Use a hash map for O(n) solution', 'Store complement values', 'Check if current number\'s complement exists'],
        solution: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}',
        explanation: 'We use a hash map to store numbers and their indices. For each number, we check if its complement exists in the map.'
      },
      hard: {
        title: 'Longest Palindromic Substring',
        description: 'Find the longest palindromic substring in a given string.',
        hints: ['Expand around centers', 'Consider both odd and even length palindromes', 'Use dynamic programming approach'],
        solution: 'function longestPalindrome(s) {\n  let start = 0, maxLen = 1;\n  \n  function expandAroundCenter(left, right) {\n    while (left >= 0 && right < s.length && s[left] === s[right]) {\n      const len = right - left + 1;\n      if (len > maxLen) {\n        start = left;\n        maxLen = len;\n      }\n      left--;\n      right++;\n    }\n  }\n  \n  for (let i = 0; i < s.length; i++) {\n    expandAroundCenter(i, i);\n    expandAroundCenter(i, i + 1);\n  }\n  \n  return s.substring(start, start + maxLen);\n}',
        explanation: 'We expand around each possible center (both single characters and between characters) to find palindromes.'
      }
    };

    const challenge = fallbackChallenges[difficulty as keyof typeof fallbackChallenges];
    
    return {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: challenge.title,
      description: challenge.description,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      category,
      hints: challenge.hints,
      solution: challenge.solution,
      explanation: challenge.explanation,
      points: this.getPointsForDifficulty(difficulty),
      timeLimit: this.getTimeLimitForDifficulty(difficulty),
      perfectTime: this.getPerfectTime(difficulty as 'easy' | 'medium' | 'hard')
    };
  }

  /**
   * Get points based on difficulty
   */
  private static getPointsForDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 100;
      case 'medium': return 250;
      case 'hard': return 500;
      default: return 100;
    }
  }

  /**
   * Get time limit based on difficulty (aligned with DSA project guidelines)
   */
  private static getTimeLimitForDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 600; // 10 minutes (upper bound of 5-10 mins range)
      case 'medium': return 1200; // 20 minutes (upper bound of 15-20 mins range)
      case 'hard': return 3600; // 60 minutes (upper bound of 40-60 mins range)
      default: return 600;
    }
  }

  /**
   * Get default learning path
   */
  private static getDefaultLearningPath(): string[] {
    return [
      'Arrays and Basic Operations',
      'String Manipulation Techniques',
      'Introduction to Recursion',
      'Stack and Queue Fundamentals',
      'Basic Sorting Algorithms'
    ];
  }

  /**
   * Get available game categories
   */
  static getGameCategories(): string[] {
    return [...this.GAME_CATEGORIES];
  }

  /**
   * Validate user solution using AI or basic checks
   */
  static async validateSolution(
    challenge: GameChallenge,
    userCode: string
  ): Promise<{
    isCorrect: boolean;
    feedback: string;
    score: number;
    suggestions?: string[];
  }> {
    console.log('🔍 Validating solution for:', challenge.title);
    
    // Basic validation checks
    if (!userCode.trim()) {
      return {
        isCorrect: false,
        feedback: "No solution provided. Please write your code before submitting.",
        score: 0,
        suggestions: ["Write a function that solves the problem", "Start with the basic algorithm structure"]
      };
    }

    // Check for basic syntax and structure
    const basicChecks = this.performBasicValidation(userCode, challenge);
    if (!basicChecks.isValid) {
      return {
        isCorrect: false,
        feedback: basicChecks.feedback,
        score: 0,
        suggestions: basicChecks.suggestions
      };
    }

    // Try AI validation first
    try {
      const aiValidation = await this.validateWithAI(challenge, userCode);
      if (aiValidation) {
        return aiValidation;
      }
    } catch (error) {
      console.warn('⚠️ AI validation failed, using fallback validation');
    }

    // Fallback to pattern-based validation
    return this.performPatternValidation(challenge, userCode);
  }

  /**
   * Perform basic code validation
   */
  private static performBasicValidation(userCode: string, challenge: GameChallenge): {
    isValid: boolean;
    feedback: string;
    suggestions: string[];
  } {
    const code = userCode.toLowerCase().trim();
    
    // Check for minimum code length
    if (code.length < 20) {
      return {
        isValid: false,
        feedback: "Solution seems too short. Please provide a more complete implementation.",
        suggestions: [
          "Add proper function structure",
          "Include variable declarations",
          "Add logic to solve the problem"
        ]
      };
    }

    // Check for common programming constructs based on difficulty
    const hasFunction = /function|def|=>|class/.test(code);
    const hasLoop = /for|while|foreach|map|reduce|filter/.test(code);
    const hasConditional = /if|else|switch|case|\?/.test(code);
    const hasReturn = /return/.test(code);

    if (challenge.difficulty === 'easy') {
      if (!hasFunction && !hasReturn) {
        return {
          isValid: false,
          feedback: "Your solution should include a function that returns a result.",
          suggestions: [
            "Create a function to solve the problem",
            "Make sure to return the result",
            "Use proper function syntax"
          ]
        };
      }
    } else if (challenge.difficulty === 'medium' || challenge.difficulty === 'hard') {
      if (!hasFunction || (!hasLoop && !hasConditional)) {
        return {
          isValid: false,
          feedback: "Your solution should include proper logic structure with loops or conditionals.",
          suggestions: [
            "Add loops for iteration if needed",
            "Use conditional statements for decision making",
            "Ensure your algorithm handles all cases"
          ]
        };
      }
    }

    return { isValid: true, feedback: "", suggestions: [] };
  }

  /**
   * Validate solution using AI
   */
  private static async validateWithAI(challenge: GameChallenge, userCode: string): Promise<{
    isCorrect: boolean;
    feedback: string;
    score: number;
    suggestions?: string[];
  } | null> {
    try {
      const prompt = `
        Problem: ${challenge.title}
        Description: ${challenge.description}
        Expected Solution: ${challenge.solution}
        User's Solution: ${userCode}
        
        Analyze the user's solution and provide:
        1. Is it correct? (true/false)
        2. Detailed feedback on the approach
        3. Score out of 100 (0 if incorrect, 60-100 if correct based on quality)
        4. Specific suggestions for improvement
        
        Respond in JSON format:
        {
          "isCorrect": boolean,
          "feedback": "detailed feedback",
          "score": number,
          "suggestions": ["suggestion1", "suggestion2"]
        }
      `;

      const response = await this.callGeminiAPI(prompt);
      
      if (response.success && response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = response.data.candidates[0].content.parts[0].text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            isCorrect: result.isCorrect || false,
            feedback: result.feedback || "Solution analyzed by AI",
            score: result.score || 0,
            suggestions: result.suggestions || []
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ AI validation error:', error);
      return null;
    }
  }

  /**
   * Pattern-based validation for common problems
   */
  private static performPatternValidation(challenge: GameChallenge, userCode: string): {
    isCorrect: boolean;
    feedback: string;
    score: number;
    suggestions?: string[];
  } {
    const code = userCode.toLowerCase();
    const title = challenge.title.toLowerCase();
    
    // Array problems - more strict validation
    if (title.includes('array') || title.includes('maximum') || title.includes('minimum')) {
      if (code.includes('math.max') || code.includes('math.min') || 
          code.includes('for') || code.includes('reduce')) {
        return {
          isCorrect: false, // Changed to false - pattern matching isn't enough for correctness
          feedback: "Your solution shows understanding of array methods, but may not be fully correct. Please verify your logic.",
          score: 50, // Reduced score for partial understanding
          suggestions: ["Test your solution with the given examples", "Consider edge cases like empty arrays", "Verify your algorithm logic"]
        };
      }
    }
    
    // String problems - more strict validation
    if (title.includes('string') || title.includes('palindrome') || title.includes('substring')) {
      if (code.includes('length') || code.includes('substring') || 
          code.includes('split') || code.includes('reverse')) {
        return {
          isCorrect: false, // Changed to false - pattern matching isn't enough
          feedback: "Your solution uses string methods, but may not solve the problem correctly. Review your approach.",
          score: 50, // Reduced score
          suggestions: ["Test with the provided examples", "Check for case sensitivity", "Verify your string manipulation logic"]
        };
      }
    }
    
    // Two pointer or search problems - more strict validation
    if (title.includes('two') || title.includes('sum') || title.includes('search')) {
      if (code.includes('map') || code.includes('set') || 
          code.includes('left') || code.includes('right')) {
        return {
          isCorrect: false, // Changed to false - using data structures doesn't guarantee correctness
          feedback: "You're using appropriate data structures, but the solution may not be complete or correct.",
          score: 60, // Partial credit for good approach
          suggestions: ["Verify your algorithm implementation", "Test with edge cases", "Check if your solution handles all requirements"]
        };
      }
    }

    // Default case - give partial credit for effort
    return {
      isCorrect: false,
      feedback: "Your solution shows effort, but it may not fully solve the problem. Review the requirements and try a different approach.",
      score: 25, // Partial credit for attempting
      suggestions: [
        "Review the problem statement carefully",
        "Break down the problem into smaller steps",
        "Consider using the hints provided",
        "Look at similar problems for inspiration"
      ]
    };
  }

  /**
   * Calculate score based on performance and correctness
   */
  static calculateScore(
    basePoints: number,
    timeSpent: number,
    timeLimit: number,
    hintsUsed: number,
    completed: boolean,
    isCorrect: boolean = true,
    qualityScore: number = 100,
    perfectTime?: number
  ): number {
    if (!completed) return 0;
    if (!isCorrect) return Math.floor(basePoints * 0.25); // 25% for attempt

    // Start with quality-adjusted base points
    let score = Math.floor(basePoints * (qualityScore / 100));
    
    // Enhanced time bonus using perfect time
    if (perfectTime) {
      if (timeSpent <= perfectTime) {
        // Perfect time bonus: up to 100% bonus for completing within perfect time
        const perfectTimeBonus = Math.floor(score * 1.0);
        score += perfectTimeBonus;
      } else {
        // Standard time bonus: up to 50% bonus based on remaining time
        const timeRatio = Math.max(0, (timeLimit - timeSpent) / timeLimit);
        const timeBonus = Math.floor(score * 0.5 * timeRatio);
        score += timeBonus;
      }
    } else {
      // Fallback to original time bonus calculation
      const timeRatio = Math.max(0, (timeLimit - timeSpent) / timeLimit);
      const timeBonus = Math.floor(score * 0.5 * timeRatio);
      score += timeBonus;
    }
    
    // Hint penalty (10% reduction per hint used)
    const hintPenalty = Math.floor(score * 0.1 * hintsUsed);
    score -= hintPenalty;
    
    return Math.max(0, score);
  }

  /**
   * Save game session to localStorage
   */
  static saveGameSession(session: GameSession): void {
    try {
      const sessions = this.getGameSessions();
      sessions.push(session);
      localStorage.setItem('dsa_game_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving game session:', error);
    }
  }

  /**
   * Get all game sessions from localStorage
   */
  static getGameSessions(): GameSession[] {
    try {
      const sessions = localStorage.getItem('dsa_game_sessions');
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error loading game sessions:', error);
      return [];
    }
  }

  /**
   * Get user's gaming statistics
   */
  static getGamingStats(userId: string): {
    totalGames: number;
    completedGames: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    favoriteCategory: string;
    totalTimeSpent: number;
  } {
    const sessions = this.getGameSessions().filter(s => s.userId === userId);
    const completed = sessions.filter(s => s.completed);
    
    if (sessions.length === 0) {
      return {
        totalGames: 0,
        completedGames: 0,
        totalScore: 0,
        averageScore: 0,
        bestScore: 0,
        favoriteCategory: 'Arrays',
        totalTimeSpent: 0
      };
    }

    const totalScore = completed.reduce((sum, s) => sum + s.score, 0);
    const bestScore = Math.max(...completed.map(s => s.score), 0);
    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.timeSpent, 0);

    // Find favorite category (most played)
    const categoryCount: { [key: string]: number } = {};
    sessions.forEach(session => {
      // We'll need to get category from challenge - for now use a default
      const category = 'Arrays'; // This would be fetched from challenge data
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'Arrays'
    );

    return {
      totalGames: sessions.length,
      completedGames: completed.length,
      totalScore,
      averageScore: completed.length > 0 ? Math.round(totalScore / completed.length) : 0,
      bestScore,
      favoriteCategory,
      totalTimeSpent
    };
  }
}

export default AIGamingService;
export type { GameChallenge, GameSession };
