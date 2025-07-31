-- Database functions for chat search functionality

-- Function to search messages and return results with chat context
CREATE OR REPLACE FUNCTION search_messages(
  search_query text,
  user_uuid uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  message_id uuid,
  chat_id uuid,
  chat_title text,
  content text,
  highlighted_content text,
  rank real,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as message_id,
    m.chat_id,
    c.title as chat_title,
    m.content,
    ts_headline('english', m.content, plainto_tsquery('english', search_query)) as highlighted_content,
    ts_rank(m.content_search, plainto_tsquery('english', search_query)) as rank,
    m.created_at
  FROM messages m
  JOIN chats c ON m.chat_id = c.id
  WHERE 
    m.user_id = user_uuid
    AND m.content_search @@ plainto_tsquery('english', search_query)
  ORDER BY 
    ts_rank(m.content_search, plainto_tsquery('english', search_query)) DESC,
    m.created_at DESC;
END;
$$;

-- Function to search messages with pagination
CREATE OR REPLACE FUNCTION search_messages_paginated(
  search_query text,
  page_limit integer DEFAULT 20,
  page_offset integer DEFAULT 0,
  user_uuid uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  message_id uuid,
  chat_id uuid,
  chat_title text,
  content text,
  highlighted_content text,
  rank real,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as message_id,
    m.chat_id,
    c.title as chat_title,
    m.content,
    ts_headline('english', m.content, plainto_tsquery('english', search_query), 
                'MaxWords=15, MinWords=5, ShortWord=3') as highlighted_content,
    ts_rank(m.content_search, plainto_tsquery('english', search_query)) as rank,
    m.created_at
  FROM messages m
  JOIN chats c ON m.chat_id = c.id
  WHERE 
    m.user_id = user_uuid
    AND m.content_search @@ plainto_tsquery('english', search_query)
  ORDER BY 
    ts_rank(m.content_search, plainto_tsquery('english', search_query)) DESC,
    m.created_at DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$;

-- Function to get search result counts
CREATE OR REPLACE FUNCTION search_messages_count(
  search_query text,
  user_uuid uuid DEFAULT auth.uid()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_count integer;
BEGIN
  SELECT COUNT(*)
  INTO result_count
  FROM messages m
  WHERE 
    m.user_id = user_uuid
    AND m.content_search @@ plainto_tsquery('english', search_query);
  
  RETURN result_count;
END;
$$;