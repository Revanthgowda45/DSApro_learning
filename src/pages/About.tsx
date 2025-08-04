
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
  Globe
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700">
                <DSALogo className="text-green-600 dark:text-green-400" size="lg" />
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Master <span className="text-green-600 dark:text-green-400">Data Structures</span>
              <br />
              & <span className="text-blue-600 dark:text-blue-400">Algorithms</span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Your comprehensive platform for learning data structures and algorithms. 
              Practice coding problems and track your progress.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Continue Learning
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Start Learning Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We've built the most comprehensive and user-friendly platform for mastering DSA concepts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topics Section */}
      <div className="py-24 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              What You'll Learn
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive coverage of all essential data structures and algorithms topics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {topics.map((topic, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-300">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
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
