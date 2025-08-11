interface GeminiRecommendationRequest {
  userProgress: {
    solvedProblems: number;
    currentStreak: number;
    activeDays: number;
    level: number;
    weakAreas: string[];
    strongAreas: string[];
    recentActivity: any[];
  };
  learningPattern: {
    preferredTopics: string[];
    avoidedTopics: string[];
    peakPerformanceHours: number[];
    learningVelocity: number;
    retentionRate: number;
    consistencyScore: number;
  };
  cognitiveLoad: {
    currentLoad: number;
    burnoutRisk: 'low' | 'medium' | 'high';
    fatigueLevel: number;
    concentrationScore: number;
  };
  availableProblems: any[];
  targetCount: number;
}

interface GeminiSmartRecommendation {
  problemId: string;
  title: string;
  difficulty: string;
  category: string;
  aiConfidence: {
    overall: number;
    topicMatch: number;
    difficultyAlignment: number;
    timingOptimization: number;
    personalizedFit: number;
    reasoning: string[];
  };
  predictedSolveTime: number;
  cognitiveLoadImpact: number;
  learningValue: number;
  priorityScore: number;
  reasoning: string;
  alternativeProblems?: string[];
}

interface GeminiResponse {
  success: boolean;
  data?: {
    recommendations: GeminiSmartRecommendation[];
    insights: {
      userCluster: string;
      learningPhase: string;
      nextMilestone: string;
      optimizationSuggestions: string[];
      personalizedStrategies: string[];
    };
  };
  error?: string;
}

class GeminiRecommendationsService {
  private static readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
  private static readonly API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  private static readonly MAX_RETRIES = 2;
  private static readonly TIMEOUT_MS = 15000;

  /**
   * Generate AI-powered smart recommendations using Gemini
   */
  static async generateSmartRecommendations(
    request: GeminiRecommendationRequest
  ): Promise<GeminiResponse> {
    console.log('🤖 Generating Gemini Smart Recommendations...');
    
    if (!this.API_KEY) {
      console.warn('⚠️ Gemini API key not configured');
      return { success: false, error: 'Gemini API key not configured' };
    }

    try {
      const prompt = this.createRecommendationPrompt(request);
      const response = await this.callGeminiAPI(prompt);
      
      if (response.success && response.data) {
        const recommendations = this.parseGeminiResponse(response.data, request.availableProblems);
        console.log(`✅ Generated ${recommendations.length} Gemini recommendations`);
        
        return {
          success: true,
          data: {
            recommendations,
            insights: this.generateInsights(request, recommendations)
          }
        };
      }
      
      return { success: false, error: response.error || 'Failed to generate recommendations' };
    } catch (error) {
      console.error('❌ Gemini recommendations error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create comprehensive prompt for Gemini AI
   */
  private static createRecommendationPrompt(request: GeminiRecommendationRequest): string {
    const { userProgress, learningPattern, cognitiveLoad, availableProblems, targetCount } = request;
    
    return `
You are an expert DSA (Data Structures & Algorithms) learning advisor with deep knowledge of computer science education and personalized learning strategies.

ANALYZE this user's learning profile and generate ${targetCount} highly personalized problem recommendations:

USER PROFILE:
- Solved Problems: ${userProgress.solvedProblems}
- Current Streak: ${userProgress.currentStreak} days
- Active Days: ${userProgress.activeDays}
- Current Level: ${userProgress.level}
- Weak Areas: ${userProgress.weakAreas.join(', ')}
- Strong Areas: ${userProgress.strongAreas.join(', ')}

LEARNING PATTERN:
- Preferred Topics: ${learningPattern.preferredTopics.join(', ')}
- Avoided Topics: ${learningPattern.avoidedTopics.join(', ')}
- Learning Velocity: ${learningPattern.learningVelocity}/10
- Retention Rate: ${learningPattern.retentionRate}%
- Consistency Score: ${learningPattern.consistencyScore}/10

COGNITIVE STATE:
- Current Load: ${cognitiveLoad.currentLoad}%
- Burnout Risk: ${cognitiveLoad.burnoutRisk}
- Fatigue Level: ${cognitiveLoad.fatigueLevel}/10
- Concentration Score: ${cognitiveLoad.concentrationScore}/10

AVAILABLE PROBLEMS (first 20 for context):
${availableProblems.slice(0, 20).map(p => 
  `- ${p.id}: "${p.title}" [${p.difficulty}] (${p.category}) - ${p.timeEstimate}min`
).join('\n')}

REQUIREMENTS:
1. Select ${targetCount} problems that maximize learning value while respecting cognitive load
2. Balance difficulty progression with user's current capabilities
3. Address weak areas while building on strengths
4. Consider user's learning patterns and preferences
5. Provide detailed reasoning for each recommendation

RESPOND with a JSON object in this EXACT format:
{
  "recommendations": [
    {
      "problemId": "problem_id_from_available_list",
      "confidence": {
        "overall": 85,
        "topicMatch": 90,
        "difficultyAlignment": 80,
        "timingOptimization": 85,
        "personalizedFit": 88,
        "reasoning": ["Matches user's preferred topic", "Appropriate difficulty progression", "Addresses weak area in sorting"]
      },
      "predictedSolveTime": 25,
      "cognitiveLoadImpact": 6,
      "learningValue": 9,
      "priorityScore": 87,
      "reasoning": "This problem perfectly addresses your weak area in sorting algorithms while building on your string manipulation strengths. The medium difficulty aligns with your current progression level.",
      "alternativeProblems": ["alt_problem_id_1", "alt_problem_id_2"]
    }
  ],
  "insights": {
    "userCluster": "Progressive Learner",
    "learningPhase": "Intermediate Skill Building",
    "nextMilestone": "Master medium-level sorting algorithms",
    "optimizationSuggestions": ["Focus on time complexity analysis", "Practice more tree problems"],
    "personalizedStrategies": ["Use spaced repetition for weak topics", "Solve problems in preferred time slots"]
  }
}

IMPORTANT: 
- Only use problem IDs that exist in the available problems list
- Ensure all numeric values are realistic (confidence 0-100, times in minutes, etc.)
- Provide meaningful, personalized reasoning for each recommendation
- Consider the user's cognitive state when selecting problems
`;
  }

  /**
   * Call Gemini API with retry logic and timeout
   */
  private static async callGeminiAPI(prompt: string): Promise<{ success: boolean; data?: any; error?: string }> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Gemini API attempt ${attempt}/${this.MAX_RETRIES}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

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
              maxOutputTokens: 2048,
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Gemini API response received');
        
        return { success: true, data };
      } catch (error) {
        console.warn(`⚠️ Gemini API attempt ${attempt} failed:`, error);
        
        if (attempt === this.MAX_RETRIES) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown API error' 
          };
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  /**
   * Parse Gemini response and validate recommendations
   */
  private static parseGeminiResponse(data: any, availableProblems: any[]): GeminiSmartRecommendation[] {
    try {
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error('No response text from Gemini');
      }

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
      
      if (!parsedResponse.recommendations || !Array.isArray(parsedResponse.recommendations)) {
        throw new Error('Invalid recommendations format');
      }

      // Validate and map recommendations
      const validRecommendations: GeminiSmartRecommendation[] = [];
      const problemMap = new Map(availableProblems.map(p => [p.id, p]));

      for (const rec of parsedResponse.recommendations) {
        const problem = problemMap.get(rec.problemId);
        if (!problem) {
          console.warn(`⚠️ Problem ${rec.problemId} not found in available problems`);
          continue;
        }

        validRecommendations.push({
          problemId: rec.problemId,
          title: problem.title,
          difficulty: problem.difficulty,
          category: problem.category,
          aiConfidence: {
            overall: Math.min(100, Math.max(0, rec.confidence?.overall || 75)),
            topicMatch: Math.min(100, Math.max(0, rec.confidence?.topicMatch || 75)),
            difficultyAlignment: Math.min(100, Math.max(0, rec.confidence?.difficultyAlignment || 75)),
            timingOptimization: Math.min(100, Math.max(0, rec.confidence?.timingOptimization || 75)),
            personalizedFit: Math.min(100, Math.max(0, rec.confidence?.personalizedFit || 75)),
            reasoning: rec.confidence?.reasoning || ['AI-generated recommendation']
          },
          predictedSolveTime: Math.max(5, rec.predictedSolveTime || problem.timeEstimate || 15),
          cognitiveLoadImpact: Math.min(10, Math.max(1, rec.cognitiveLoadImpact || 5)),
          learningValue: Math.min(10, Math.max(1, rec.learningValue || 7)),
          priorityScore: Math.min(100, Math.max(0, rec.priorityScore || 75)),
          reasoning: rec.reasoning || 'Recommended by Gemini AI for your learning progress',
          alternativeProblems: rec.alternativeProblems?.filter((id: string) => problemMap.has(id)) || []
        });
      }

      return validRecommendations;
    } catch (error) {
      console.error('❌ Error parsing Gemini response:', error);
      return [];
    }
  }

  /**
   * Generate learning insights based on recommendations
   */
  private static generateInsights(
    request: GeminiRecommendationRequest, 
    _recommendations: GeminiSmartRecommendation[]
  ): any {
    const { userProgress, learningPattern, cognitiveLoad } = request;
    
    // Determine user cluster based on progress and patterns
    let userCluster = 'Beginner';
    if (userProgress.solvedProblems > 50 && userProgress.level > 3) {
      userCluster = 'Intermediate';
    }
    if (userProgress.solvedProblems > 150 && userProgress.level > 6) {
      userCluster = 'Advanced';
    }
    if (learningPattern.consistencyScore > 8 && userProgress.currentStreak > 14) {
      userCluster += ' Consistent Learner';
    }

    // Determine learning phase
    let learningPhase = 'Foundation Building';
    if (userProgress.level > 3) learningPhase = 'Skill Development';
    if (userProgress.level > 6) learningPhase = 'Advanced Problem Solving';
    if (cognitiveLoad.burnoutRisk === 'high') learningPhase += ' (Recovery Mode)';

    // Generate next milestone
    const nextMilestone = userProgress.level < 3 
      ? 'Complete 50 problems across different topics'
      : userProgress.level < 6
      ? 'Master medium-difficulty problems in weak areas'
      : 'Tackle advanced algorithms and system design';

    // Generate optimization suggestions
    const optimizationSuggestions = [];
    if (cognitiveLoad.currentLoad > 70) {
      optimizationSuggestions.push('Take regular breaks to prevent burnout');
    }
    if (learningPattern.retentionRate < 70) {
      optimizationSuggestions.push('Review previously solved problems weekly');
    }
    if (userProgress.weakAreas.length > 3) {
      optimizationSuggestions.push('Focus on one weak area at a time');
    }
    if (learningPattern.consistencyScore < 6) {
      optimizationSuggestions.push('Establish a daily practice routine');
    }

    // Generate personalized strategies
    const personalizedStrategies = [];
    if (learningPattern.peakPerformanceHours.length > 0) {
      personalizedStrategies.push(`Practice during your peak hours: ${learningPattern.peakPerformanceHours.join(', ')}`);
    }
    if (learningPattern.preferredTopics.length > 0) {
      personalizedStrategies.push(`Build confidence with preferred topics: ${learningPattern.preferredTopics.slice(0, 2).join(', ')}`);
    }
    personalizedStrategies.push('Use spaced repetition for difficult concepts');

    return {
      userCluster,
      learningPhase,
      nextMilestone,
      optimizationSuggestions,
      personalizedStrategies
    };
  }

  /**
   * Get fallback recommendations when Gemini fails
   */
  static getFallbackRecommendations(
    availableProblems: any[],
    _userProgress: any,
    targetCount: number = 6
  ): GeminiSmartRecommendation[] {
    console.log('🔄 Using fallback recommendations');
    
    // Simple fallback logic based on user level and weak areas
    const recommendations: GeminiSmartRecommendation[] = [];
    const shuffled = [...availableProblems].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(targetCount, shuffled.length); i++) {
      const problem = shuffled[i];
      recommendations.push({
        problemId: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        category: problem.category,
        aiConfidence: {
          overall: 60,
          topicMatch: 60,
          difficultyAlignment: 60,
          timingOptimization: 60,
          personalizedFit: 60,
          reasoning: ['Fallback recommendation']
        },
        predictedSolveTime: problem.timeEstimate || 15,
        cognitiveLoadImpact: 5,
        learningValue: 6,
        priorityScore: 60,
        reasoning: 'Recommended as part of your learning progression',
        alternativeProblems: []
      });
    }
    
    return recommendations;
  }
}

export default GeminiRecommendationsService;
export type { 
  GeminiRecommendationRequest, 
  GeminiSmartRecommendation, 
  GeminiResponse 
};
