# Seemless Chat

A modern multi‑model AI chat application built with Next.js (App Router), Supabase, and the Vercel AI SDK. Seemless Chat provides real‑time streaming, authentication, and persistent chat history.

## 🚀 Features

- **Multi‑AI model support**: Gemini 2.0 Flash, Gemini 1.5 Flash, Gemini 1.5 Pro, and GPT‑4.1 Nano
- **Real‑time streaming**: Natural, low‑latency responses
- **Authentication**: Supabase Auth with OAuth and email OTP
- **Chat persistence**: Profiles, chats, and messages with RLS
- **Chat search**: Full‑text search across your chats with highlighting
- **Auto titles**: First message can auto‑generate a concise chat title
- **Responsive UI**: Mobile‑first design with dark/light theme
- **Markdown + math**: Rich markdown, syntax highlighting, and LaTeX rendering
- **Attachments UI**: File attachment UI is present; uploads are not persisted yet

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth)
- **AI**: Vercel AI SDK with Google and OpenAI providers
- **Deployment**: Vercel

### Project Structure

```
seemless.chat/
├── src/
│   ├── app/          # App Router pages and API routes
│   ├── components/   # React components and UI
│   ├── contexts/     # React context providers
│   ├── hooks/        # Custom hooks
│   ├── lib/          # DB utils, Supabase clients, helpers
│   └── types/        # Type definitions (including Supabase)
├── supabase/         # Schemas and migrations (incl. FTS + search functions)
├── public/           # Static assets
└── README.md
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)
- Supabase CLI
- Google Generative AI API key
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/seemless.chat.git
   cd seemless.chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file and set:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI Providers
   OPENAI_API_KEY=your_openai_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_generative_ai_key
   ```

4. **Set up Supabase**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Start local Supabase
   supabase start

   # Run migrations (drops and recreates local DB)
   supabase db reset
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📚 Documentation

Helpful overviews in this repo:

- [`src/app/README.md`](src/app/README.md) — App Router and pages
- [`src/components/README.md`](src/components/README.md) — UI components
- [`src/lib/README.md`](src/lib/README.md) — DB utilities and Supabase clients
  - Pin-aware cache priority: pinned chats are prioritized for warming and eviction. See `src/lib/cache/`.
- [`src/contexts/README.md`](src/contexts/README.md) — Global chat state
- [`src/hooks/README.md`](src/hooks/README.md) — Custom hooks
- [`src/types/README.md`](src/types/README.md) — Type definitions
- [`supabase/README.md`](supabase/README.md) — Schemas, migrations, and FTS search

## 🔧 Available Scripts

- `npm run dev` — Start the dev server (Turbopack)
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run format` — Format with Prettier

Supabase CLI (installed globally):
- `supabase db reset` — Reset local database and apply migrations
- `supabase db push` — Push schema changes to remote

## 🚀 Deployment

### Vercel

1. Connect the repo
2. Add environment variables in the project settings
3. Deploy on push to `main`

### Supabase

1. Create a Supabase project
2. Apply schema: `supabase db push`
3. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

License to be determined.
