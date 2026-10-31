# Busitech (Contract2Action AI) — Powered by Ollama Cloud

Enterprise contract intelligence, automated obligation tracking, human-in-the-loop approvals, and risk analysis powered by Ollama Cloud API.

---

## Architecture Overview

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts
- **Backend:** Express, Node.js, TypeScript (`tsx server.ts`)
- **AI Provider:** Ollama Cloud API (`https://ollama.com`)
- **Default Model:** `gemma4:31b-cloud` (configurable via `OLLAMA_MODEL`)
- **Offline & Fallback Resilience:** In-memory mock repositories and Service Worker metadata cache

---

## Getting Started

### 1. Prerequisites
- Node.js (v20.0.0 or higher)
- An Ollama Cloud API Key from [ollama.com](https://ollama.com)

### 2. Configure Environment Variables
Open the `.env` file in the project root directory and paste your Ollama Cloud API key:

```env
# Ollama Cloud Configuration
OLLAMA_API_KEY=your_actual_ollama_cloud_api_key_here
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_MODEL=gemma4:31b-cloud

# Server Configuration
PORT=3000
```

> **Security Note:** The `.env` file is untracked and protected in `.gitignore`. Your API key is processed exclusively server-side and is never bundled or exposed to the client browser.

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## AI Features & Endpoints

- **AI Command Bar (⌘K):** Execute natural language commands, navigate pages, and trigger UI theme changes.
- **AI Business Agent (`/agent`):** Multi-turn conversational chatbot with 8 executive workspace tools (contract search, obligation triage, formal notice drafting, approval resolution).
- **Contract Extractor (`/analyze`):** Structured JSON obligation and clause extraction from raw agreement text.
- **Executive Insights (`/overview`):** Portfolio health scoring, concentration risk, and strategic recommendations.
