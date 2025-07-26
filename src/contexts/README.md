# `src/contexts`

## 🎯 Purpose

This directory contains React Context providers that manage global application state and provide shared functionality across components. The contexts handle complex state management for chat functionality, user sessions, and application-wide features, ensuring consistent data flow and reducing prop drilling throughout the component tree.

## 🔑 Key Components & Files

* `chat-context.tsx`: Main chat context provider that manages chat state, AI model selection, message handling, and real-time chat functionality.

## ✨ Core Logic & Features

* **Chat State Management**: Centralized management of chat sessions, messages, and AI model selection.
* **Real-time Updates**: Handles streaming responses and real-time message updates from AI models.
* **Model Switching**: Dynamic AI model selection between Gemini and GPT models.
* **Message Persistence**: Automatic saving of chat messages to the database.
* **Navigation Integration**: Seamless integration with Next.js routing for chat sessions.
* **Error Handling**: Comprehensive error handling for chat operations and API failures.

## 🔄 Data & State Flow

* **State Management**: Uses React Context API with `useState` and `useRef` for state management.
* **Data Input**: Receives initial messages and chat ID from parent components.
* **Data Processing**: Processes AI responses and manages message formatting.
* **Data Output**: Provides chat state, methods, and real-time updates to child components.
* **External Integration**: Integrates with AI SDK for streaming responses and database operations.
* **Navigation Control**: Manages routing between chat sessions and new chat creation.

## 🔒 Security & Authentication

* **User Scoping**: All chat operations are scoped to authenticated users.
* **Data Validation**: Validates message content and user permissions before operations.
* **Session Management**: Integrates with Supabase authentication for user session validation.
* **Error Boundaries**: Implements error boundaries for graceful failure handling.

## 🚀 Dependencies

* **Internal**: 
  * `@/lib/db/client`: Database operations for message persistence
  * `@/types/db`: TypeScript types for database entities
* **External**: 
  * `@ai-sdk/react`: AI chat functionality and streaming
  * `react`: React hooks and context API
  * `next/navigation`: Next.js routing utilities 