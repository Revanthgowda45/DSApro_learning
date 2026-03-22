import { useState, useEffect } from 'react';
import { ArrowRight, Brain, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HindsightService } from '../../services/hindsightService';
import { dsaProblems } from '../../data/dsaDatabase';
import { ProblemProgressService } from '../../services/problemProgressService';
import { Link } from 'react-router-dom';

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Given the same seed string, always returns the same sequence of numbers.
 */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  // mulberry32
  return function () {
    h |= 0;
    h = h + 0x6D2B79F5 | 0;
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic shuffle using a seeded RNG.
 * Same seed always produces the same order.
 */
function seededShuffle<T>(array: T[], seed: string): T[] {
  const rng = seededRandom(seed);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Remove old Hindsight daily cache entries from localStorage.
 */
function cleanupOldDailyCache(userId: string, today: string) {
  try {
    const prefix = `hindsight-daily-${userId}-`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key !== `${prefix}${today}`) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // Ignore localStorage errors
  }
}

export default function HindsightDailyChallenge() {
  const { user } = useAuth();
  const [challengeProblems, setChallengeProblems] = useState<any[]>([]);
  const [topic, setTopic] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load hindsight challenge
  const loadChallenge = async () => {
    if (!user?.id) return;
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `hindsight-daily-${user.id}-${today}`;

    // ── 1. Check localStorage for today's cached challenges ──
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { topic: cachedTopic, problems: cachedProblems } = JSON.parse(cached);
        if (cachedProblems && cachedProblems.length > 0) {
          setTopic(cachedTopic);
          setChallengeProblems(cachedProblems);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Corrupted cache — fall through to fresh generation
    }

    // ── 2. Generate new daily challenges ──
    try {
      const isConfigured = HindsightService.isConfigured();
      if (!isConfigured) {
        setLoading(false);
        return;
      }
      
      const suggestedTopic = await HindsightService.reflectForChallengeTopic(user.id);
      setTopic(suggestedTopic);
      
      // Get user's solved problems to avoid repeating
      const progress = await ProblemProgressService.getUserProgress(user.id);
      const solvedIds = new Set(progress.filter((p: any) => p.status === 'solved' || p.status === 'mastered').map((p: any) => p.problem_id));
      
      // Find a problem from that topic they haven't solved
      let problemsInTopic = dsaProblems.filter((p: any) => p.category.toLowerCase().includes(suggestedTopic.toLowerCase()));
      
      if (problemsInTopic.length === 0) {
        // Fallback if topic doesn't directly match
        problemsInTopic = dsaProblems.filter((p: any) => p.category === 'Arrays');
      }

      const unsolved = problemsInTopic.filter((p: any) => !solvedIds.has(p.id.toString()));
      
      let selectedProblems: any[];
      // Use deterministic seeded shuffle so same day + same user = same problems
      const seed = `${user.id}-${today}`;
      if (unsolved.length > 0) {
        const shuffled = seededShuffle(unsolved, seed);
        selectedProblems = shuffled.slice(0, 2);
      } else {
        // They solved everything in this topic, just pick deterministically
        const shuffled = seededShuffle(problemsInTopic, seed);
        selectedProblems = shuffled.slice(0, 2);
      }

      setChallengeProblems(selectedProblems);

      // ── 3. Cache for the rest of the day ──
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          topic: suggestedTopic,
          problems: selectedProblems,
        }));
        cleanupOldDailyCache(user.id, today);
      } catch {
        // localStorage full or unavailable — ignore
      }
    } catch (error) {
      console.error('Error loading Hindsight challenge', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenge();
  }, [user?.id]);

  if (!HindsightService.isConfigured() || loading) {
    return null; // Don't show if not configured or loading
  }

  if (!challengeProblems || challengeProblems.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg border border-indigo-400 p-6 text-white mb-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-purple-300 opacity-20 rounded-full blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Brain className="h-5 w-5 text-indigo-50" />
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              AI Practice Mentor
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                <Sparkles className="h-3 w-3" /> Hindsight Daily
              </span>
            </h2>
          </div>
        </div>

        <p className="text-indigo-100 mb-6 max-w-2xl text-sm leading-relaxed">
          Based on your recent mistakes and performance patterns, I've noticed you struggle slightly with <strong>{topic}</strong>. I've hand-picked these specific challenges to help you master this weakness today.
        </p>

        <div className="space-y-3">
          {challengeProblems.map((problem) => (
            <div key={problem.id} className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                    problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-200 border border-green-500/30' :
                    problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30' :
                    'bg-red-500/20 text-red-200 border border-red-500/30'
                  }`}>
                    {problem.difficulty}
                  </span>
                  <span className="text-xs bg-indigo-500/30 text-indigo-100 px-2 py-0.5 rounded-md border border-indigo-500/30">
                    {problem.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{problem.title}</h3>
              </div>
              
              <Link 
                to={`/solve/${problem.id}`} 
                className="flex-shrink-0 bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                Start Challenge <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
