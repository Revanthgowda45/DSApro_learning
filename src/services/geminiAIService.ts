interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
    index: number;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
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

export class GeminiAIService {
  // Using OpenRouter for better reliability and free models
  private static readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private static readonly MODEL_NAME = 'google/gemma-2-9b-it:free'; // Free model
  // Alternative models: 'google/gemini-flash-1.5:free', 'meta-llama/llama-3.1-8b-instruct:free'

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
    conversationHistory: GeminiMessage[] = []
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    const systemPrompt = this.createSystemPrompt(problem);
    
    // Build conversation with system context
    const messages: GeminiMessage[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I\'m ready to help you with this problem. What would you like to know?' }] },
      ...conversationHistory,
      { role: 'user', parts: [{ text: userQuery }] }
    ];

    try {
      const response = await this.makeAPICall(messages);
      return response.candidates[0]?.content?.parts[0]?.text || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to get AI assistance. Please try again.');
    }
  }

  /**
   * Generate hints for a problem without giving away the solution
   */
  static async getHints(problem: ProblemContext): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured.');
    }

    const prompt = `Generate 3 progressive hints for this ${problem.difficulty} level ${problem.topic} problem: "${problem.title}".

Requirements:
- Hint 1: General approach or pattern to consider
- Hint 2: More specific technique or data structure
- Hint 3: Key insight without revealing the complete solution
- Keep hints concise (1-2 sentences each)
- Don't include actual code
- Format as a simple list, one hint per line

Example format:
1. Consider the problem constraints and think about which data structure would be most efficient
2. Look for patterns in the input that might suggest a specific algorithmic approach
3. Think about the time complexity requirements and how that guides your solution choice`;

    try {
      const messages: GeminiMessage[] = [
        { role: 'user', parts: [{ text: 'You are a helpful coding mentor who provides progressive hints without giving away solutions.' }] },
        { role: 'model', parts: [{ text: 'I understand. I will provide helpful progressive hints without spoiling the solution.' }] },
        { role: 'user', parts: [{ text: prompt }] }
      ];

      const response = await this.makeAPICall(messages);
      const content = response.candidates[0]?.content?.parts[0]?.text || '';
      
      // Parse the response into individual hints
      const lines = content.split('\n').filter(line => line.trim());
      const hints = lines
        .filter(line => /^\d+\./.test(line.trim())) // Lines starting with numbers
        .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbering
        .slice(0, 3); // Take first 3 hints
      
      return hints.length > 0 ? hints : [
        'Consider the problem constraints and edge cases',
        'Think about which data structure would be most efficient',
        'Look for patterns or mathematical relationships'
      ];
    } catch (error) {
      console.error('Error generating hints:', error);
      return [
        'Consider the problem constraints and edge cases',
        'Think about which data structure would be most efficient',
        'Look for patterns or mathematical relationships'
      ];
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
      throw new Error('Gemini API key not configured.');
    }

    const prompt = `Analyze this approach for the ${problem.difficulty} problem "${problem.title}":

User's Approach:
${userApproach}

Please provide:
1. What's good about this approach
2. Potential issues or improvements
3. Time/space complexity analysis
4. Alternative approaches to consider

Keep the response constructive and educational.`;

    try {
      const messages: GeminiMessage[] = [
        { role: 'user', parts: [{ text: 'You are an expert coding mentor who provides constructive feedback on problem-solving approaches.' }] },
        { role: 'model', parts: [{ text: 'I understand. I will provide constructive and educational feedback on coding approaches.' }] },
        { role: 'user', parts: [{ text: prompt }] }
      ];

      const response = await this.makeAPICall(messages);
      return response.candidates[0]?.content?.parts[0]?.text || 'Unable to analyze the approach at this time.';
    } catch (error) {
      console.error('Error analyzing approach:', error);
      throw new Error('Failed to analyze approach. Please try again.');
    }
  }

  /**
   * Generate similar problems for practice
   */
  static async getSimilarProblems(problem: ProblemContext): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured.');
    }

    const prompt = `Suggest 5 similar problems to practice after solving "${problem.title}" (${problem.difficulty} ${problem.topic}).

Requirements:
- Similar difficulty level and topic
- Different enough to provide new learning
- Include brief description of each problem
- Format as a numbered list

Focus on problems that reinforce the same concepts and patterns.`;

    try {
      const messages: GeminiMessage[] = [
        { role: 'user', parts: [{ text: 'You are a coding education expert who recommends practice problems.' }] },
        { role: 'model', parts: [{ text: 'I understand. I will recommend similar practice problems that reinforce the same concepts.' }] },
        { role: 'user', parts: [{ text: prompt }] }
      ];

      const response = await this.makeAPICall(messages);
      const content = response.candidates[0]?.content?.parts[0]?.text || '';
      
      // Parse the response into individual problems
      const lines = content.split('\n').filter(line => line.trim());
      const problems = lines
        .filter(line => /^\d+\./.test(line.trim())) // Lines starting with numbers
        .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbering
        .slice(0, 5); // Take first 5 problems
      
      return problems.length > 0 ? problems : ['Unable to generate similar problems at this time.'];
    } catch (error) {
      console.error('Error getting similar problems:', error);
      return ['Unable to generate similar problems at this time.'];
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
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  maxTokens: number = 1000
): Promise<string> {
  const apiKey = this.getApiKey();
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  // Convert Gemini format to OpenRouter chat format
  const messages = contents.map(content => ({
    role: content.role === 'model' ? 'assistant' : content.role,
    content: content.parts[0].text
  }));

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

    const data = await response.json();
    
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
      message: 'To enable Gemini AI integration, add your Gemini API key to the environment variables as VITE_GEMINI_API_KEY.'
    };
  }
}
