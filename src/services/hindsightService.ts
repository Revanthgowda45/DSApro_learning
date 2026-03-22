/**
 * HindsightService – Agent Memory That Learns
 * ============================================
 * Integrates Hindsight (https://hindsight.vectorize.io) into DSA Pro.
 * Every user gets their own Hindsight memory bank keyed by their userId.
 *
 * Core Operations:
 *  - retain()  → Store a new memory (mistake, solved pattern, code attempt)
 *  - recall()  → Search memories for personalized recommendations
 *  - reflect() → Generate AI-analyzed insights from accumulated memories
 *
 * Setup: Add to .env:
 *   VITE_HINDSIGHT_BASE_URL=https://your-cloud.hindsight.vectorize.io
 *   VITE_HINDSIGHT_API_KEY=your_api_key_here
 */

export interface HindsightMemory {
  id?: string;
  content: string;
  context?: string;
  timestamp?: string;
  score?: number;
}

export interface HindsightRecallResult {
  memories: HindsightMemory[];
  summary?: string;
}

export interface HindsightReflectResult {
  insight: string;
  confidence?: number;
}

export class HindsightService {
  // --- Configuration ---
  private static readonly BASE_URL = import.meta.env.DEV ? '/hindsight-proxy' : (import.meta.env.VITE_HINDSIGHT_BASE_URL || '');
  private static readonly API_KEY = import.meta.env.VITE_HINDSIGHT_API_KEY || '';
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY_MS = 500;

  // --- Cache for recall results (5-minute TTL) ---
  private static recallCache = new Map<string, { data: string[]; timestamp: number }>();
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /** Each user gets their own isolated memory bank */
  private static bankId(userId: string): string {
    return `dsa-pro-learner-${userId}`;
  }

  static isConfigured(): boolean {
    return !!(this.BASE_URL && this.API_KEY);
  }

  private static headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`,
      'X-API-KEY': this.API_KEY,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RETAIN – Store memories into Hindsight
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Called when a user marks a problem as "Attempted" (stuck) or keeps failing.
   * Stores the pattern so the AI remembers this is a weak area.
   */
  static async retainMistake(
    userId: string,
    problemId: string,
    topic: string,
    difficulty: string,
    details?: string
  ): Promise<void> {
    if (!this.isConfigured()) return;
    const content =
      `User struggled with a ${difficulty} ${topic} problem (ID: ${problemId}). ` +
      `This is a repeated difficulty in the ${topic} category. ` +
      (details ? `Details: ${details}` : 'The user marked it as "Attempted" without solving it.');

    await this.retainRaw(userId, content, 'coding_mistake');
    console.log(`🧠 Hindsight: retained mistake for topic "${topic}"`);
  }

  /**
   * Called when a user successfully solves a problem.
   * Stores the successful approach so the AI can reinforce it.
   */
  static async retainSolvedPattern(
    userId: string,
    problemId: string,
    topic: string,
    difficulty: string,
    timeSpentMinutes?: number
  ): Promise<void> {
    if (!this.isConfigured()) return;
    const content =
      `User successfully solved a ${difficulty} ${topic} problem (ID: ${problemId}). ` +
      (timeSpentMinutes ? `Time taken: ${timeSpentMinutes} minutes. ` : '') +
      `The user has demonstrated understanding of ${topic} patterns at ${difficulty} level.`;

    await this.retainRaw(userId, content, 'solved_problem');
    console.log(`🧠 Hindsight: retained solved pattern for topic "${topic}"`);
  }

  /**
   * Called when a user submits code in the editor.
   * Tracks language preferences and coding approach patterns.
   */
  static async retainCodeAttempt(
    userId: string,
    problemId: string,
    language: string,
    topic: string,
    wasCorrect: boolean
  ): Promise<void> {
    if (!this.isConfigured()) return;
    const content =
      `User wrote a ${language} solution for a ${topic} problem (ID: ${problemId}). ` +
      (wasCorrect
        ? `The solution was correct. User shows proficiency with ${language}.`
        : `The solution had errors. User may need more practice with ${language} for ${topic} problems.`);

    await this.retainRaw(userId, content, 'code_attempt');
    console.log(`🧠 Hindsight: retained code attempt in ${language}`);
  }

  /**
   * Called daily when the user completes their session.
   * Tracks consistency and streak patterns.
   */
  static async retainDailySession(
    userId: string,
    date: string,
    problemsSolved: number,
    streakDay: number,
    topicsStudied: string[]
  ): Promise<void> {
    if (!this.isConfigured()) return;
    const content =
      `Daily study session on ${date}: ` +
      `User solved ${problemsSolved} problems (streak day ${streakDay}). ` +
      (topicsStudied.length > 0
        ? `Topics covered: ${topicsStudied.join(', ')}.`
        : 'No specific topics recorded.');

    await this.retainRaw(userId, content, 'daily_session');
    console.log(`🧠 Hindsight: retained daily session for ${date}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RECALL – Search memories for personalized recommendations
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Recall which topics and problem types this user struggles with.
   * Used by the Progressive AI Recommender to pick better problems.
   */
  static async recallWeakAreas(userId: string): Promise<string[]> {
    if (!this.isConfigured()) return [];

    // Check cache first
    const cacheKey = `weak-${userId}`;
    const cached = this.recallCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      console.log('🧠 Hindsight: returning cached weak areas');
      return cached.data;
    }

    try {
      const result = await this.recallRaw(
        userId,
        'What topics and problem types does this user struggle with most? What patterns of mistakes have they made?'
      );
      // Extract topic names from memory contents
      const weakTopics: string[] = [];
      for (const mem of result.memories) {
        const matches = mem.content.match(/\b(Array|String|Graph|Tree|DP|Dynamic Programming|Linked List|Stack|Queue|Heap|Backtracking|Sorting|Binary Search|Greedy|Two Pointer|Sliding Window|Hashing|Recursion|BFS|DFS)\b/gi);
        if (matches) weakTopics.push(...matches.map(m => m.trim()));
      }
      const unique = [...new Set(weakTopics)];
      console.log(`🧠 Hindsight: recalled weak areas → ${unique.join(', ')}`);

      // Store in cache
      this.recallCache.set(cacheKey, { data: unique, timestamp: Date.now() });

      return unique;
    } catch (err) {
      console.warn('Hindsight recall failed (weak areas):', err);
      return [];
    }
  }

  /**
   * Recall the user's preferred programming languages.
   * Used by the code editor to pre-select language.
   */
  static async recallPreferredLanguage(userId: string): Promise<string | null> {
    if (!this.isConfigured()) return null;
    try {
      const result = await this.recallRaw(
        userId,
        'What programming language does this user use most often for solving problems?'
      );
      if (result.memories.length === 0) return null;
      // Simple extraction of language from most recent memory
      const langMatch = result.memories[0].content.match(
        /\b(Python|JavaScript|Java|C\+\+|C#|TypeScript|Go|Rust|Ruby|Kotlin|Swift)\b/i
      );
      return langMatch ? langMatch[1] : null;
    } catch (err) {
      console.warn('Hindsight recall failed (language):', err);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REFLECT – Generate deep AI insights from all memories
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a personalized learning analysis by reflecting on all memories.
   * Used by the Dashboard widget and daily challenge generator.
   */
  static async reflectOnLearning(userId: string): Promise<string> {
    if (!this.isConfigured()) {
      return "Set up your Hindsight API key to see personalized AI insights about your learning patterns.";
    }
    try {
      const result = await this.reflectRaw(
        userId,
        "Based on this learner's history, what are their strengths, weaknesses, and what should they focus on next to improve their DSA skills? Give a concise, encouraging, 2-3 sentence summary."
      );
      console.log(`🧠 Hindsight: reflect completed`);
      return result.insight || "Keep practicing! Your patterns are being analyzed for personalized insights.";
    } catch (err) {
      console.warn('Hindsight reflect failed:', err);
      return "Keep practicing! Your AI mentor is building your learning profile...";
    }
  }

  /**
   * Reflect to generate a theme for today's challenge.
   * Used by GamifiedAICoach to pick smarter daily challenge topics.
   */
  static async reflectForChallengeTopic(userId: string): Promise<string> {
    if (!this.isConfigured()) return 'Mixed Problems';
    try {
      const result = await this.reflectRaw(
        userId,
        "What is the single most important topic this user should practice in their next coding session to improve? Respond with just the topic name, e.g. 'Graph BFS', 'Dynamic Programming', 'Binary Trees'."
      );
      return result.insight?.trim() || 'Mixed Problems';
    } catch (err) {
      console.warn('Hindsight reflect failed (challenge topic):', err);
      return 'Mixed Problems';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOW-LEVEL HTTP HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private static async retainRaw(
    userId: string,
    content: string,
    context?: string
  ): Promise<void> {
    const bankId = this.bankId(userId);
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${this.BASE_URL}/v1/default/banks/${bankId}/memories`, {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({
            items: [{
              content,
              context: context || 'dsa_learning',
              timestamp: new Date().toISOString(),
            }]
          }),
        });
        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Hindsight retain failed (${response.status}): ${err}`);
        }
        return; // Success
      } catch (err) {
        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(`🧠 Hindsight: retain attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }
  }

  private static async recallRaw(
    userId: string,
    query: string
  ): Promise<HindsightRecallResult> {
    const bankId = this.bankId(userId);
    const response = await fetch(`${this.BASE_URL}/v1/default/banks/${bankId}/recall`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        query,
        limit: 10,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Hindsight recall failed (${response.status}): ${err}`);
    }
    const data = await response.json();
    // Normalize response shape from Hindsight API
    return {
      memories: Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.memories)
        ? data.memories
        : [],
      summary: data.summary,
    };
  }

  private static async reflectRaw(
    userId: string,
    query: string
  ): Promise<HindsightReflectResult> {
    const bankId = this.bankId(userId);
    const response = await fetch(`${this.BASE_URL}/v1/default/banks/${bankId}/reflect`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        query,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Hindsight reflect failed (${response.status}): ${err}`);
    }
    const data = await response.json();
    return {
      insight:
        data.text ||
        data.response ||
        data.result ||
        data.answer ||
        data.insight ||
        String(data),
      confidence: data.confidence,
    };
  }
}
