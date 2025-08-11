# `src/app`

## 🎯 Purpose

This directory contains the core Next.js application using the App Router pattern. It serves as the main entry point for the web application, housing all pages, API routes, and layouts. The app provides a multi-AI-model chat platform with authentication, real-time chat functionality, and a responsive user interface.

## 🔑 Key Components & Files

* `layout.tsx`: Root layout component that wraps the entire application with theme provider, global styles, and navigation.
* `page.tsx`: Public landing page. Authenticated chat lives under `/chat`.
* `globals.css`: Global CSS styles including Tailwind CSS directives and custom theme variables.
* `api/`: Directory containing all API route handlers for chat functionality, authentication, and title generation.
* `auth/`: Authentication-related pages including login, sign-up, password management, and error handling.
* `chat/`: Chat interface pages with dynamic routing for individual chat sessions.
* `favicon.ico`: Application favicon.

## ✨ Core Logic & Features

* **App Router Architecture**: Implements Next.js 13+ App Router with server and client components for optimal performance.
* **Theme Management**: Integrates `next-themes` for dark/light mode support with system preference detection.
* **Global Layout**: Provides consistent navigation and layout structure across all pages.
* **Font Optimization**: Uses Geist font with proper font loading optimization.
* **Responsive Design**: Implements mobile-first responsive design with Tailwind CSS.

## 🔄 Data & State Flow

* **Global State**: Theme state is managed at the root via `ThemeProvider`.
* **Navigation**: Global `Navbar` renders from the root layout.
* **Authentication Flow**: Middleware protects app routes (e.g., `/chat`). Auth pages under `/auth/*` handle login/sign‑up and OTP/OAuth callbacks.
* **Dynamic Routing**: Chat pages use dynamic routing (`[chatid]`) for individual chat sessions.

## 🔒 Security & Authentication

* **Route Protection**: Authentication pages handle user sessions and redirect logic.
* **API Security**: API routes implement proper request validation and error handling.
* **Environment Variables**: Sensitive configuration is handled through environment variables.

## 🚀 Dependencies

* **Internal**: 
  * `@/components/navbar`: Global navigation component
  * `@/components/*`: Various UI components for pages
* **External**: 
  * `next/font/google`: Font optimization
  * `next-themes`: Theme management
  * `@/types/*`: TypeScript type definitions 