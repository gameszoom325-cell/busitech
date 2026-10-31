# Busitech (Contract2Action)

Enterprise contract intelligence, automated obligation tracking, human-in-the-loop approvals, and risk analysis.

---

## Architecture Overview

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts
- **Backend:** Express, Node.js, TypeScript (`tsx server.ts`)
- **Offline & Fallback Resilience:** In-memory mock repositories and Service Worker metadata cache

---

## Getting Started

### 1. Prerequisites
- Node.js (v20.0.0 or higher)

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

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

## Features

- **Contracts Management (`/contracts`):** Comprehensive contract portfolio management and document overview.
- **Obligations Tracking (`/obligations`):** Real-time obligation timeline, priority triage, and deadline monitoring.
- **Human-in-the-Loop Approvals (`/approvals`):** Multi-stage approval workflows for high-risk actions.
- **Executive Dashboard (`/overview`):** Portfolio health scoring, concentration risk, and executive reporting.
- **Audit & Activity Log (`/activity`):** Immutable audit trail of contract modifications, approval events, and actions.
