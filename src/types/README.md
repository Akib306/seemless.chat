# `src/types`

## 🎯 Purpose

This directory contains TypeScript type definitions, interfaces, and type utilities that provide type safety throughout the application. It includes both manually defined types and auto-generated types from Supabase, ensuring consistent data structures and compile-time type checking across the entire codebase.

## 🔑 Key Components & Files

* `db.ts`: Core database entity types and interfaces for the application's data models.
* `supabase.ts`: Auto-generated TypeScript types from Supabase schema, including database tables, functions, and composite types.

## ✨ Core Logic & Features

* **Type Safety**: Comprehensive TypeScript definitions for all application entities and operations.
* **Database Types**: Auto-generated types from Supabase schema ensure type safety for database operations.
* **API Contracts**: Well-defined interfaces for API requests and responses.
* **Component Props**: Type definitions for React component props and state.
* **Utility Types**: Helper types for common patterns and transformations.
* **Schema Validation**: Type definitions that align with database schema constraints.

## 🔄 Data & State Flow

* **Type Input**: Receives type definitions from Supabase schema generation and manual definitions.
* **Type Processing**: Processes and extends base types with application-specific interfaces.
* **Type Output**: Provides type definitions consumed by components, API routes, and utility functions.
* **Type Inference**: Enables TypeScript's type inference for better developer experience.
* **Compile-time Validation**: Ensures type safety at compile time rather than runtime.

## 🔒 Security & Authentication

* **Type Validation**: Type definitions help prevent invalid data structures and type-related security issues.
* **Input Validation**: Types ensure proper validation of user inputs and API requests.
* **Database Safety**: Strong typing prevents SQL injection and invalid database operations.
* **Authentication Types**: Type definitions for user authentication and session management.

## 🚀 Dependencies

* **Internal**: 
  * No internal dependencies
* **External**: 
  * `@supabase/supabase-js`: Supabase client types
  * `typescript`: TypeScript compiler and type system 