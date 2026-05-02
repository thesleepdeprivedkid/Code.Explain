# code.explain

AI-powered code explainer built with React + Groq (LLaMA 3.3 70B).

## Setup

1. Install dependencies:
   npm install

2. Create a .env file in the project root:
   VITE_GROQ_API_KEY=your_key_here
   (Get a free key at console.groq.com)

3. Run the dev server:
   npm run dev

4. Open http://localhost:5173

## Features
- Three explanation modes: Explain, Breakdown, ELI5 — all run in parallel
- Tab switching between explanations
- Split view to see all three side by side
- File upload (.js, .py, .java, .cpp, .c, .ts, .rs, .go, .sql, .html, .css)
- Auto language detection from file extension
- Difficulty selector: Beginner / Intermediate / Expert
- Copy explanation to clipboard
- Load sample code (quicksort)
