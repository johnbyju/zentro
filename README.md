# Zentro

> **The first browser-native, zero-install AI app builder** — where the LLM runs in your browser tab, not on someone else's server.

Zentro is a full-stack Next.js application that combines a **5-pass AI code generation workspace**, an **on-device chat assistant**, and a **Bring Your Own API Key (BYOK)** system — all in one URL, with no account required.

---

## ✨ What Makes Zentro Different

| Feature | Zentro | Cursor / Bolt.new / v0 | Ollama / Dyad |
|---|---|---|---|
| LLM runs in-browser (WebGPU) | ✅ | ❌ (cloud inference) | ❌ (requires install) |
| Zero install, zero account | ✅ | ❌ | ❌ |
| 5-pass AI code generation pipeline | ✅ | ❌ | ❌ |
| Bring Your Own API Key | ✅ | ❌ | N/A |
| Live preview sandbox | ✅ | Partial | ❌ |
| On-device chat assistant | ✅ | ❌ | ✅ |
| Offline capability | ✅ (Local AI mode) | ❌ | ✅ |

---

## 🗺️ Pages & Routes

### `/` — Landing Page
The product landing page. Showcases the core value proposition, feature highlights, pipeline comparison, and a link to the workspace.

### `/workspace` — AI App Builder
The main code generation workspace. Features:
- **5-Pass AI Pipeline** — Analyze → Plan → Generate → Self-Review → Polish
- **Monaco-style code editor** with HTML / CSS / JS tabs
- **Live sandbox preview** with console output
- **Server Engine** (cloud AI) and **Local AI (Offline)** modes
- **Export as ZIP** — download the generated app
- **Dark / Light theme** toggle
- **API Key Manager** — save and use your own API keys per provider

### `/assistant` — Chat Assistant
A full chat interface powered by either server-side AI or a locally-running LLM. Features:
- Multi-session chat history (stored in IndexedDB via Dexie)
- **Personas** — preset AI personalities (Vibe Coder, Mentor, Debugger, Analyst…)
- **Memory system** — persist facts about yourself across sessions
- **Power Mode** — renders AI responses as rich HTML
- **Local AI (Offline)** — downloads and runs quantized models directly in your browser tab using `@xenova/transformers`
- **API Key Manager** — same key store shared with Workspace

---

## 🤖 AI Providers & Models

### Server Engine (requires API key)

| Provider | Models | Key env var |
|---|---|---|
| **Google Gemini** | `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.5-flash-lite` | `GEMINI_API_KEY` |
| **Groq** | `llama-3.3-70b-versatile`, `llama-3.1-70b-versatile` | `GROQ_API_KEY` |
| **OpenRouter** | `meta-llama/llama-3.1-8b-instruct:free`, `google/gemma-2-9b-it:free` | `OPENROUTE_API_KEY` |

### Local AI (Offline / In-Browser)
Runs quantized models entirely in your browser tab using WebAssembly + WebGPU via `@xenova/transformers`. No server call is made.

| Model | Size | Good for |
|---|---|---|
| `Xenova/Qwen1.5-0.5B-Chat` | ~300 MB | Fast responses, limited context |
| `Xenova/TinyLlama-1.1B-Chat-v1.0` | ~600 MB | Balanced quality / speed |
| `Xenova/LaMini-GPT-124M` | ~125 MB | Lightweight, instant |

---

## 🔑 API Key Setup

### Option 1 — Server `.env` (shared default)
Create a `.env` file in the project root:

```env
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
OPENROUTE_API_KEY=sk-or-...
HUGGING_FACE_TOKEN=hf_...
```

`HUGGING_FACE_TOKEN` is required for gated models (Phi, LLaMA, etc.). Model downloads are proxied through Next.js (`/api/huggingface/`) so the token stays server-side and is never exposed to the browser.

### Option 2 — Bring Your Own Key (per-user, in-browser)
Click the **🔑 API Keys** button in the top header of the Workspace or Assistant page.

- Keys are stored in **`localStorage`** only — never sent to our servers or a database.
- User-supplied keys take **priority** over the `.env` server key.
- Removing a key reverts to the server default automatically.

**Key format hints:**

| Provider | Format |
|---|---|
| Google Gemini | `AIza...` |
| Groq | `gsk_...` |
| OpenRouter | `sk-or-...` |
| Hugging Face | `hf_...` |

---

## 🏗️ Project Architecture

```
local-ai-builder/
├── src/
│   └── app/
│       ├── page.tsx               # Landing page
│       ├── layout.tsx             # Root layout (Outfit font, metadata)
│       ├── globals.css            # Tailwind v4 + theme tokens
│       ├── workspace/
│       │   └── page.tsx           # AI App Builder workspace
│       ├── assistant/
│       │   └── page.tsx           # Chat assistant
│       └── api/
│           ├── generate/
│           │   └── route.ts       # SSE streaming 5-pass pipeline
│           └── chat/
│               └── route.ts       # Single-turn chat completions
├── tests/
│   ├── zentro.spec.ts        # Playwright e2e tests
│   └── assets/
│       └── api-key-manager/       # Test screenshots
├── test-results/                  # Playwright output
├── public/                        # Static assets
└── .env                           # API keys (do not commit)
```

---

## ⚙️ 5-Pass Generation Pipeline

When you send a prompt in Workspace mode with a server engine selected, the request flows through 5 sequential AI passes streamed via **Server-Sent Events (SSE)**:

```
Pass 1 → Analyze     Parse the user intent, extract app name & feature list
Pass 2 → Plan        Produce a step-by-step architecture plan
Pass 3 → Generate    Write the full single-page HTML/CSS/JS app
Pass 4 → Self-Review Audit the code for broken tags, script errors, layout bugs
Pass 5 → Polish      Apply gradients, glassmorphism, micro-animations, dark mode
```

Each pass result streams live into the editor and pipeline status indicators update in real time. If no API key is configured, a procedural fallback generator runs offline.

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd local-ai-builder
npm install
```

### 2. Configure API Keys

```bash
cp .env.example .env
# then edit .env and add your keys
```

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 🧪 Running Tests

The project uses **Playwright** for end-to-end testing.

```bash
# Run all tests
npx playwright test

# Run tests with UI
npx playwright test --ui

# View last test report
npx playwright show-report
```

Test screenshots and recordings are saved under [`tests/assets/`](./tests/assets/).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Font | Outfit (Google Fonts) |
| Icons | Lucide React |
| Local AI | `@xenova/transformers` (WebAssembly + WebGPU) |
| Database | Dexie.js (IndexedDB wrapper) |
| Code Editor | Monaco Editor |
| Testing | Playwright |
| AI Providers | Google Gemini, Groq, OpenRouter |

---

## 🔒 Privacy & Security

- **Local AI mode** is fully offline — no data leaves your device.
- **User API keys** (BYOK) are stored in `localStorage` and sent directly to the AI provider per request. They are never logged, stored in a database, or transmitted to Zentro servers.
- **Server mode** routes requests through Next.js API routes which use your configured `.env` keys or user-supplied keys.

---

## 📂 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | For Gemini models | Google AI Studio API key |
| `GROQ_API_KEY` | For Groq models | Groq Console API key |
| `OPENROUTE_API_KEY` | For OpenRouter models | OpenRouter API key |

Get free keys at:
- Gemini → [aistudio.google.com](https://aistudio.google.com)
- Groq → [console.groq.com](https://console.groq.com)
- OpenRouter → [openrouter.ai/keys](https://openrouter.ai/keys)

---


