/**
 * Streaming Execution Service
 * Provides real-time code execution with live input/output streams
 * Uses WebSocket for bidirectional communication during program execution
 */

export interface StreamingExecutionOptions {
  language: string;
  code: string;
  timeout?: number;
}

export interface StreamingMessage {
  type: 'stdout' | 'stderr' | 'stdin' | 'exit' | 'error' | 'prompt';
  data: string;
  timestamp: number;
}

export interface StreamingExecutionResult {
  success: boolean;
  exitCode?: number;
  error?: string;
  executionTime: number;
}

class StreamingExecutionService {
  private static readonly WS_URL = 'wss://api.judge0.com/ws'; // Alternative: implement own WebSocket server
  private static readonly FALLBACK_SERVICES = [
    'wss://coliru.stacked-crooked.com/ws',
    'wss://godbolt.org/ws'
  ];

  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, (message: StreamingMessage) => void> = new Map();
  private isConnected = false;
  private executionId: string | null = null;

  /**
   * Start streaming execution of code
   */
  static async startStreamingExecution(
    options: StreamingExecutionOptions,
    onMessage: (message: StreamingMessage) => void
  ): Promise<StreamingExecutionService> {
    const service = new StreamingExecutionService();
    await service.connect();
    await service.executeCode(options, onMessage);
    return service;
  }

  /**
   * Connect to streaming execution service
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Try primary service first, fallback to alternatives
        this.ws = new WebSocket(StreamingExecutionService.WS_URL);
        
        this.ws.onopen = () => {
          console.log('🔌 Connected to streaming execution service');
          this.isConnected = true;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: StreamingMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 Disconnected from streaming execution service');
          this.isConnected = false;
        };

        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Execute code with streaming I/O
   */
  private async executeCode(
    options: StreamingExecutionOptions,
    onMessage: (message: StreamingMessage) => void
  ): Promise<void> {
    if (!this.ws || !this.isConnected) {
      throw new Error('Not connected to execution service');
    }

    this.executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Register message handler
    this.messageHandlers.set(this.executionId, onMessage);

    // Send execution request
    const request = {
      type: 'execute',
      id: this.executionId,
      language: this.mapLanguage(options.language),
      source_code: options.code,
      timeout: options.timeout || 10,
      memory_limit: 128000, // 128MB
      enable_network: false,
      enable_per_process_and_thread_time_limit: true,
      enable_per_process_and_thread_memory_limit: true,
      max_processes_and_or_threads: 60
    };

    this.ws.send(JSON.stringify(request));
  }

  /**
   * Send input to running program
   */
  sendInput(input: string): void {
    if (!this.ws || !this.isConnected || !this.executionId) {
      throw new Error('No active execution session');
    }

    const inputMessage = {
      type: 'stdin',
      id: this.executionId,
      data: input + '\n'
    };

    this.ws.send(JSON.stringify(inputMessage));
  }

  /**
   * Terminate running program
   */
  terminate(): void {
    if (!this.ws || !this.executionId) return;

    const terminateMessage = {
      type: 'terminate',
      id: this.executionId
    };

    this.ws.send(JSON.stringify(terminateMessage));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: StreamingMessage): void {
    if (!this.executionId) return;

    const handler = this.messageHandlers.get(this.executionId);
    if (handler) {
      handler(message);
    }

    // Clean up on execution end
    if (message.type === 'exit' || message.type === 'error') {
      this.messageHandlers.delete(this.executionId);
      this.executionId = null;
    }
  }

  /**
   * Map language names to execution service format
   */
  private mapLanguage(language: string): string {
    const languageMap: { [key: string]: string } = {
      'cpp': 'cpp17',
      'c++': 'cpp17',
      'c': 'c18',
      'java': 'java',
      'python': 'python3',
      'python3': 'python3',
      'javascript': 'nodejs',
      'typescript': 'typescript',
      'csharp': 'csharp',
      'go': 'go',
      'rust': 'rust',
      'kotlin': 'kotlin',
      'swift': 'swift',
      'php': 'php',
      'ruby': 'ruby',
      'scala': 'scala'
    };

    return languageMap[language.toLowerCase()] || 'cpp17';
  }

  /**
   * Disconnect from service
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.messageHandlers.clear();
    this.executionId = null;
  }

  /**
   * Check if service is connected
   */
  isServiceConnected(): boolean {
    return this.isConnected;
  }
}

export default StreamingExecutionService;
