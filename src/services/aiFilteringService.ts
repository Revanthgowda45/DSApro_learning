import { Problem } from '../data/dsaDatabase';

export interface FilterCriteria {
  difficulty?: string[];
  category?: string[];
  companies?: string[];
  status?: string[];
  keywords?: string[];
}

export class AIFilteringService {
  private static readonly API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  private static readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  static async parseFilterQuery(query: string, availableProblems: Problem[]): Promise<FilterCriteria> {
    if (!this.API_KEY) {
      throw new Error('AI API key not configured');
    }

    // Extract available options from problems
    const difficulties = [...new Set(availableProblems.map(p => p.difficulty))];
    const categories = [...new Set(availableProblems.map(p => p.category))];
    const companies = [...new Set(availableProblems.flatMap(p => p.companies))];
    const statuses = ['not-started', 'attempted', 'solved', 'mastered'];

    const prompt = `You are a DSA problem filtering assistant. Parse the user's natural language query and return ONLY a JSON object with filtering criteria.

Available options:
- Difficulties: ${difficulties.join(', ')}
- Categories: ${categories.join(', ')}
- Companies: ${companies.slice(0, 20).join(', ')}... (and more)
- Statuses: ${statuses.join(', ')}

User Query: "${query}"

Return ONLY a JSON object with these optional fields:
{
  "difficulty": ["Easy", "Medium"], // array of difficulty levels
  "category": ["Array", "String"], // array of categories/topics
  "companies": ["Google", "Amazon"], // array of companies
  "status": ["not-started"], // array of statuses
  "keywords": ["maximum", "minimum"] // array of keywords to search in titles
}

Examples:
- "easy array problems" → {"difficulty": ["Easy"], "category": ["Array"]}
- "medium problems from Google" → {"difficulty": ["Medium"], "companies": ["Google"]}
- "unsolved dynamic programming" → {"category": ["Dynamic Programming"], "status": ["not-started"]}
- "hard problems I haven't started" → {"difficulty": ["Hard"], "status": ["not-started"]}

Return ONLY the JSON object, no explanation:`;

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: 'google/gemma-2-9b-it:free',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      try {
        const filterCriteria = JSON.parse(aiResponse);
        return this.validateFilterCriteria(filterCriteria);
      } catch (parseError) {
        // Fallback: try to extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const filterCriteria = JSON.parse(jsonMatch[0]);
          return this.validateFilterCriteria(filterCriteria);
        }
        throw new Error('Invalid JSON response from AI');
      }
    } catch (error) {
      console.error('AI filtering error:', error);
      // Fallback to basic keyword matching
      return this.fallbackKeywordFilter(query);
    }
  }

  private static validateFilterCriteria(criteria: any): FilterCriteria {
    const validated: FilterCriteria = {};
    
    if (Array.isArray(criteria.difficulty)) {
      validated.difficulty = criteria.difficulty.filter((d: string) => 
        ['Easy', 'Medium', 'Hard', 'Very Hard'].includes(d)
      );
    }
    
    if (Array.isArray(criteria.category)) {
      validated.category = criteria.category;
    }
    
    if (Array.isArray(criteria.companies)) {
      validated.companies = criteria.companies;
    }
    
    if (Array.isArray(criteria.status)) {
      validated.status = criteria.status.filter((s: string) => 
        ['not-started', 'attempted', 'solved', 'mastered'].includes(s)
      );
    }
    
    if (Array.isArray(criteria.keywords)) {
      validated.keywords = criteria.keywords;
    }
    
    return validated;
  }

  private static fallbackKeywordFilter(query: string): FilterCriteria {
    const lowerQuery = query.toLowerCase();
    const criteria: FilterCriteria = {};

    // Difficulty matching
    if (lowerQuery.includes('easy')) criteria.difficulty = ['Easy'];
    if (lowerQuery.includes('medium')) criteria.difficulty = ['Medium'];
    if (lowerQuery.includes('hard')) criteria.difficulty = ['Hard'];

    // Status matching
    if (lowerQuery.includes('unsolved') || lowerQuery.includes('not started')) {
      criteria.status = ['not-started'];
    }
    if (lowerQuery.includes('solved')) criteria.status = ['solved'];
    if (lowerQuery.includes('attempted')) criteria.status = ['attempted'];

    // Category matching
    if (lowerQuery.includes('array')) criteria.category = ['Array'];
    if (lowerQuery.includes('string')) criteria.category = ['String'];
    if (lowerQuery.includes('tree')) criteria.category = ['Tree'];
    if (lowerQuery.includes('graph')) criteria.category = ['Graph'];
    if (lowerQuery.includes('dynamic programming') || lowerQuery.includes('dp')) {
      criteria.category = ['Dynamic Programming'];
    }

    // Company matching
    if (lowerQuery.includes('google')) criteria.companies = ['Google'];
    if (lowerQuery.includes('amazon')) criteria.companies = ['Amazon'];
    if (lowerQuery.includes('microsoft')) criteria.companies = ['Microsoft'];
    if (lowerQuery.includes('facebook') || lowerQuery.includes('meta')) {
      criteria.companies = ['Facebook'];
    }

    return criteria;
  }

  static applyFilterCriteria(problems: Problem[], criteria: FilterCriteria): Problem[] {
    return problems.filter(problem => {
      // Difficulty filter
      if (criteria.difficulty && criteria.difficulty.length > 0) {
        if (!criteria.difficulty.includes(problem.difficulty)) {
          return false;
        }
      }

      // Category filter
      if (criteria.category && criteria.category.length > 0) {
        if (!criteria.category.some(cat => 
          problem.category.toLowerCase().includes(cat.toLowerCase())
        )) {
          return false;
        }
      }

      // Company filter
      if (criteria.companies && criteria.companies.length > 0) {
        if (!criteria.companies.some(company => 
          problem.companies.some(pc => 
            pc.toLowerCase().includes(company.toLowerCase())
          )
        )) {
          return false;
        }
      }

      // Status filter
      if (criteria.status && criteria.status.length > 0) {
        if (!criteria.status.includes(problem.status)) {
          return false;
        }
      }

      // Keywords filter (search in title)
      if (criteria.keywords && criteria.keywords.length > 0) {
        if (!criteria.keywords.some(keyword => 
          problem.title.toLowerCase().includes(keyword.toLowerCase())
        )) {
          return false;
        }
      }

      return true;
    });
  }
}
