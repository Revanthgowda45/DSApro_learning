/**
 * GroqAIService – Ultra-Fast LLM via Groq's LPU Engine
 * =====================================================
 * Provides near-instant AI responses using Groq's LPU inference hardware.
 * Used as the primary AI provider for DSA Pro's coaching features,
 * replacing the slower OpenRouter calls where speed matters most.
 *
 * Setup: Add to .env:
 *   VITE_GROQ_API_KEY=your_groq_api_key_here
 *
 * Free tier at: https://console.groq.com
 */

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  id: string;
  choices: {
    message: { role: string; content: string };
    finish_reason: string;
    index: number;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class GroqAIService {
  // Groq API endpoint (OpenAI-compatible)
  private static readonly API_URL = 'https://api.groq.com/openai/v1/chat/completions';

  // Model priority: fastest first, fall back to more capable
  private static readonly MODELS = [
    'llama-3.3-70b-versatile',      // Best quality, still fast
    'llama-3.1-8b-instant',          // Ultra-fast fallback
    'gemma2-9b-it',                  // Groq's Gemma model
  ];

  private static getApiKey(): string | null {
    return import.meta.env.VITE_GROQ_API_KEY || null;
  }

  static isConfigured(): boolean {
    return !!this.getApiKey();
  }

  static checkConfiguration(): { configured: boolean; model: string; provider: string } {
    return {
      configured: this.isConfigured(),
      model: this.MODELS[0],
      provider: 'Groq (LPU)',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CORE CHAT COMPLETION
  // ─────────────────────────────────────────────────────────────────────────

  static async chat(
    messages: GroqMessage[],
    modelIndex = 0,
    temperature = 0.7,
    maxTokens = 1024
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('Groq API key not configured');

    const model = this.MODELS[modelIndex];

    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Try next model if rate-limited or model unavailable
      if ((response.status === 429 || response.status === 503) && modelIndex < this.MODELS.length - 1) {
        console.warn(`⚡ Groq: Model ${model} unavailable, trying ${this.MODELS[modelIndex + 1]}`);
        return this.chat(messages, modelIndex + 1, temperature, maxTokens);
      }
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DSA MENTOR FEATURES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get a hint for a DSA problem without giving away the full solution.
   * Groq's speed makes this feel truly interactive.
   */
  static async getProblemHint(
    problemTitle: string,
    topic: string,
    difficulty: string,
    hindsightContext?: string   // <-- Injected from Hindsight recall
  ): Promise<string> {
    const systemPrompt =
      `You are an expert DSA mentor. Give a helpful, encouraging hint without revealing the full solution. ` +
      `Be concise (2-3 sentences max). ` +
      (hindsightContext
        ? `Based on this student's history: ${hindsightContext}`
        : '');

    const userPrompt = `Give me a hint for this ${difficulty} ${topic} problem: "${problemTitle}"`;

    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      return await this.chat(messages, 0, 0.6, 256);
    } catch (err) {
      console.error('Groq hint generation failed:', err);
      return `Think about the ${topic} approach. What data structure best fits this problem?`;
    }
  }

  /**
   * Analyze a user's code and give constructive feedback.
   * Integrates with Hindsight retain to store the analysis as a memory.
   */
  static async analyzeCode(
    code: string,
    language: string,
    problemTitle: string,
    topic: string,
    hindsightContext?: string
  ): Promise<string> {
    const systemPrompt =
      `You are a senior software engineer doing a code review for a coding interview. ` +
      `Be constructive, specific, and mention time/space complexity. Keep it under 150 words. ` +
      (hindsightContext
        ? `Student context from past sessions: ${hindsightContext}`
        : '');

    const userPrompt =
      `Review this ${language} solution for "${problemTitle}" (${topic}):\n\n\`\`\`${language}\n${code}\n\`\`\``;

    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      return await this.chat(messages, 0, 0.5, 512);
    } catch (err) {
      console.error('Groq code analysis failed:', err);
      return 'Check your time and space complexity. Consider edge cases like empty inputs.';
    }
  }

  /**
   * Generate an agentic debugging suggestion based on code, error, and Hindsight memory.
   */
  static async generateDebugHint(
    error: string,
    code: string,
    hindsightContext?: string
  ): Promise<string> {
    const systemPrompt =
      `You are a supportive AI Code Mentor. The user's code failed with an error. ` +
      `Provide a brief, specific debugging hint (max 3 sentences) to help them fix it without giving the exact code. ` +
      (hindsightContext ? `Consider their learning history and past mistakes to personalize the hint: ${hindsightContext}` : '');

    const userPrompt = `Code:\n${code}\n\nError:\n${error}\n\nPlease give me a debugging hint.`;

    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      return await this.chat(messages, 0, 0.5, 300);
    } catch (err) {
      console.error('Groq debug hint generation failed:', err);
      return 'Check the line numbers mentioned in the error message carefully and make sure your syntax is correct.';
    }
  }

  /**
   * Generate a daily coding challenge tailored to the user.
   * Uses Hindsight's reflectForChallengeTopic to pick the right focus area.
   */
  static async generateDailyChallenge(
    userLevel: string,
    focusTopic: string,    // <-- From HindsightService.reflectForChallengeTopic()
    hindsightInsight?: string
  ): Promise<{ title: string; description: string; examples: string; constraints: string }> {
    const systemPrompt =
      `You are creating a coding challenge for a DSA practice platform. ` +
      `The user is at ${userLevel} level. ` +
      (hindsightInsight ? `Their learning history: ${hindsightInsight}. ` : '') +
      `Generate a problem focused on ${focusTopic}. ` +
      `Output ONLY a valid JSON object with keys: title, description, examples, constraints.`;

    const userPrompt = `Create a ${focusTopic} coding challenge appropriate for a ${userLevel} programmer.`;

    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const text = await this.chat(messages, 0, 0.8, 600);
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON in response');
    } catch (err) {
      console.error('Groq challenge generation failed:', err);
      return {
        title: `${focusTopic} Mastery Challenge`,
        description: `Solve a problem involving ${focusTopic}. Think about the optimal approach.`,
        examples: 'Input: [1, 2, 3] → Output: Expected result',
        constraints: '- 1 ≤ n ≤ 10^5\n- Elements in range [-10^4, 10^4]',
      };
    }
  }

  /**
   * Get a learning recommendation based on user's progress.
   * Works synergistically with HindsightService.recallWeakAreas().
   */
  static async getLearningAdvice(
    solvedCount: number,
    weakTopics: string[],  // <-- From HindsightService.recallWeakAreas()
    streak: number
  ): Promise<string> {
    const systemPrompt =
      `You are an encouraging DSA coach. Give one actionable, specific piece of advice in 2 sentences. Be motivating.`;

    const userPrompt =
      `Student stats: ${solvedCount} problems solved, ${streak} day streak. ` +
      (weakTopics.length > 0
        ? `Weak areas: ${weakTopics.slice(0, 3).join(', ')}.`
        : 'No specific weak areas yet.');

    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      return await this.chat(messages, 0, 0.7, 150);
    } catch (err) {
      console.error('Groq advice generation failed:', err);
      return `Great job with ${solvedCount} problems! Keep your ${streak}-day streak going strong! 💪`;
    }
  }

  /**
   * Explain a DSA concept used in a problem.
   */
  static async explainConcept(concept: string, context?: string): Promise<string> {
    const systemPrompt = `You are a DSA teacher. Explain in simple terms with a quick analogy. Max 100 words.`;
    const userPrompt = `Explain "${concept}"` + (context ? ` in the context of: ${context}` : '');

    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      return await this.chat(messages, 0, 0.6, 200);
    } catch (err) {
      console.error('Groq concept explanation failed:', err);
      return `${concept} is a fundamental DSA concept. Look it up on LeetCode or GeeksForGeeks for detailed examples.`;
    }
  }
}
