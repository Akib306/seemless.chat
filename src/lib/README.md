# `src/lib`

## 🎯 Purpose

This directory contains core utility functions, database operations, and service integrations that power the application. It serves as the foundation layer providing database access, Supabase client configuration, and shared utility functions used throughout the application. The lib directory abstracts complex operations and provides a clean API for components and API routes.

## 🔑 Key Components & Files

- `db/`: Database operations and utilities for interacting with Supabase PostgreSQL.
  - `client.ts`: Client-side database utilities with user authentication.
  - `server.ts`: Server-side database utilities for API routes.
  - `core.ts`: Core database utility functions and type definitions.
- `supabase/`: Supabase client configuration and middleware.
  - `client.ts`: Browser-side Supabase client configuration.
  - `server.ts`: Server-side Supabase client configuration.
  - `middleware.ts`: Supabase middleware for authentication and session management.
- `utils/`: General utility functions and helpers.
  - `utils.ts`: Common utility functions for the application.
  - `debug-chat.ts`: Debug utilities for chat functionality.
- `utils.ts`: Root-level utilities (if present).

## ✨ Core Logic & Features

- **Database Operations**: CRUD utilities for profiles, chats, messages, subscriptions, API usage, and search RPCs.
- **Authentication Integration**: Seamless integration with Supabase authentication for user management.
- **Row Level Security**: Implementation of Supabase RLS policies for data security.
- **Type Safety**: Full TypeScript support with generated types from Supabase schema.
- **Error Handling**: Robust error handling and validation for database operations.
- **Performance Optimization**: Efficient database queries and connection management.

## 🔄 Data & State Flow

- **Data Input**: Receives data from API routes, components, and external services.
- **Data Processing**: Transforms and validates data before database operations.
- **Data Output**: Returns structured data to components and API routes.
- **State Management**: Manages database connections and authentication state.
- **Search**: Exposes helpers to call Postgres functions `search_messages`, `search_messages_paginated`, and `search_messages_count`.

## 🔒 Security & Authentication

- **User Authentication**: All database operations are scoped to authenticated users.
- **Row Level Security**: Supabase RLS policies ensure users can only access their own data.
- **Input Validation**: Comprehensive validation of all database inputs.
- **SQL Injection Prevention**: Uses parameterized queries and Supabase client methods.
- **Session Management**: Secure session handling through Supabase middleware.

## 🚀 Dependencies

- **Internal**:
  - `@/types/db`: Database type definitions
  - `@/types/supabase`: Supabase generated types
- **External**:
  - `@supabase/supabase-js`: Supabase JavaScript client
  - `@supabase/ssr`: Server-side rendering support for Supabase
  - `postgres`: PostgreSQL database driver
