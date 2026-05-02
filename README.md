# \# code.explain

# 

# > AI-powered code explainer built with React and Groq (LLaMA 3.3 70B)

# 

# Paste any code snippet and get a plain-English explanation instantly. Built for CS students and developers who want to understand code faster — not just run it.

# 

# \---

# 

# \## Features

# 

# \*\*Three explanation modes\*\* — all run in parallel the moment you hit explain

# 

# \- \*\*Explain\*\* — clear general walkthrough of what the code does and how

# \- \*\*Breakdown\*\* — structured analysis with line-by-line breakdown, key concepts, and potential gotchas

# \- \*\*ELI5\*\* — beginner-friendly explanation using real-world analogies, zero jargon

# 

# \*\*Code analysis\*\*

# 

# \- \*\*Complexity analysis\*\* — time and space complexity with a one-sentence reason for each

# \- \*\*Code review\*\* — detects bugs and issues, lists optimization suggestions, and provides an improved version of your code

# 

# \*\*Code translation\*\* — translate your code from one language to another with a full list of changes made and why

# 

# \*\*Multiple sessions\*\* — open multiple tabs at once, each with its own code, results, and state

# 

# \*\*Split view\*\* — code on the left with line numbers, explanation on the right. Click any line to highlight it

# 

# \*\*File upload\*\* — drag or upload `.js`, `.py`, `.java`, `.cpp`, `.c`, `.ts`, `.rs`, `.go`, `.sql`, `.html`, `.css` files with automatic language detection

# 

# \*\*Sample library\*\* — 3 ready-to-run code samples for every supported language

# 

# \---

# 

# \## Tech Stack

# 

# | Layer | Technology |

# |---|---|

# | Frontend | React 18 + Vite |

# | AI Model | LLaMA 3.3 70B via Groq API |

# | API Client | OpenAI SDK (pointed at Groq) |

# | Styling | Inline CSS, no UI library |

# | Fonts | DM Mono, Syne (Google Fonts) |

# | Deployment | Vercel |

# 

# \---

# 

# \## Getting Started

# 

# \### Prerequisites

# 

# \- Node.js (v18 or higher)

# \- A free Groq API key from \[console.groq.com](https://console.groq.com)

# 

# \### Installation

# 

# ```bash

# \# Clone the repo

# git clone https://github.com/thesleepdeprivedkid/Code.Explain.git

# cd Code.Explain

# 

# \# Install dependencies

# npm install

# 

# \# Create your environment file

# cp .env.example .env

# ```

# 

# Open `.env` and add your Groq API key:

# 

# ```

# VITE\_GROQ\_API\_KEY=your\_key\_here

# ```

# 

# \### Run locally

# 

# ```bash

# npm run dev

# ```

# 

# Open \[http://localhost:5173](http://localhost:5173) in your browser.

# 

# \### Build for production

# 

# ```bash

# npm run build

# ```

# 

# \---

# 

# \## Deployment (Vercel)

# 

# 1\. Push the repo to GitHub

# 2\. Go to \[vercel.com](https://vercel.com) and import the repository

# 3\. Set the framework preset to \*\*Vite\*\*

# 4\. Add `VITE\_GROQ\_API\_KEY` as an environment variable in the Vercel dashboard

# 5\. Click Deploy

# 

# Every subsequent `git push` to `main` triggers an automatic redeployment.

# 

# \---

# 

# \## Project Structure

# 

# ```

# code-explainer/

# ├── src/

# │   ├── App.jsx        # Entire application — components, state, API calls

# │   └── App.css        # Empty — all styles are inline within App.jsx

# ├── index.html

# ├── vite.config.js

# ├── package.json

# └── .env               # Not committed — add your own from .env.example

# ```

# 

# \---

# 

# \## How It Works

# 

# 1\. User pastes code or uploads a file

# 2\. On clicking \*\*Explain\*\*, three API calls fire in parallel to Groq — one per mode (Explain, Breakdown, ELI5)

# 3\. Two additional calls run for complexity analysis and code review

# 4\. Results stream back and populate each tab as they arrive

# 5\. The markdown renderer parses the AI response line by line into styled React elements — no external markdown library used

# 

# The Groq client is initialized using the OpenAI SDK with Groq's base URL:

# 

# ```js

# const client = new OpenAI({

# &#x20; apiKey: import.meta.env.VITE\_GROQ\_API\_KEY,

# &#x20; baseURL: "https://api.groq.com/openai/v1",

# &#x20; dangerouslyAllowBrowser: true,

# });

# ```

# 

# \---

# 

# \## Supported Languages

# 

# JavaScript · TypeScript · Python · Java · C++ · C · Rust · Go · SQL · HTML/CSS

# 

# \---

# 

# \## Known Limitations

# 

# \- API key is used client-side — suitable for demos and personal use, not for public production apps with high traffic. For production, proxy API calls through a backend

# \- Code input capped at 8000 characters per request

# \- Groq free tier has rate limits — if you hit them, wait a moment and retry

# 

# \---

# 

# \## Developed by

# 

# \*\*Havish Nadella\*\* and \*\*Vihaan Johann Ajay\*\*

# 

# Powered by \[Groq API](https://groq.com) and \[LLaMA 3.3](https://ai.meta.com/blog/meta-llama-3/)

