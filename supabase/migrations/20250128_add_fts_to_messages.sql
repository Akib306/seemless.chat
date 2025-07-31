-- Add Full Text Search to messages table
-- This migration adds tsvector column and GIN index for fast text search

-- Add tsvector column for full text search
ALTER TABLE messages 
ADD COLUMN content_search tsvector 
GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Create GIN index for fast full text search
CREATE INDEX messages_content_search_idx 
ON messages 
USING gin(content_search);

-- Add index on chat_id for efficient joins when searching
CREATE INDEX IF NOT EXISTS messages_chat_id_idx 
ON messages(chat_id);

-- Add index on user_id for RLS efficiency
CREATE INDEX IF NOT EXISTS messages_user_id_idx 
ON messages(user_id);

-- Add composite index for user search queries
CREATE INDEX messages_user_search_idx 
ON messages(user_id, chat_id);