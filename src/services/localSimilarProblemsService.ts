import dsaData from '../../dsa.json';

interface DSAQuestion {
  id: number;
  topic: string;
  question: string;
  companies: string[];
  remarks: string;
  difficulty: string;
  link: string;
}

interface ProblemContext {
  title: string;
  difficulty: string;
  topic: string;
  companies: string[];
}

export class LocalSimilarProblemsService {
  private static questions: DSAQuestion[] = dsaData.questions;

  /**
   * Find similar problems from local dsa.json data
   */
  static findSimilarProblems(currentProblem: ProblemContext, limit: number = 5): string[] {
    const { title, difficulty, topic, companies } = currentProblem;
    
    // Filter out the current problem and find similar ones
    const similarProblems = this.questions
      .filter(q => q.question.toLowerCase() !== title.toLowerCase())
      .map(question => ({
        ...question,
        score: this.calculateSimilarityScore(question, { title, difficulty, topic, companies })
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(q => `**${q.question}** (${q.difficulty}) - ${q.topic}${q.companies.length > 0 ? ` | Companies: ${q.companies.slice(0, 3).join(', ')}${q.companies.length > 3 ? '...' : ''}` : ''} | [Link](${q.link})`);

    return similarProblems.length > 0 ? similarProblems : this.getFallbackProblems(topic, difficulty, limit);
  }

  /**
   * Calculate similarity score between two problems
   */
  private static calculateSimilarityScore(
    question: DSAQuestion, 
    current: { title: string; difficulty: string; topic: string; companies: string[] }
  ): number {
    let score = 0;

    // Topic match (highest priority)
    if (question.topic.toLowerCase() === current.topic.toLowerCase()) {
      score += 50;
    }

    // Difficulty match
    if (question.difficulty.toLowerCase() === current.difficulty.toLowerCase()) {
      score += 30;
    } else {
      // Similar difficulty levels
      const difficultyOrder = ['easy', 'medium', 'hard'];
      const currentDiffIndex = difficultyOrder.indexOf(current.difficulty.toLowerCase());
      const questionDiffIndex = difficultyOrder.indexOf(question.difficulty.toLowerCase());
      
      if (Math.abs(currentDiffIndex - questionDiffIndex) === 1) {
        score += 15; // Adjacent difficulty levels
      }
    }

    // Company overlap
    const commonCompanies = question.companies.filter(company => 
      current.companies.some(currentCompany => 
        currentCompany.toLowerCase() === company.toLowerCase()
      )
    );
    score += commonCompanies.length * 5;

    // Keyword similarity in question titles
    const currentKeywords = this.extractKeywords(current.title);
    const questionKeywords = this.extractKeywords(question.question);
    const commonKeywords = currentKeywords.filter(keyword => 
      questionKeywords.some(qKeyword => qKeyword.includes(keyword) || keyword.includes(qKeyword))
    );
    score += commonKeywords.length * 10;

    // Boost for interview questions
    if (question.remarks.toLowerCase().includes('interview')) {
      score += 5;
    }

    return score;
  }

  /**
   * Extract meaningful keywords from problem titles
   */
  private static extractKeywords(title: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5); // Take top 5 keywords
  }

  /**
   * Get fallback problems if no good matches found
   */
  private static getFallbackProblems(topic: string, difficulty: string, limit: number): string[] {
    // First try same topic, any difficulty
    let fallbacks = this.questions
      .filter(q => q.topic.toLowerCase() === topic.toLowerCase())
      .slice(0, limit);

    // If not enough, add same difficulty, any topic
    if (fallbacks.length < limit) {
      const additionalProblems = this.questions
        .filter(q => 
          q.difficulty.toLowerCase() === difficulty.toLowerCase() && 
          !fallbacks.some(f => f.id === q.id)
        )
        .slice(0, limit - fallbacks.length);
      
      fallbacks = [...fallbacks, ...additionalProblems];
    }

    // If still not enough, add random popular problems
    if (fallbacks.length < limit) {
      const popularProblems = this.questions
        .filter(q => 
          q.companies.length > 3 && 
          !fallbacks.some(f => f.id === q.id)
        )
        .slice(0, limit - fallbacks.length);
      
      fallbacks = [...fallbacks, ...popularProblems];
    }

    return fallbacks.map(q => 
      `**${q.question}** (${q.difficulty}) - ${q.topic}${q.companies.length > 0 ? ` | Companies: ${q.companies.slice(0, 3).join(', ')}${q.companies.length > 3 ? '...' : ''}` : ''} | [Link](${q.link})`
    );
  }

  /**
   * Get problems by topic
   */
  static getProblemsByTopic(topic: string, limit: number = 10): string[] {
    return this.questions
      .filter(q => q.topic.toLowerCase() === topic.toLowerCase())
      .slice(0, limit)
      .map(q => `**${q.question}** (${q.difficulty}) | Companies: ${q.companies.slice(0, 3).join(', ')}${q.companies.length > 3 ? '...' : ''} | [Link](${q.link})`);
  }

  /**
   * Get problems by difficulty
   */
  static getProblemsByDifficulty(difficulty: string, limit: number = 10): string[] {
    return this.questions
      .filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase())
      .slice(0, limit)
      .map(q => `**${q.question}** (${q.difficulty}) - ${q.topic} | Companies: ${q.companies.slice(0, 3).join(', ')}${q.companies.length > 3 ? '...' : ''} | [Link](${q.link})`);
  }

  /**
   * Get problems by company
   */
  static getProblemsByCompany(company: string, limit: number = 10): string[] {
    return this.questions
      .filter(q => q.companies.some(c => c.toLowerCase().includes(company.toLowerCase())))
      .slice(0, limit)
      .map(q => `**${q.question}** (${q.difficulty}) - ${q.topic} | Companies: ${q.companies.slice(0, 3).join(', ')}${q.companies.length > 3 ? '...' : ''} | [Link](${q.link})`);
  }

  /**
   * Search problems by keyword
   */
  static searchProblems(keyword: string, limit: number = 10): string[] {
    const searchTerm = keyword.toLowerCase();
    
    return this.questions
      .filter(q => 
        q.question.toLowerCase().includes(searchTerm) ||
        q.topic.toLowerCase().includes(searchTerm) ||
        q.companies.some(c => c.toLowerCase().includes(searchTerm))
      )
      .slice(0, limit)
      .map(q => `**${q.question}** (${q.difficulty}) - ${q.topic} | Companies: ${q.companies.slice(0, 3).join(', ')}${q.companies.length > 3 ? '...' : ''} | [Link](${q.link})`);
  }

  /**
   * Get statistics about the dataset
   */
  static getDatasetStats() {
    const topics = [...new Set(this.questions.map(q => q.topic))];
    const difficulties = [...new Set(this.questions.map(q => q.difficulty))];
    const totalQuestions = this.questions.length;
    
    return {
      totalQuestions,
      topics: topics.length,
      topicsList: topics,
      difficulties,
      topCompanies: this.getTopCompanies(10)
    };
  }

  /**
   * Get top companies by problem count
   */
  private static getTopCompanies(limit: number): Array<{company: string, count: number}> {
    const companyCount: Record<string, number> = {};
    
    this.questions.forEach(q => {
      q.companies.forEach(company => {
        companyCount[company] = (companyCount[company] || 0) + 1;
      });
    });

    return Object.entries(companyCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([company, count]) => ({ company, count }));
  }
}
