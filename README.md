# Seemless Chat

A modern, multi-AI-model chat platform built with Next.js, Supabase, and cutting-edge AI technologies. Seemless Chat provides a seamless conversational experience with support for multiple AI models, real-time streaming, and enterprise-grade security.

## 🚀 Features

- **Multi-AI Model Support**: Chat with Gemini 2.0 Flash, Gemini 1.5 Pro, and GPT-4.1 Nano
- **Real-time Streaming**: Instant, streaming responses for natural conversations
- **Secure Authentication**: Supabase-powered authentication with OAuth support
- **Chat Persistence**: Full chat history with automatic message saving
- **Responsive Design**: Mobile-first design with dark/light theme support
- **File Upload Support**: Attach files to your conversations
- **Markdown Rendering**: Rich text and code syntax highlighting
- **Usage Analytics**: Track API usage and conversation metrics
- **Subscription Management**: Integrated billing with Stripe

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI Integration**: Vercel AI SDK with Google AI and OpenAI
- **Payments**: Stripe for subscription management
- **Analytics**: Posthog for user analytics
- **Deployment**: Vercel

### Project Structure

```
seemless.chat/
├── src/
│   ├── app/                 # Next.js App Router pages and API routes
│   ├── components/          # React components and UI library
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and database operations
│   └── types/              # TypeScript type definitions
├── supabase/               # Database schema and migrations
├── public/                 # Static assets
└── docs/                   # Project documentation
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase CLI
- Stripe account (for payments)
- Google AI API key
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
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # AI Providers
   GOOGLE_AI_API_KEY=your_google_ai_key
   OPENAI_API_KEY=your_openai_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # Posthog
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host
   ```

4. **Set up Supabase**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Start local Supabase
   supabase start
   
   # Run migrations
   supabase db reset
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📚 Documentation

Each directory contains detailed documentation:

- [`src/app/README.md`](src/app/README.md) - App Router and pages
- [`src/components/README.md`](src/components/README.md) - React components
- [`src/lib/README.md`](src/lib/README.md) - Utilities and database operations
- [`src/contexts/README.md`](src/contexts/README.md) - State management
- [`src/hooks/README.md`](src/hooks/README.md) - Custom React hooks
- [`src/types/README.md`](src/types/README.md) - TypeScript definitions
- [`supabase/README.md`](supabase/README.md) - Database schema and migrations

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `supabase db reset` - Reset local database
- `supabase db push` - Push schema changes to remote

## 🚀 Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Supabase Production

1. Create a new Supabase project
2. Run migrations: `supabase db push`
3. Update environment variables with production URLs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- [Documentation](https://docs.seemless.chat)
- [Issues](https://github.com/your-username/seemless.chat/issues)
- [Discussions](https://github.com/your-username/seemless.chat/discussions)
