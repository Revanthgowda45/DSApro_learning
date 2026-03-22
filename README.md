# 🧠 DSA Pro — AI Coding Practice Mentor

<div align="center">
  <img src="./public/dsa-favicon.svg" alt="DSA Pro Logo" width="120" height="120">
  
  <h3>An AI Coding Mentor That Remembers Your Mistakes & Learns With You</h3>
  <br />
  [![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_App-blue?style=for-the-badge)](https://dsapro.netlify.app/)
  [![Hindsight](https://img.shields.io/badge/Hindsight-Agent_Memory-purple?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDJhMTAgMTAgMCAxIDAgMTAgMTBIMTIgVjJaIi8+PC9zdmc+)](https://github.com/vectorize-io/hindsight)
  [![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Groq AI](https://img.shields.io/badge/Groq-AI_Engine-orange?style=flat)](https://groq.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.52.1-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
</div>

---

## 🎯 The Problem

> _"Coding platforms do not remember the patterns of mistakes students make."_

Traditional coding practice platforms like LeetCode treat every session as a blank slate. They don't remember:
- Which **concepts** you consistently struggle with
- What **types of bugs** you keep making
- Which **problem-solving patterns** you've already mastered
- Your **learning velocity** and when you need review vs. new challenges

**DSA Pro** fixes this using **[Hindsight](https://github.com/vectorize-io/hindsight)** — an agent memory system that lets our AI mentor **retain**, **recall**, and **learn** from every coding session.

---

## 🧠 How Hindsight Powers the AI Mentor

Hindsight provides persistent agent memory that makes our AI mentor genuinely learn from your history:

### 🔁 Retain — Remembering Your Journey
Every time you attempt a problem, the AI **retains** key learning signals:
- Code submissions (correct & incorrect)
- Error patterns and debugging sessions
- Problem-solving approach and time spent
- Language preferences and coding style

### 🔍 Recall — Contextual Learning
When generating new recommendations, the AI **recalls** your history to:
- Suggest problems that target your weak areas
- Adjust difficulty based on your actual performance
- Generate personalized daily challenges
- Provide debugging hints based on your past mistakes

### 📈 Reflect — Learning Over Time
The AI **reflects** on accumulated data to:
- Identify recurring mistake patterns
- Track improvement across topics
- Generate insights about your learning velocity
- Build a personalized learning path that evolves with you

```
┌──────────────────────────────────────────────────┐
│                  User Session                     │
│                                                   │
│  Write Code → Run Tests → Get Feedback            │
│       │            │           │                  │
│       ▼            ▼           ▼                  │
│  ┌─────────────────────────────────────┐          │
│  │        Hindsight Memory Layer       │          │
│  │                                     │          │
│  │  retain()  → Store attempt data     │          │
│  │  recall()  → Fetch past patterns    │          │
│  │  reflect() → Generate insights      │          │
│  └─────────────────────────────────────┘          │
│       │                                           │
│       ▼                                           │
│  ┌─────────────────────────────────────┐          │
│  │      Personalized AI Response       │          │
│  │                                     │          │
│  │  • Targeted problem suggestions     │          │
│  │  • Context-aware debug hints        │          │
│  │  • Adaptive daily challenges        │          │
│  │  • Learning path adjustments        │          │
│  └─────────────────────────────────────┘          │
└──────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🤖 AI-Powered Mentoring (with Memory)
- **Personalized Recommendations**: AI remembers your mistakes and targets your weak areas
- **Adaptive Daily Challenges**: Generated based on your actual progress, not random
- **Smart Debug Hints**: AI uses your error history to give targeted debugging suggestions
- **Learning Path Evolution**: Your curriculum adapts as the AI learns your patterns

### 💻 LeetCode-Style Problem Solving
- **375+ Curated Problems** across 15+ data structure categories
- **Built-in Code Editor** (Monaco) with syntax highlighting
- **Real-time Code Execution** via Piston API (supports 25+ languages)
- **Automated Test Cases**: Run Tests button with pass/fail indicators per test case
- **AI-Generated Problem Descriptions** with examples, constraints, and starter code

### 📊 Comprehensive Analytics
- **Real-time Progress Tracking** synced across devices
- **Performance Insights**: Detailed analytics on learning patterns
- **Streak Tracking**: GitHub-style contribution calendar
- **Topic Mastery Visualization**: See your strengths and gaps

### 🎮 Gamification
- **XP & Leveling**: Earn experience points for solving problems
- **Badges & Achievements**: Unlock rewards for milestones
- **Daily Challenges**: AI-generated personalized challenges via Hindsight
- **Streak Bonuses**: Maintain consistency with streak rewards

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18.3 + TypeScript |
| **Styling** | Tailwind CSS 3.4 |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **AI Engine** | Groq AI (fast inference) |
| **Agent Memory** | [Hindsight by Vectorize](https://hindsight.vectorize.io/) |
| **Backend / Auth** | Supabase (Auth, DB, Real-time) |
| **Code Execution** | Piston API (25+ languages) |
| **Build** | Vite |
| **Deployment** | Netlify |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Revanthgowda45/DSApro_learning.git
cd DSApro_learning

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase, Groq, and Hindsight credentials

# Start the dev server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

---

## 📁 Project Structure

```
src/
├── services/
│   ├── hindsightService.ts       # 🧠 Hindsight memory integration (retain/recall/reflect)
│   ├── groqAIService.ts          # AI engine for hints, analysis, challenges
│   ├── problemDescriptionService.ts  # AI-generated problem descriptions + test cases
│   ├── testCaseRunnerService.ts  # LeetCode-style test case execution
│   ├── pistonService.ts          # Code execution via Piston API
│   └── problemProgressService.ts # Progress tracking with Supabase
├── components/
│   └── dashboard/
│       ├── HindsightMemoryWidget.tsx   # Memory insights UI
│       └── HindsightDailyChallenge.tsx # AI-generated daily challenges
├── pages/
│   ├── ProblemSolver.tsx          # Main coding interface with test runner
│   ├── Dashboard.tsx              # Progress overview + AI recommendations
│   └── About.tsx                  # Landing page
└── data/
    └── dsaDatabase.ts             # 375+ curated DSA problems
```

---

## 🔗 Hindsight & Vectorize Resources

- **Hindsight GitHub**: [github.com/vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)
- **Hindsight Documentation**: [hindsight.vectorize.io](https://hindsight.vectorize.io/)
- **Agent Memory by Vectorize**: [vectorize.io/features/agent-memory](https://vectorize.io/features/agent-memory)

---

## 👨‍💻 Developer

**Revanth Gowda H V**

- 📧 [revanthgowda576@gmail.com](mailto:revanthgowda576@gmail.com)
- 🐙 [GitHub](https://github.com/Revanthgowda45)
- 🔗 [LinkedIn](https://www.linkedin.com/in/revanth-gowda-91765a299/)
- 🌐 [Portfolio](https://revanthcode.netlify.app/)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>
    <a href="https://dsapro.netlify.app/">🌐 Try DSA Pro Now</a> •
    <a href="https://github.com/vectorize-io/hindsight">🧠 Hindsight</a> •
    <a href="https://hindsight.vectorize.io/">📖 Docs</a>
  </p>
  <p><em>Built with ❤️ for the Hindsight Hackathon 2026</em></p>
</div>
