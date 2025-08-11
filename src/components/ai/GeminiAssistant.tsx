import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  Search, 
  Code, 
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { OpenRouterAIService } from '../../services/openRouterAIService';
import { Problem } from '../../data/dsaDatabase';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  type?: 'hint' | 'analysis' | 'similar' | 'general';
}

interface GeminiAssistantProps {
  problem: Problem;
  isOpen: boolean;
  onClose: () => void;
}

// Utility function to convert markdown links to clickable HTML
const renderMessageContent = (content: string) => {
  // Convert markdown links [text](url) to clickable links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    // Add the clickable link
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <a
        key={match.index}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline hover:no-underline transition-colors"
      >
        {linkText}
      </a>
    );
    
    lastIndex = linkRegex.lastIndex;
  }
  
  // Add remaining text after the last link
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : content;
};

export default function GeminiAssistant({ problem, isOpen, onClose }: GeminiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setHints] = useState<string[]>([]);
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if OpenRouter is configured
  const { configured, message: configMessage } = OpenRouterAIService.checkConfiguration();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && configured) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, configured]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && configured && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'model',
        content: `Hi! I'm your AI coding assistant powered by OpenRouter. I'm here to help you with "${problem.title}". 

I can help you with:
• Getting hints and guidance
• Analyzing your approach
• Explaining concepts
• Finding similar problems
• Debugging strategies

What would you like to know?`,
        timestamp: new Date(),
        type: 'general'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, configured, problem.title, messages.length]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !configured) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const problemContext = {
        title: problem.title,
        difficulty: problem.difficulty,
        topic: problem.category,
        companies: problem.companies || [],
        leetcodeUrl: problem.leetcodeLink,
        gfgUrl: problem.link
      };

      const conversationHistory = messages.map(msg => ({
        role: msg.role as 'user' | 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await OpenRouterAIService.getProblemHelp(
        problemContext,
        userMessage.content,
        conversationHistory
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response,
        timestamp: new Date(),
        type: 'general'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const getHints = async () => {
    if (!configured || isLoadingHints) return;

    setIsLoadingHints(true);
    setError(null);

    try {
      const problemContext = {
        title: problem.title,
        difficulty: problem.difficulty,
        topic: problem.category,
        companies: problem.companies || []
      };

      const generatedHints = await OpenRouterAIService.getHints(problemContext);
      setHints(generatedHints);

      const hintsMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        content: `Here are some progressive hints for "${problem.title}":\n\n${generatedHints.map((hint: string, i: number) => `**Hint ${i + 1}:** ${hint}`).join('\n\n')}`,
        timestamp: new Date(),
        type: 'hint'
      };

      setMessages(prev => [...prev, hintsMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate hints');
    } finally {
      setIsLoadingHints(false);
    }
  };

  const analyzeApproach = async () => {
    const approach = prompt('Please describe your approach or solution:');
    if (!approach || !configured) return;

    setIsLoading(true);
    setError(null);

    try {
      const problemContext = {
        title: problem.title,
        difficulty: problem.difficulty,
        topic: problem.category,
        companies: problem.companies || []
      };

      const analysis = await OpenRouterAIService.analyzeApproach(problemContext, approach);

      const analysisMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        content: `**Analysis of your approach:**\n\n${analysis}`,
        timestamp: new Date(),
        type: 'analysis'
      };

      setMessages(prev => [...prev, analysisMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze approach');
    } finally {
      setIsLoading(false);
    }
  };

  const getSimilarProblems = async () => {
    if (!configured || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const problemContext = {
        title: problem.title,
        difficulty: problem.difficulty,
        topic: problem.category,
        companies: problem.companies || []
      };

      const similarProblems = await OpenRouterAIService.getSimilarProblems(problemContext);

      const similarMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        content: `**Similar problems to practice:**\n\n${similarProblems.map((prob: string, i: number) => `${i + 1}. ${prob}`).join('\n\n')}`,
        timestamp: new Date(),
        type: 'similar'
      };

      setMessages(prev => [...prev, similarMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get similar problems');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full sm:h-[95vh] sm:max-w-6xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI Assistant
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Help for: {problem.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Configuration Check */}
        {!configured && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {configMessage}
              </p>
            </div>
          </div>
        )}

        {configured && (
          <>
            {/* Quick Actions */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-row justify-between gap-2 w-full">
                <button
                  onClick={getHints}
                  disabled={isLoadingHints}
                  className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 font-medium text-sm"
                >
                  {isLoadingHints ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lightbulb className="h-4 w-4" />
                  )}
                  <span className="text-sm">Hints</span>
                </button>
                
                <button
                  onClick={analyzeApproach}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors disabled:opacity-50 font-medium text-sm"
                >
                  <Code className="h-4 w-4" />
                  <span className="text-sm">Analyze</span>
                </button>
                
                <button
                  onClick={getSimilarProblems}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-50 font-medium text-sm"
                >
                  <Search className="h-4 w-4" />
                  <span className="text-sm">Similar</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'model' && (
                        <Bot className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                      )}
                      {message.role === 'user' && (
                        <User className="h-4 w-4 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap text-sm">
                          {renderMessageContent(message.content)}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about this problem..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
