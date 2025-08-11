interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ProblemContext {
  title: string;
  difficulty: string;
  topic: string;
  companies: string[];
  leetcodeUrl?: string;
  gfgUrl?: string;
}

import { LocalSimilarProblemsService } from './localSimilarProblemsService';

export class OpenRouterAIService {
  // Using OpenRouter for better reliability and free models
  private static readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private static readonly MODEL_NAME = 'google/gemma-2-9b-it:free'; // Free model
  // Alternative free models: 'meta-llama/llama-3.1-8b-instruct:free', 'microsoft/phi-3-mini-128k-instruct:free'

  private static getApiKey(): string | null {
    // Try OpenRouter API key first, then fallback to Gemini
    return import.meta.env.VITE_OPENROUTER_API_KEY || 
           import.meta.env.VITE_GEMINI_API_KEY || 
           import.meta.env.VITE_GOOGLE_API_KEY || 
           null;
  }

  private static isConfigured(): boolean {
    return !!this.getApiKey();
  }

  /**
   * Generate AI assistance for a specific problem
   */
  static async getProblemHelp(
    problem: ProblemContext,
    userQuery: string,
    conversationHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your environment variables.');
    }

    const systemPrompt = this.createSystemPrompt(problem);
    
    // Convert conversation history to OpenRouter format
    const messages: ChatMessage[] = [
      { role: 'assistant', content: systemPrompt },
      { role: 'assistant', content: 'I understand. I\'m ready to help you with this problem. What would you like to know?' }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts[0].text
      });
    });

    // Add current user query
    messages.push({ role: 'user', content: userQuery });

    try {
      const response = await this.makeAPICall(messages);
      return response;
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      throw new Error('Failed to get AI assistance. Please try again.');
    }
  }

  /**
   * Generate hints for a problem without giving away the solution
   */
  static async getHints(problem: ProblemContext): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key not configured.');
    }

    const prompt = `Generate 3 progressive hints for this ${problem.difficulty} level ${problem.topic} problem: "${problem.title}".

Requirements:
- Hint 1: General approach or pattern to consider
- Hint 2: More specific technique or data structure
- Hint 3: Key insight without revealing the complete solution
- Keep hints concise (1-2 sentences each)
- Don't include actual code
- Format as a simple numbered list

Example format:
1. Consider the problem constraints and think about which data structure would be most efficient
2. Look for patterns in the input that might suggest a specific algorithmic approach
3. Think about the time complexity requirements and how that guides your solution choice`;

    try {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: 'You are a helpful coding mentor who provides progressive hints without giving away solutions.' },
        { role: 'user', content: prompt }
      ];

      const response = await this.makeAPICall(messages);
      
      // Parse the response into individual hints
      const lines = response.split('\n').filter(line => line.trim());
      const hints = lines
        .filter(line => /^\d+\./.test(line.trim())) // Lines starting with numbers
        .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbering
        .slice(0, 3); // Take first 3 hints
      
      return hints.length > 0 ? hints : ['Think about the problem step by step', 'Consider what data structure would be most efficient', 'Look for patterns in the constraints'];
    } catch (error) {
      console.error('Error getting hints:', error);
      return ['Think about the problem step by step', 'Consider what data structure would be most efficient', 'Look for patterns in the constraints'];
    }
  }

  /**
   * Analyze user's approach and provide feedback
   */
  static async analyzeApproach(
    problem: ProblemContext,
    userApproach: string
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key not configured.');
    }

    const prompt = `Analyze this approach for the ${problem.difficulty} level problem "${problem.title}":

User's Approach:
${userApproach}

Please provide:
1. Correctness assessment
2. Time and space complexity analysis
3. Potential improvements or optimizations
4. Edge cases to consider
5. Alternative approaches if applicable

Be constructive and educational in your feedback.`;

    try {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: 'You are an expert code reviewer who provides constructive feedback on algorithmic approaches.' },
        { role: 'user', content: prompt }
      ];

      const response = await this.makeAPICall(messages);
      return response;
    } catch (error) {
      console.error('Error analyzing approach:', error);
      throw new Error('Failed to analyze approach. Please try again.');
    }
  }

  /**
   * Get similar problems using both local dsa.json data and AI generation
   */
  static async getSimilarProblems(problem: ProblemContext): Promise<string[]> {
    try {
      // Step 1: Get similar problems from local dsa.json (3 problems)
      const localProblems = LocalSimilarProblemsService.findSimilarProblems(problem, 3);
      
      // Step 2: Get AI-generated similar problems (2 problems)
      let aiProblems: string[] = [];
      
      if (this.isConfigured()) {
        try {
          const prompt = `Based on the problem "${problem.title}" (${problem.difficulty} level, ${problem.topic} topic), suggest 2 additional similar practice problems that would complement these existing recommendations:

${localProblems.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Requirements:
- Different from the problems listed above
- Similar difficulty and topic focus
- Include actual LeetCode or GeeksforGeeks links
- Format: **Problem Name** (Difficulty) - Brief description | [Link](actual_url)

Examples of good format:
**Two Sum** (Easy) - Find two numbers that add up to target | [Link](https://leetcode.com/problems/two-sum/)
**Valid Parentheses** (Easy) - Check if brackets are balanced | [Link](https://leetcode.com/problems/valid-parentheses/)

Focus on problems that fill gaps or provide different perspectives on the same concepts. MUST include working links to LeetCode or GeeksforGeeks.`;

          const messages: ChatMessage[] = [
            { role: 'assistant', content: 'You are a coding education expert who recommends complementary practice problems.' },
            { role: 'user', content: prompt }
          ];

          const response = await this.makeAPICall(messages, 500); // Shorter response for efficiency
          
          // Parse AI response
          const lines = response.split('\n').filter(line => line.trim());
          aiProblems = lines
            .filter(line => line.includes('**') || /^\d+\./.test(line.trim()))
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .slice(0, 2);
            
        } catch (aiError) {
          console.log('AI generation failed, using local problems only:', aiError);
        }
      }

      // Step 3: Combine results
      const combinedProblems = [...localProblems];
      
      // Add AI problems if available
      if (aiProblems.length > 0) {
        combinedProblems.push(...aiProblems);
      } else {
        // Fallback: Get more local problems if AI fails
        const additionalLocal = LocalSimilarProblemsService.findSimilarProblems(problem, 5)
          .slice(3, 5); // Get problems 4-5 from local search
        combinedProblems.push(...additionalLocal);
      }

      // Step 4: Add source indicators
      const finalProblems = combinedProblems.map((problem, index) => {
        const source = index < localProblems.length ? '🏠' : '🤖';
        return `${source} ${problem}`;
      });

      return finalProblems.length > 0 ? finalProblems : [
        '🏠 **Two Sum** (Easy) - Arrays | Companies: Amazon, Microsoft, Google',
        '🏠 **Valid Parentheses** (Easy) - Strings | Companies: Amazon, Microsoft, Facebook',
        '🏠 **Maximum Subarray** (Easy) - Arrays | Companies: Microsoft, Facebook',
        '🤖 **Binary Tree Inorder Traversal** (Medium) - Trees | Companies: Amazon, Microsoft',
        '🤖 **Merge Two Sorted Lists** (Easy) - Linked Lists | Companies: Amazon, Microsoft'
      ];
      
    } catch (error) {
      console.error('Error getting hybrid similar problems:', error);
      
      // Ultimate fallback: Try local only
      try {
        const localOnly = LocalSimilarProblemsService.findSimilarProblems(problem, 5);
        return localOnly.map(p => `🏠 ${p}`);
      } catch (localError) {
        return [
          '🏠 **Two Sum** (Easy) - Arrays | Companies: Amazon, Microsoft, Google',
          '🏠 **Valid Parentheses** (Easy) - Strings | Companies: Amazon, Microsoft, Facebook',
          '🏠 **Maximum Subarray** (Easy) - Arrays | Companies: Microsoft, Facebook',
          '🤖 **Binary Tree Inorder Traversal** (Medium) - Trees | Companies: Amazon, Microsoft',
          '🤖 **Merge Two Sorted Lists** (Easy) - Linked Lists | Companies: Amazon, Microsoft'
        ];
      }
    }
  }

  /**
   * Create system prompt based on problem context
   */
  private static createSystemPrompt(problem: ProblemContext): string {
    return `You are an expert coding mentor helping with Data Structures and Algorithms problems.

Current Problem Context:
- Title: ${problem.title}
- Difficulty: ${problem.difficulty}
- Topic: ${problem.topic}
- Companies: ${problem.companies.join(', ')}

Your role:
- Provide helpful guidance without giving away complete solutions
- Explain concepts clearly and progressively
- Suggest approaches and patterns to consider
- Help with debugging and optimization
- Encourage learning through understanding

Guidelines:
- Be encouraging and supportive
- Provide step-by-step guidance when needed
- Use examples to illustrate concepts
- Ask clarifying questions when helpful
- Focus on teaching problem-solving strategies`;
  }

  /**
   * Make API call to OpenRouter
   */
  private static async makeAPICall(
    messages: ChatMessage[],
    maxTokens: number = 1000
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const requestBody = {
      model: this.MODEL_NAME,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.95,
    };

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'DSA Learning Platform'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      throw error;
    }
  }

  /**
   * Check if the service is properly configured
   */
  static checkConfiguration(): { configured: boolean; message: string } {
    if (this.isConfigured()) {
      return {
        configured: true,
        message: 'OpenRouter AI integration is ready!'
      };
    }

    return {
      configured: false,
      message: 'To enable OpenRouter AI integration, add your OpenRouter API key to the environment variables as VITE_OPENROUTER_API_KEY.'
    };
  }
}
