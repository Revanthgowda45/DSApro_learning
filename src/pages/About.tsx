
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DSALogo from '../components/ui/DSALogo';
import { 
  BookOpen, 
  Target, 
  Zap, 
  Trophy, 
  Clock,
  Brain,
  Code,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Shield,
  Lightbulb,
  Mail,
  Github,
  Linkedin,
  Globe,
  Play
} from 'lucide-react';

export default function About() {
  const { user } = useAuth();

  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Structured Learning Path",
      description: "Follow a carefully curated curriculum that takes you from basics to advanced DSA concepts."
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Adaptive Difficulty",
      description: "AI-powered system that adjusts problem difficulty based on your progress and performance."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Progress Tracking",
      description: "Detailed analytics and progress tracking to monitor your learning journey."
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Achievement System",
      description: "Earn badges and achievements as you master different data structures and algorithms."
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Interactive Coding",
      description: "Practice with real coding problems and get instant feedback on your solutions."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Performance Analytics",
      description: "Comprehensive insights into your strengths, weaknesses, and improvement areas."
    }
  ];

  const stats = [
    { number: "500+", label: "Practice Problems" },
    { number: "15+", label: "Data Structures" },
    { number: "25+", label: "Algorithm Types" },
    { number: "100%", label: "Free to Use" }
  ];

  const topics = [
    "Arrays & Strings",
    "Linked Lists",
    "Stacks & Queues",
    "Trees & Graphs",
    "Dynamic Programming",
    "Sorting & Searching",
    "Hash Tables",
    "Recursion & Backtracking",
    "Greedy Algorithms",
    "Graph Algorithms"
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700">
                <DSALogo className="text-green-600 dark:text-green-400" size="lg" />
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 leading-tight">
              Master <span className="text-green-600 dark:text-green-400">Data Structures</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> & </span>
              <span className="text-blue-600 dark:text-blue-400">Algorithms</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
              Your comprehensive platform for learning data structures and algorithms. 
              Practice coding problems and track your progress.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl min-h-[48px] text-sm sm:text-base"
                >
                  Continue Learning
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl min-h-[48px] text-sm sm:text-base"
                  >
                    Start Learning Free
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 min-h-[48px] text-sm sm:text-base"
                  >
                    Sign In
                  </Link>
                </>
              )}
              
              {/* Code Editor Button - Always Visible */}
              <Link
                to="/code-editor"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl min-h-[48px] text-sm sm:text-base"
              >
                <Code className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                Try Code Editor
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 sm:py-16 bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2">
                  {stat.number}
                </div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 px-2">
              Why Choose Our Platform?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-4">
              We've built the most comprehensive and user-friendly platform for mastering DSA concepts.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                <div className="bg-green-100 dark:bg-green-900/30 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-4 sm:mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Code Editor Section */}
      <div className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 px-2">
              Professional Code Editor
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-4">
              Practice coding with our powerful online editor. No login required - start coding immediately!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Features */}
            <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <Code className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    25+ Programming Languages
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Support for JavaScript, Python, Java, C++, Go, Rust, and many more languages with syntax highlighting.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Real-time Code Execution
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Run your code instantly and see results in real-time with our powerful execution engine.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Professional Features
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Auto-save, keyboard shortcuts, fullscreen mode, and file management - just like a desktop IDE.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No Registration Required
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Start coding immediately without any signup. Perfect for quick prototyping and learning.
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-4 sm:pt-6">
                <Link
                  to="/code-editor"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl min-h-[48px] text-sm sm:text-base w-full sm:w-auto"
                >
                  <Code className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  Open Code Editor
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            {/* Right Side - Visual */}
            <div className="relative order-1 lg:order-2 mb-8 lg:mb-0">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Mock Editor Header */}
                <div className="bg-gray-100 dark:bg-gray-700 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 ml-2 sm:ml-4">
                      hello.js
                    </div>
                  </div>
                </div>

                {/* Mock Code */}
                <div className="bg-gray-900 p-3 sm:p-4 lg:p-6 font-mono text-xs sm:text-sm overflow-x-auto">
                  <div className="space-y-1 sm:space-y-2 min-w-max">
                    <div className="flex">
                      <span className="text-gray-500 w-6 sm:w-8 flex-shrink-0">1</span>
                      <span className="text-purple-400">function</span>
                      <span className="text-blue-400 ml-1 sm:ml-2">greetUser</span>
                      <span className="text-yellow-400">(</span>
                      <span className="text-orange-400">name</span>
                      <span className="text-yellow-400">) {"{"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-6 sm:w-8 flex-shrink-0">2</span>
                      <span className="ml-2 sm:ml-4 text-blue-400">console</span>
                      <span className="text-white">.</span>
                      <span className="text-blue-400">log</span>
                      <span className="text-yellow-400">(</span>
                      <span className="text-green-400">{"`Hello, ${name}!`"}</span>
                      <span className="text-yellow-400">);</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-6 sm:w-8 flex-shrink-0">3</span>
                      <span className="text-yellow-400">{"}"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-6 sm:w-8 flex-shrink-0">4</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-6 sm:w-8 flex-shrink-0">5</span>
                      <span className="text-blue-400">greetUser</span>
                      <span className="text-yellow-400">(</span>
                      <span className="text-green-400">"World"</span>
                      <span className="text-yellow-400">);</span>
                    </div>
                  </div>
                </div>

                {/* Mock Output */}
                <div className="bg-gray-800 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-600">
                  <div className="text-green-400 text-xs sm:text-sm font-mono">
                    {">"} Hello, World!
                  </div>
                </div>
              </div>

              {/* Floating Feature Badges */}
              <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-blue-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-lg shadow-lg text-xs sm:text-sm font-semibold">
                25+ Languages
              </div>
              <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 bg-green-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-lg shadow-lg text-xs sm:text-sm font-semibold">
                No Login Required
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Powered Gaming Section */}
      <div className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 px-2">
              AI-Powered Gaming Experience
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-4">
              Learn DSA through interactive challenges with AI-powered hints, real-time feedback, and gamified scoring.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Gaming Features */}
            <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    AI-Powered Challenges
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed">
                    Dynamic problem generation with intelligent difficulty scaling across 16 categories and 3 difficulty levels.
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <span className="px-2 py-1 sm:px-3 sm:py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs sm:text-sm font-medium">16 Categories</span>
                    <span className="px-2 py-1 sm:px-3 sm:py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs sm:text-sm font-medium">3 Difficulty Levels</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-yellow-600 dark:text-yellow-400 flex-shrink-0">
                  <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Smart Hints & Feedback
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Get contextual hints and detailed AI feedback on your solutions with scoring and improvement suggestions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="bg-green-100 dark:bg-green-900/30 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Real-time Analysis
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Instant code evaluation with line-by-line feedback, performance scoring, and time tracking.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Multiple Languages
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Practice with Java, Python, C++, JavaScript, and more programming languages.
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-4 sm:pt-6">
                <Link
                  to="/gaming"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl min-h-[48px] text-sm sm:text-base w-full sm:w-auto"
                >
                  <Trophy className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  Start Gaming
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            {/* Gaming Interface Preview */}
            <div className="relative order-1 lg:order-2 mb-8 lg:mb-0">
              <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Gaming Header */}
                <div className="bg-gray-800 dark:bg-gray-900 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-600 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-300 font-medium">
                        <span className="text-purple-400">🎮</span> AI Gaming Challenge
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4 text-gray-300 text-xs sm:text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-yellow-400" />
                        <span>05:42</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="w-3 h-3 text-green-400" />
                        <span>85/100</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
                    <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium">Medium</span>
                    <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">Arrays</span>
                  </div>
                  <h5 className="text-gray-900 dark:text-white font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">Problem: Two Sum</h5>
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                    Given an array of integers and a target sum, return indices of two numbers that add up to the target.
                  </p>
                </div>

                {/* Code Area Preview */}
                <div className="p-3 sm:p-4 lg:p-6 bg-gray-900 overflow-x-auto">
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm font-mono min-w-max">
                    <div className="flex">
                      <span className="text-gray-500 w-6 sm:w-8 flex-shrink-0">1</span>
                      <span className="text-purple-400">public</span>
                      <span className="text-blue-400 ml-1 sm:ml-2">int[]</span>
                      <span className="text-yellow-400 ml-1 sm:ml-2">twoSum</span>
                      <span className="text-white">(</span>
                      <span className="text-blue-400">int[]</span>
                      <span className="text-orange-400 ml-1">nums</span>
                      <span className="text-white">, </span>
                      <span className="text-blue-400">int</span>
                      <span className="text-orange-400 ml-1">target</span>
                      <span className="text-white">) {"{"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-6 sm:w-8 flex-shrink-0">2</span>
                      <span className="ml-2 sm:ml-4 text-gray-400">// AI will analyze your solution...</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-6 sm:w-8 flex-shrink-0">3</span>
                      <span className="text-white ml-2 sm:ml-4">{"}"}</span>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between px-2 sm:px-3 lg:px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 text-xs text-gray-300 flex-shrink-0">
                  <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="font-medium hidden sm:inline">Challenge: Active</span>
                      <span className="font-medium sm:hidden">Active</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="font-medium hidden sm:inline">Hints: Available</span>
                      <span className="font-medium sm:hidden">Hints</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="capitalize font-medium text-purple-400">Java</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-green-400 font-medium hidden sm:inline">AI Ready</span>
                      <span className="text-green-400 font-medium sm:hidden">Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Feature Badges */}
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 lg:-top-4 lg:-right-4 bg-purple-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-md sm:rounded-lg shadow-lg text-xs sm:text-sm font-semibold">
                AI-Powered
              </div>
              <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 lg:-bottom-4 lg:-left-4 bg-yellow-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-md sm:rounded-lg shadow-lg text-xs sm:text-sm font-semibold">
                Real-time Feedback
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Topics Section */}
      <div className="py-16 sm:py-20 lg:py-24 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 px-2">
              What You'll Learn
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-4">
              Comprehensive coverage of all essential data structures and algorithms topics.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {topics.map((topic, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-300">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-medium">
                    {topic}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Simple steps to start your DSA mastery journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-6">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Sign Up & Set Goals
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your account and set your learning pace and difficulty preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-6">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Practice & Learn
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Solve problems, learn concepts, and get personalized recommendations.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Track Progress
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor your improvement with detailed analytics and achievement badges.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Perfect for Everyone
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Whether you're a student, job seeker, or professional developer.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Students
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Build a strong foundation in computer science fundamentals and excel in your coursework.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-2" />
                  Academic excellence
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-2" />
                  Concept clarity
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-2" />
                  Assignment help
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Job Seekers
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Prepare for technical interviews at top tech companies with confidence.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-2" />
                  Interview preparation
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-2" />
                  Problem-solving skills
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-2" />
                  Confidence building
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Professionals
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sharpen your skills and stay competitive in the ever-evolving tech landscape.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-2" />
                  Skill enhancement
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-2" />
                  Career advancement
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-2" />
                  Continuous learning
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Master DSA?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of learners who are already improving their coding skills.
          </p>
          
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 bg-transparent hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-300 border-2 border-white/20 hover:border-white/40"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-16">
            <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
              {/* Brand Section */}
              <div className="lg:col-span-2">
                <div className="flex items-center mb-6">
                  <DSALogo className="text-green-400 mr-3" size="md" />
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      DSA Learning Platform
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Master Data Structures & Algorithms
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                  A comprehensive platform designed to help students, professionals, and coding enthusiasts 
                  master data structures and algorithms through interactive learning and practice.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <Shield className="w-4 h-4 mr-2 text-green-400" />
                    Secure & Private
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Lightbulb className="w-4 h-4 mr-2 text-green-400" />
                    Always Free
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Star className="w-4 h-4 mr-2 text-green-400" />
                    Open Source
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-6">
                  Quick Links
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link to="/dashboard" className="text-gray-300 hover:text-green-400 transition-colors duration-200">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/problems" className="text-gray-300 hover:text-green-400 transition-colors duration-200">
                      Practice Problems
                    </Link>
                  </li>
                  <li>
                    <Link to="/progress" className="text-gray-300 hover:text-green-400 transition-colors duration-200">
                      Track Progress
                    </Link>
                  </li>
                  <li>
                    <Link to="/profile" className="text-gray-300 hover:text-green-400 transition-colors duration-200">
                      Profile
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Developer Section */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-6">
                  Developer
                </h4>
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Created by
                  </p>
                  <h5 className="text-lg font-semibold text-white mb-4">
                    Revanth Gowda H V
                  </h5>
                </div>
                
                {/* Social Links */}
                <div className="space-y-3">
                  <a
                    href="mailto:revanthgowda576@gmail.com"
                    className="flex items-center text-gray-300 hover:text-green-400 transition-colors duration-200 group"
                    title="Send Email"
                  >
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-600 transition-colors duration-200">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm">revanthgowda576@gmail.com</span>
                  </a>
                  <a
                    href="https://github.com/Revanthgowda45"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-300 hover:text-green-400 transition-colors duration-200 group"
                    title="GitHub Profile"
                  >
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-600 transition-colors duration-200">
                      <Github className="w-4 h-4" />
                    </div>
                    <span className="text-sm">GitHub Profile</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/revanth-gowda-91765a299/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-300 hover:text-green-400 transition-colors duration-200 group"
                    title="LinkedIn Profile"
                  >
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-600 transition-colors duration-200">
                      <Linkedin className="w-4 h-4" />
                    </div>
                    <span className="text-sm">LinkedIn Profile</span>
                  </a>
                  <a
                    href="https://revanthcode.netlify.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-300 hover:text-green-400 transition-colors duration-200 group"
                    title="Portfolio Website"
                  >
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-600 transition-colors duration-200">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="text-sm">Portfolio Website</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="py-6 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <p className="text-sm text-gray-400">
                  © {new Date().getFullYear()} DSA Learning Platform. All rights reserved.
                </p>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <span>Built with passion for learning</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline">Made in India</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
