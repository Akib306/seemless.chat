# `supabase`

## 🎯 Purpose

This directory contains all Supabase-related configuration, database schema definitions, and migration files. It serves as the single source of truth for the database structure, including tables, relationships, Row Level Security (RLS) policies, and database functions. The directory manages the complete database lifecycle from development to production.

## 🔑 Key Components & Files

* `config.toml`: Supabase project configuration file defining project settings and environment variables.
* `migrations/`: Database migration files that define schema changes and version control.
  * `20250503152448_init_profiles.sql`: Initial profiles table creation.
  * `20250503170952_add_rls_to_profiles.sql`: Row Level Security policies for profiles.
  * `20250506023509_init_subscriptions.sql`: Subscription management table.
  * `20250506033825_init_chats.sql`: Chat sessions table.
  * `20250506035359_init_messages.sql`: Chat messages table.
  * `20250506042040_init_api_usage.sql`: API usage tracking table.
  * `20250506042549_init_usage_summaries.sql`: Usage summary aggregations.
  * `20250509042516_force_recreate_tables.sql`: Table recreation for schema updates.
* `schemas/`: SQL schema files defining table structures and relationships.
  * `profiles.sql`: User profile table schema.
  * `subscriptions.sql`: Subscription and billing table schema.
  * `chats.sql`: Chat sessions table schema.
  * `messages.sql`: Chat messages table schema.
  * `api_usage.sql`: API usage tracking schema.
  * `usage_summaries.sql`: Usage summary table schema.

## ✨ Core Logic & Features

* **Database Schema Management**: Comprehensive schema definition for a multi-AI chat platform.
* **Row Level Security**: Sophisticated RLS policies ensuring users can only access their own data.
* **Subscription Management**: Complete billing and subscription tracking system.
* **Usage Analytics**: Detailed API usage tracking and analytics for billing and monitoring.
* **Chat Persistence**: Full chat history and message storage with proper relationships.
* **User Management**: User profiles with authentication integration.
* **Migration Versioning**: Proper database migration versioning for deployment safety.

## 🔄 Data & State Flow

* **Schema Evolution**: Migrations handle database schema changes over time.
* **Data Relationships**: Proper foreign key relationships between users, chats, and messages.
* **Data Aggregation**: Usage summaries aggregate raw usage data for reporting.
* **Data Partitioning**: Efficient data partitioning for large-scale chat applications.
* **Backup and Recovery**: Migration-based approach enables easy database recovery.

## 🔒 Security & Authentication

* **Row Level Security**: Comprehensive RLS policies protect user data at the database level.
* **User Isolation**: Users can only access their own chats, messages, and subscription data.
* **API Key Management**: Secure API key storage and usage tracking.
* **Audit Trail**: Complete audit trail for all database operations and changes.
* **Encryption**: Data encryption at rest and in transit through Supabase.

## 🚀 Dependencies

* **Internal**: 
  * No internal dependencies
* **External**: 
  * `supabase`: Supabase CLI and platform
  * `postgresql`: PostgreSQL database engine
  * `pgcrypto`: PostgreSQL encryption extensions 