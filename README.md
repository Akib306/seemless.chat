# Seamless Chat

A web-based multi-AI chat platform that enables users to interact with multiple AI models in a seamless conversation flow.

## Features

- Authentication with email and password
- Password reset functionality
- Protected routes for authenticated users
- Modern UI with Tailwind CSS and shadcn/ui
- Supabase backend integration

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) to view the application

## Tech Stack

- Next.js for the frontend and API
- Supabase for authentication and database
- Tailwind CSS for styling
- TypeScript for type safety
