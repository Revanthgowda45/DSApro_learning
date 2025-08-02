# 🚀 DSA Pro - Advanced Data Structures & Algorithms Tracker

<div align="center">
  <img src="./public/dsa-favicon.svg" alt="DSA Pro Logo" width="120" height="120">
  
  <h3>Master Data Structures & Algorithms with AI-Powered Learning</h3>
  
  [![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_App-blue?style=for-the-badge)](https://dsapro.netlify.app/)
  [![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.52.1-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
</div>

---

## 📋 Overview

**DSA Pro** is a comprehensive, AI-powered platform designed to help developers master Data Structures and Algorithms through personalized learning paths, gamified progress tracking, and intelligent recommendations. Perfect for interview preparation and skill development.

## ✨ Key Features

### 🤖 **AI-Powered Learning**
- **Intelligent Recommendations**: AI analyzes your progress and suggests optimal problems
- **Adaptive Difficulty**: Dynamic difficulty adjustment based on your performance
- **Personalized Learning Paths**: Customized 30-day beginner curriculum
- **Smart Problem Selection**: AI considers your weak areas and learning pace

### 📊 **Comprehensive Analytics**
- **Real-time Progress Tracking**: Live updates across all devices
- **Performance Insights**: Detailed analytics on learning patterns
- **Streak Tracking**: GitHub-style contribution calendar
- **Study Session Analytics**: Time tracking and consistency metrics

### 🎮 **Gamification System**
- **XP & Leveling**: Earn experience points and level up
- **Badges & Achievements**: Unlock rewards for milestones
- **Daily Challenges**: AI-generated personalized challenges
- **Streak Rewards**: Maintain consistency with streak bonuses

### 📱 **Modern User Experience**
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Dark/Light Theme**: System-aware theme switching
- **Real-time Sync**: Cross-device synchronization with Supabase
- **Offline Support**: Works offline with localStorage fallback

### 🎯 **Problem Management**
- **375+ Curated Problems**: Comprehensive DSA problem database
- **Multiple Platforms**: Direct links to LeetCode, GeeksforGeeks, etc.
- **Progress States**: Not Started → Attempted → Solved → Mastered
- **Company Tags**: Filter by top tech companies
- **Difficulty Levels**: Easy, Medium, Hard, Very Hard

## 🛠️ Tech Stack

- **Frontend**: React 18.3.1 + TypeScript
- **Styling**: Tailwind CSS 3.4.1
- **Backend**: Supabase (Authentication, Database, Real-time)
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Build Tool**: Vite
- **Deployment**: Netlify

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dsa-tracker.git
   cd dsa-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📖 Usage Guide

### Getting Started
1. **Sign Up**: Create your account with email/password
2. **Set Learning Preferences**: Choose your pace (Slow/Medium/Fast)
3. **Begin Journey**: Start with AI-recommended problems or daily challenges
4. **Track Progress**: Monitor your growth through analytics dashboard

### Key Pages
- **Dashboard**: Overview of progress, streaks, and recommendations
- **Problems**: Browse and filter 375+ DSA problems
- **Progress**: Detailed analytics and performance insights
- **Profile**: Manage preferences and view achievements
- **Calendar**: Visual streak tracking and practice history

## 🎯 Features in Detail

### AI Recommendation Engine
- Analyzes your solving patterns and weak areas
- Suggests problems based on your current skill level
- Adapts to your learning pace and preferences
- Provides confidence scores for recommendations

### Gamification System
- **XP System**: Earn points based on problem difficulty
- **Levels**: Progress from Beginner to Expert
- **Badges**: Unlock achievements for various milestones
- **Streaks**: Maintain daily practice consistency

### Analytics Dashboard
- **Study Time**: Track time spent on different topics
- **Consistency Score**: Measure practice regularity
- **Learning Velocity**: Problems solved per week
- **Topic Mastery**: Progress across different DSA topics

## 🔧 Configuration

### Learning Preferences
- **Daily Time Limit**: Set your study time goals (30-240 minutes)
- **Learning Pace**: Choose Slow (2-3 problems/day), Medium (4-5), or Fast (6+)
- **Difficulty Preferences**: Select preferred difficulty levels
- **Adaptive Difficulty**: Enable AI-driven difficulty progression

### Theme Options
- **Light Theme**: Traditional light mode
- **Dark Theme**: Easy on the eyes
- **System Theme**: Follows your OS preference

## 📊 Database Schema

The application uses Supabase with the following key tables:
- `profiles`: User information and preferences
- `problem_progress`: Problem solving status and history
- `user_sessions`: Daily study sessions and time tracking
- `ai_insights`: AI-generated recommendations and insights

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>
    <a href="https://dsapro.netlify.app/">🌐 Try DSA Pro Now</a> •
    <a href="#-features">✨ Features</a> •
    <a href="#-quick-start">🚀 Get Started</a>
  </p>
</div>
