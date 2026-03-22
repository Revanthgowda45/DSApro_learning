# YouTube Video Script & Titles 🎥

**5 High-Performing Video Titles:**
1. My AI Mentor Finally Remembers My Coding Mistakes (Hindsight Hackathon)
2. I Built an AI Coding Coach That Doesn't Forget
3. How I Used Hindsight to Fix My AI Agent’s Amnesia
4. Watch My AI Mentor Roast My Code (With Agent Memory)
5. Why Context Windows Aren't Enough for AI Tutors (Hindsight Demo)

---

## 3-Minute Video Script for DSA Pro

*(Total Time: ~3 minutes)*

### 1. Quick Intro (0:00 - 0:30)
**[Screen Visual]**: *Your face on webcam in the corner, with the DSA Pro main dashboard open behind you.*

**[Audio]**: 
"Hey everyone, I'm Revanth Gowda. 
For the Hindsight Hackathon, I tackled Problem Statement #3: building an AI Coding Practice Mentor. 
I built 'DSA Pro'—a platform where an AI tutor practically sits next to you while you code. But there was a catch: traditional LLM tools are essentially amnesiacs. They forget what you struggled with five minutes ago. I wanted a mentor that actually *learns* your habits. So I wired up Hindsight's agent memory to my code execution engine."

### 2. The Problem: Life Without Memory (0:30 - 1:00)
**[Screen Visual]**: *Show a standard LeetCode style problem in the editor. Open up the developer console or point to a diagram on screen.*

**[Audio]**:
"Normally, if I keep failing at writing optimal 'Dynamic Programming' solutions, a standard bot will just give me the same generic advice over and over. If I paste an entire history of my bad code into a massive context window, Groq gets expensive and confused. It tries to draw connections between totally unrelated problems. It’s like a tutor reading your entire high school transcript every time you ask a question. It just doesn't scale."

### 3. Live Demo: Retain & Recall in Action (1:00 - 2:30)
**[Screen Visual]**: *Jump into VS Code or the live React application showing `hindsightService.ts`. Highlight the `retainCodeAttempt` function.*

**[Audio]**: 
"Here’s where Hindsight changes the game. Look at my `hindsightService.ts` file right here. Whenever a user submits broken code, I don't store the raw text. I synthesize a 'learning signal'—a one-sentence summary like 'User failed Array traversal with an Off-By-One error'—and I call Hindsight's `retainRaw()` endpoint.

*(Switch to the browser showing the AI generating a personalized daily challenge)*

Now watch what happens when I hit my dashboard tomorrow. The app hits my `reflect` endpoint. Hindsight synthesizes all my past failures instantly and builds a 'Daily Challenge' specifically tailored to hitting Array traversal problems. It even primes the AI hints for that challenge with context about my specific edge-case blind spots. The agent literally remembers my bad habits and tries to break them."

### 4. One Key Takeaway (2:30 - 3:00)
**[Screen Visual]**: *Back to the DSA Pro homepage, scrolling through the Analytics metrics.*

**[Audio]**:
"What surprised me most wasn't just how well it worked, but how standard software engineering applied again. By moving memory out of a messy LLM prompt and into a persistent agent state via Hindsight, I can actually debug my agent's 'beliefs' about my coding skills. 
If you’re building agents that need to evolve alongside your users, you have to try Hindsight. 

Thanks for watching, you can find the GitHub repo in the description below!"
