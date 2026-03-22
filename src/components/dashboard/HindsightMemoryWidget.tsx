/**
 * HindsightMemoryWidget – "What Your AI Mentor Knows About You"
 * ==============================================================
 * A dashboard widget that makes the Hindsight integration visible to users AND
 * to hackathon judges. It calls HindsightService.reflectOnLearning() to generate
 * AI-analyzed personalized learning insights based on accumulated memories.
 *
 * This widget is the "showstopper" feature for the hackathon demo.
 */

import { useState, useEffect } from 'react';
import { Brain, RefreshCw, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { HindsightService } from '../../services/hindsightService';
import { GroqAIService } from '../../services/groqAIService';
import { useAuth } from '../../context/AuthContext';

interface MemoryInsight {
  insight: string;
  weakTopics: string[];
  lastUpdated: Date | null;
  source: 'hindsight' | 'groq' | 'none';
}

export default function HindsightMemoryWidget() {
  const { user } = useAuth();
  const [data, setData] = useState<MemoryInsight>({
    insight: '',
    weakTopics: [],
    lastUpdated: null,
    source: 'none',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hindsightConfigured = HindsightService.isConfigured();
  const groqConfigured = GroqAIService.isConfigured();

  const loadInsights = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      // Step 1: Reflect on all accumulated memories using Hindsight
      const [insight, weakTopics] = await Promise.all([
        HindsightService.reflectOnLearning(user.id),
        HindsightService.recallWeakAreas(user.id),
      ]);

      setData({
        insight,
        weakTopics: weakTopics.slice(0, 5),
        lastUpdated: new Date(),
        source: hindsightConfigured ? 'hindsight' : 'none',
      });
    } catch (err) {
      console.error('HindsightMemoryWidget error:', err);
      setError('Unable to load AI insights right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && hindsightConfigured) {
      loadInsights();
    }
  }, [user?.id]);

  // ──────────────────────────────────────────────────────────────────────────
  // Not configured state
  // ──────────────────────────────────────────────────────────────────────────
  if (!hindsightConfigured && !groqConfigured) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-purple-300 dark:border-purple-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Memory (Hindsight)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Hindsight + Groq</p>
          </div>
        </div>
        <div className="flex items-start space-x-2 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs">
            Add <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">VITE_HINDSIGHT_BASE_URL</code>,{' '}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">VITE_HINDSIGHT_API_KEY</code> and{' '}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">VITE_GROQ_API_KEY</code> to your .env to enable personalized AI memory.
          </p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Main widget render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              AI Memory
              <span className="inline-flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                <Sparkles className="h-3 w-3" /> Hindsight
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">What your AI mentor knows about you</p>
          </div>
        </div>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30"
          title="Refresh insights"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-purple-200 dark:bg-purple-700 rounded w-full" />
          <div className="h-3 bg-purple-200 dark:bg-purple-700 rounded w-4/5" />
          <div className="h-3 bg-purple-200 dark:bg-purple-700 rounded w-3/5" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : data.insight ? (
        <div className="space-y-3">
          {/* AI Insight Text */}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
            "{data.insight}"
          </p>

          {/* Weak Topics Badges */}
          {data.weakTopics.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Focus areas from your history:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.weakTopics.map((topic) => (
                  <span
                    key={topic}
                    className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Provider Badge + Timestamp */}
          <div className="flex items-center justify-between pt-1 border-t border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
              <Zap className="h-3 w-3" />
              <span>Powered by Hindsight Memory + Groq</span>
            </div>
            {data.lastUpdated && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {data.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <Brain className="h-8 w-8 text-purple-300 dark:text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No memories yet. Start solving problems to build your personalized AI profile!
          </p>
          <button
            onClick={loadInsights}
            className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline"
          >
            Check again
          </button>
        </div>
      )}
    </div>
  );
}
