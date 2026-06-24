# AppForge AI

**AppForge AI** is an intelligent, full-stack application generator that takes a simple natural language prompt and autonomously generates complete application blueprints—including UI components, API schemas, Database relationships, and Authentication strategies.

## 🌟 Overview
AppForge AI allows users to describe an application (e.g., "A SaaS project management tool with teams and tasks") and instantly spins up a comprehensive architecture. It is designed to bridge the gap between ideation and scaffolding, providing developers with a structured starting point for any complex web application.

## 🏗️ Architecture
The system is built on a resilient, multi-stage pipeline that interacts with Google's Gemini API:
1. **Mega Generation:** A single optimized LLM call extracts the user's intent, designs the system, and generates the underlying schemas.
2. **Local Validation:** Schemas are rigorously validated against Zod models to ensure consistency.
3. **Auto-Repair Engine:** If the LLM generates invalid JSON or schema mismatches, the local repair engine deterministically patches the architecture without requiring costly API retries.
4. **Demo Mode Fallback:** If the Gemini API hits a `429 Quota Exceeded` rate limit (common on free tiers), the pipeline seamlessly intercepts the error and falls back to pre-defined architectural templates, allowing the application to continue functioning uninterrupted.

## 🛠️ Tech Stack
- **Frontend:** Next.js 15, React 19, Tailwind CSS, Framer Motion
- **Backend:** Next.js App Router (Server Actions & API Routes)
- **Database:** PostgreSQL (via Prisma ORM)
- **AI Integration:** Google Generative AI (Gemini 2.0 Flash)
- **Validation:** Zod
- **Deployment:** Vercel & Docker (Standalone Mode)

## 🚀 Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Google Gemini API Key

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd AppForge_AI
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔑 Environment Variables
Create a `.env.local` file in the root directory with the following keys:
```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/appforge"

# Authentication (NextAuth)
NEXTAUTH_SECRET="your_nextauth_secret_key"
NEXTAUTH_URL="http://localhost:3000"

# AI Integration
GEMINI_API_KEY="your_google_gemini_api_key"
```

## 🔄 Pipeline Flow
1. **User Input:** User submits a prompt via the beautiful, motion-animated dashboard.
2. **Streaming Execution:** The API route triggers the generator, streaming progress events (`stage:start`, `stage:done`) back to the client via SSE (Server-Sent Events).
3. **Resilience Check:** If an API rate limit is reached, the system flips `isDemoMode` to true and uses offline templates.
4. **Validation & Repair:** The output is validated. Missing fields or relational inconsistencies are repaired locally.
5. **Persistence:** The final architecture is saved to the PostgreSQL database.
6. **Preview:** The user is redirected to a dynamic project dashboard to explore their generated schemas and entity relationships.

## ⚠️ Known Limitations
- **API Quotas:** The free tier of the Gemini API is highly sensitive to rate limits. The system employs a "Demo Mode" fallback to mitigate this, but live AI generation may temporarily pause when limits are hit.
- **Relational Complexity:** Highly complex nested entities may occasionally require manual tweaking after the repair engine passes.
- **Metrics Constraints:** Evaluation scripts may throw non-critical foreign key violations when run rapidly against dummy project IDs.

---
*Built with ❤️ to accelerate the future of software development.*
