import { DSAQuestion } from '../data/dsaDatabase';

export interface NewProblemData {
  topic: string;
  question: string;
  companies: string[];
  remarks: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  link: string;
}

export interface DSADataStructure {
  metadata: {
    title: string;
    total_questions: number;
    total_topics: number;
    recommended_pace: string;
    difficulty_guidelines: Record<string, string>;
    hard_questions_count: number;
  };
  questions: DSAQuestion[];
}

class AdminService {
  /**
   * Get current DSA data
   */
  private async getCurrentData(): Promise<DSADataStructure> {
    const response = await fetch('/dsa.json');
    if (!response.ok) {
      throw new Error('Failed to fetch current DSA data');
    }
    return await response.json();
  }

  /**
   * Add a new problem to the DSA database
   * In a real implementation, this would make an API call to update the backend
   * For now, it returns the updated JSON structure that can be saved manually
   */
  async addProblem(problemData: NewProblemData): Promise<{
    success: boolean;
    message: string;
    updatedData?: DSADataStructure;
    newProblemId?: number;
  }> {
    try {
      // Validate input
      if (!problemData.topic || !problemData.question) {
        throw new Error('Topic and Question are required fields');
      }

      // Fetch current DSA data
      const currentData = await this.getCurrentData();

      // Validate data structure
      if (!currentData.questions || !Array.isArray(currentData.questions)) {
        throw new Error('Invalid DSA data structure');
      }

      // Get the next available ID
      const maxId = Math.max(...currentData.questions.map(q => q.id));
      const nextId = maxId + 1;

      // Create the new problem
      const newProblem: DSAQuestion = {
        id: nextId,
        topic: problemData.topic.trim(),
        question: problemData.question.trim(),
        companies: problemData.companies.map(c => c.trim()).filter(c => c.length > 0),
        remarks: problemData.remarks.trim(),
        difficulty: problemData.difficulty,
        link: problemData.link.trim() || undefined
      };

      // Add to questions array
      const updatedQuestions = [...currentData.questions, newProblem];

      // Update metadata
      const updatedMetadata = {
        ...currentData.metadata,
        total_questions: updatedQuestions.length,
        total_topics: this.calculateTotalTopics(updatedQuestions),
        hard_questions_count: this.calculateHardQuestionsCount(updatedQuestions)
      };

      const updatedData: DSADataStructure = {
        metadata: updatedMetadata,
        questions: updatedQuestions
      };

      // In a real implementation, you would send this to your backend API
      // For now, we'll log it and provide instructions to the user
      console.log('=== UPDATED DSA DATA ===');
      console.log(JSON.stringify(updatedData, null, 2));
      console.log('=== END UPDATED DATA ===');

      return {
        success: true,
        message: `Problem "${problemData.question}" added successfully with ID ${nextId}. Check console for updated JSON data.`,
        updatedData,
        newProblemId: nextId
      };

    } catch (error) {
      console.error('AdminService: Error adding problem:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add problem'
      };
    }
  }

  /**
   * Delete a problem by ID
   */
  async deleteProblem(problemId: number): Promise<{
    success: boolean;
    message: string;
    updatedData?: DSADataStructure;
  }> {
    try {
      const currentData = await this.getCurrentData();
      
      // Find the problem to delete
      const problemIndex = currentData.questions.findIndex(q => q.id === problemId);
      if (problemIndex === -1) {
        return {
          success: false,
          message: `Problem with ID ${problemId} not found`
        };
      }

      const problemTitle = currentData.questions[problemIndex].question;
      
      // Remove the problem
      const updatedQuestions = currentData.questions.filter(q => q.id !== problemId);
      
      // Update metadata
      const updatedMetadata = {
        ...currentData.metadata,
        total_questions: updatedQuestions.length,
        total_topics: this.calculateTotalTopics(updatedQuestions),
        hard_questions_count: this.calculateHardQuestionsCount(updatedQuestions)
      };

      const updatedData: DSADataStructure = {
        metadata: updatedMetadata,
        questions: updatedQuestions
      };

      console.log('=== UPDATED DSA DATA (AFTER DELETE) ===');
      console.log(JSON.stringify(updatedData, null, 2));
      console.log('=== END UPDATED DATA ===');

      return {
        success: true,
        message: `Problem "${problemTitle}" (ID: ${problemId}) deleted successfully`,
        updatedData
      };

    } catch (error) {
      console.error('AdminService: Error deleting problem:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete problem'
      };
    }
  }

  /**
   * Edit an existing problem
   */
  async editProblem(problemId: number, problemData: NewProblemData): Promise<{
    success: boolean;
    message: string;
    updatedData?: DSADataStructure;
  }> {
    try {
      // Validate input
      const validation = this.validateProblemData(problemData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const currentData = await this.getCurrentData();
      
      // Find the problem to edit
      const problemIndex = currentData.questions.findIndex(q => q.id === problemId);
      if (problemIndex === -1) {
        return {
          success: false,
          message: `Problem with ID ${problemId} not found`
        };
      }

      // Update the problem
      const updatedProblem: DSAQuestion = {
        id: problemId,
        topic: problemData.topic.trim(),
        question: problemData.question.trim(),
        companies: problemData.companies.map(c => c.trim()).filter(c => c.length > 0),
        remarks: problemData.remarks.trim(),
        difficulty: problemData.difficulty,
        link: problemData.link.trim() || undefined
      };

      const updatedQuestions = [...currentData.questions];
      updatedQuestions[problemIndex] = updatedProblem;
      
      // Update metadata
      const updatedMetadata = {
        ...currentData.metadata,
        total_questions: updatedQuestions.length,
        total_topics: this.calculateTotalTopics(updatedQuestions),
        hard_questions_count: this.calculateHardQuestionsCount(updatedQuestions)
      };

      const updatedData: DSADataStructure = {
        metadata: updatedMetadata,
        questions: updatedQuestions
      };

      console.log('=== UPDATED DSA DATA (AFTER EDIT) ===');
      console.log(JSON.stringify(updatedData, null, 2));
      console.log('=== END UPDATED DATA ===');

      return {
        success: true,
        message: `Problem "${problemData.question}" (ID: ${problemId}) updated successfully`,
        updatedData
      };

    } catch (error) {
      console.error('AdminService: Error editing problem:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to edit problem'
      };
    }
  }

  /**
   * Get a specific problem by ID
   */
  async getProblemById(problemId: number): Promise<DSAQuestion | null> {
    try {
      const currentData = await this.getCurrentData();
      return currentData.questions.find(q => q.id === problemId) || null;
    } catch (error) {
      console.error('Error getting problem by ID:', error);
      return null;
    }
  }

  /**
   * Get all problems with pagination
   */
  async getAllProblems(page: number = 1, limit: number = 20): Promise<{
    problems: DSAQuestion[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const currentData = await this.getCurrentData();
      const total = currentData.questions.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const problems = currentData.questions
        .sort((a, b) => a.id - b.id) // Sort by ID ascending (oldest first)
        .slice(startIndex, endIndex);

      return {
        problems,
        total,
        totalPages,
        currentPage: page
      };
    } catch (error) {
      console.error('Error getting all problems:', error);
      return {
        problems: [],
        total: 0,
        totalPages: 0,
        currentPage: 1
      };
    }
  }

  /**
   * Generate a downloadable JSON file with the updated data
   */
  generateDownloadableJSON(data: DSADataStructure): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dsa-updated-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Calculate total unique topics
   */
  private calculateTotalTopics(questions: DSAQuestion[]): number {
    const topics = new Set(questions.map(q => q.topic));
    return topics.size;
  }

  /**
   * Calculate total hard questions (Hard + Very Hard)
   */
  private calculateHardQuestionsCount(questions: DSAQuestion[]): number {
    return questions.filter(q => q.difficulty === 'Hard' || q.difficulty === 'Very Hard').length;
  }

  /**
   * Validate problem data before submission
   */
  validateProblemData(data: NewProblemData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.topic.trim()) {
      errors.push('Topic is required');
    }

    if (!data.question.trim()) {
      errors.push('Question title is required');
    }

    if (data.link && data.link.trim() && !this.isValidUrl(data.link.trim())) {
      errors.push('Please provide a valid URL for the problem link');
    }

    if (data.companies.some(company => !company.trim())) {
      errors.push('Company names cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Simple URL validation
   */
  private isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get statistics about the current database
   */
  async getDatabaseStats(): Promise<{
    totalQuestions: number;
    totalTopics: number;
    difficultyBreakdown: Record<string, number>;
    topicBreakdown: Record<string, number>;
  }> {
    try {
      const response = await fetch('/dsa.json');
      const data: DSADataStructure = await response.json();

      const difficulties = ['Easy', 'Medium', 'Hard', 'Very Hard'];
      const difficultyBreakdown = difficulties.reduce((acc, diff) => {
        acc[diff] = data.questions.filter(q => q.difficulty === diff).length;
        return acc;
      }, {} as Record<string, number>);

      const topics = [...new Set(data.questions.map(q => q.topic))];
      const topicBreakdown = topics.reduce((acc, topic) => {
        acc[topic] = data.questions.filter(q => q.topic === topic).length;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalQuestions: data.questions.length,
        totalTopics: topics.length,
        difficultyBreakdown,
        topicBreakdown
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
export default adminService;
