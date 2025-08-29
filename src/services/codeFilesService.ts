import { supabase } from '../lib/supabase';

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  code: string;
  timestamp: Date;
}

export interface SupabaseCodeFile {
  id: string;
  user_id: string;
  file_id: string;
  name: string;
  language: string;
  code: string;
  created_at: string;
  updated_at: string;
}

class CodeFilesService {
  private readonly STORAGE_KEY = 'codeEditorFiles';
  private readonly MAX_FILES = 10;

  /**
   * Save a code file to Supabase (for authenticated users) or localStorage (fallback)
   */
  async saveFile(file: CodeFile, userId?: string): Promise<void> {
    try {
      if (userId && supabase) {
        await this.saveToSupabase(file, userId);
      } else {
        this.saveToLocalStorage(file);
      }
    } catch (error) {
      console.error('Error saving file:', error);
      // Fallback to localStorage if Supabase fails
      this.saveToLocalStorage(file);
    }
  }

  /**
   * Get all saved files from Supabase (for authenticated users) or localStorage (fallback)
   */
  async getFiles(userId?: string): Promise<CodeFile[]> {
    try {
      if (userId && supabase) {
        return await this.getFromSupabase(userId);
      } else {
        return this.getFromLocalStorage();
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      // Fallback to localStorage if Supabase fails
      return this.getFromLocalStorage();
    }
  }

  /**
   * Delete a specific file
   */
  async deleteFile(fileId: string, userId?: string): Promise<void> {
    try {
      if (userId && supabase) {
        await this.deleteFromSupabase(fileId, userId);
      } else {
        this.deleteFromLocalStorage(fileId);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Fallback to localStorage if Supabase fails
      this.deleteFromLocalStorage(fileId);
    }
  }

  /**
   * Delete all files
   */
  async clearAllFiles(userId?: string): Promise<void> {
    try {
      if (userId && supabase) {
        await this.clearAllFromSupabase(userId);
      } else {
        this.clearAllFromLocalStorage();
      }
    } catch (error) {
      console.error('Error clearing all files:', error);
      // Fallback to localStorage if Supabase fails
      this.clearAllFromLocalStorage();
    }
  }

  /**
   * Sync localStorage files to Supabase when user logs in
   */
  async syncLocalToSupabase(userId: string): Promise<void> {
    if (!supabase) return;

    try {
      const localFiles = this.getFromLocalStorage();
      if (localFiles.length === 0) return;

      console.log(`Syncing ${localFiles.length} local files to Supabase...`);

      for (const file of localFiles) {
        await this.saveToSupabase(file, userId);
      }

      console.log('Local files synced to Supabase successfully');
    } catch (error) {
      console.error('Error syncing local files to Supabase:', error);
    }
  }

  // Private methods for Supabase operations
  private async saveToSupabase(file: CodeFile, userId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not available');

    const { error } = await supabase
      .from('code_files')
      .upsert({
        user_id: userId,
        file_id: file.id,
        name: file.name,
        language: file.language,
        code: file.code,
      }, {
        onConflict: 'user_id,file_id'
      });

    if (error) throw error;
  }

  private async getFromSupabase(userId: string): Promise<CodeFile[]> {
    if (!supabase) throw new Error('Supabase not available');

    const { data, error } = await supabase
      .from('code_files')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(this.MAX_FILES);

    if (error) throw error;

    return (data || []).map(this.mapSupabaseToCodeFile);
  }

  private async deleteFromSupabase(fileId: string, userId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not available');

    const { error } = await supabase
      .from('code_files')
      .delete()
      .eq('user_id', userId)
      .eq('file_id', fileId);

    if (error) throw error;
  }

  private async clearAllFromSupabase(userId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not available');

    const { error } = await supabase
      .from('code_files')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Private methods for localStorage operations
  private saveToLocalStorage(file: CodeFile): void {
    const existingFiles = this.getFromLocalStorage();
    const existingIndex = existingFiles.findIndex(f => f.id === file.id);

    let updatedFiles: CodeFile[];
    if (existingIndex >= 0) {
      // Update existing file and move to top
      updatedFiles = [...existingFiles];
      updatedFiles[existingIndex] = file;
      updatedFiles = [file, ...updatedFiles.filter((_, index) => index !== existingIndex)];
    } else {
      // Add new file to top, keep only MAX_FILES
      updatedFiles = [file, ...existingFiles.slice(0, this.MAX_FILES - 1)];
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFiles));
  }

  private getFromLocalStorage(): CodeFile[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const files = JSON.parse(stored);
      return files.map((file: any) => ({
        ...file,
        timestamp: new Date(file.timestamp)
      }));
    } catch (error) {
      console.error('Error parsing localStorage files:', error);
      return [];
    }
  }

  private deleteFromLocalStorage(fileId: string): void {
    const files = this.getFromLocalStorage();
    const updatedFiles = files.filter(f => f.id !== fileId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFiles));
  }

  private clearAllFromLocalStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
  }

  // Helper method to map Supabase data to CodeFile
  private mapSupabaseToCodeFile(supabaseFile: SupabaseCodeFile): CodeFile {
    return {
      id: supabaseFile.file_id,
      name: supabaseFile.name,
      language: supabaseFile.language,
      code: supabaseFile.code,
      timestamp: new Date(supabaseFile.updated_at)
    };
  }
}

export const codeFilesService = new CodeFilesService();
