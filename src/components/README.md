# `src/components`

## 🎯 Purpose

This directory contains all React components that make up the user interface of the chat application. It includes both custom components and reusable UI components built with Shadcn/ui and Tailwind CSS. The components are organized to provide a modular, maintainable, and scalable UI architecture for the multi-AI chat platform.

## 🔑 Key Components & Files

- `chat-client.tsx`: Main chat interface component that orchestrates the chat experience with message display and input.
- `chat-input.tsx`: Chat input with model selection and attachment UI (attachments are not persisted yet).
- `chat-sidebar.tsx`: Sidebar component for chat history, new chat creation, and navigation.
- `messages-list.tsx`: Component for rendering and managing the list of chat messages.
- `navbar.tsx`: Global navigation bar with user authentication status and theme switching.
- `search-modal.tsx`: Command palette style full‑text chat search with caching and keyboard shortcuts.
- `ui/`: Directory containing reusable Shadcn/ui components (buttons, inputs, cards, etc.).
- `typography/`: Typography-specific components for consistent text styling.
- Auth-related form components: `login-form.tsx`, `sign-up-form.tsx`, `forgot-password-form.tsx`, `update-password-form.tsx`.
- `markdown-components.tsx`: Components for rendering markdown content in chat messages.
- `code-block.tsx`: Syntax-highlighted code block component for displaying code in chat.

## ✨ Core Logic & Features

- **Chat Interface**: Real-time chat functionality with streaming responses and message persistence.
- **Model Selection**: Dynamic AI model switching between Gemini and GPT models.
- **Attachment UI**: Users can select or drag‑and‑drop files; persistence is not implemented yet.
- **Markdown Rendering**: Rich text rendering with syntax highlighting for code blocks.
- **Responsive Design**: Mobile-first responsive design with adaptive layouts.
- **Theme Integration**: Dark/light mode support throughout all components.
- **Form Validation**: Comprehensive form validation for authentication and user input.

## 🔄 Data & State Flow

- **State Management**: Components use React hooks and context for state management.
- **Chat Context**: Chat state is managed through `ChatContext` for real-time updates.
- **Search**: `SearchModal` queries Supabase RPC search functions with a small in‑memory cache.
- **Form State**: Form components manage their own state with validation feedback.
- **Theme State**: Theme switching is handled through `next-themes` integration.
- **Data Input**: Components receive data through props, context, and form submissions.
- **Data Output**: Components emit events, update context, and trigger API calls.

## 🔒 Security & Authentication

- **Form Security**: Authentication forms implement proper validation and error handling.
- **Session Management**: Components integrate with Supabase authentication for user sessions.
- **Protected Routes**: Navigation components handle authentication state and redirects.

## 🚀 Dependencies

- **Internal**:
  - `@/contexts/chat-context`: Chat state management
  - `@/lib/supabase/client`: Supabase client for authentication
  - `@/types/*`: TypeScript type definitions
- **External**:
  - `@ai-sdk/react`: AI chat functionality
  - `react-markdown`: Markdown rendering
  - `@radix-ui/*`: UI primitives for Shadcn/ui
  - `tailwindcss`: Styling framework
  - `lucide-react`: Icon library
