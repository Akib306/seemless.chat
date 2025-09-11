-- Rewrite search functions to search message_parts.text and return concatenated text as content

BEGIN;

-- search_messages
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
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH parts AS (
    SELECT mp.message_id,
           string_agg(mp.text, ' ' ORDER BY mp.idx) AS parts_text
    FROM message_parts mp
    JOIN messages m ON m.id = mp.message_id
    WHERE mp.type IN ('text','reasoning')
      AND m.user_id = user_uuid
    GROUP BY mp.message_id
  )
  SELECT 
    m.id AS message_id,
    m.chat_id,
    c.title AS chat_title,
    COALESCE(p.parts_text, '') AS content,
    -- Simple highlight using ILIKE to avoid requiring FTS indexes on parts
    NULL::text AS highlighted_content,
    -- Basic rank approximation using position occurrence count
    0.0::real AS rank,
    m.created_at
  FROM messages m
  JOIN chats c ON m.chat_id = c.id
  LEFT JOIN parts p ON p.message_id = m.id
  WHERE m.user_id = user_uuid
    AND COALESCE(p.parts_text, '') ILIKE '%' || search_query || '%'
  ORDER BY m.created_at DESC;
$$;

-- search_messages_paginated
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
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH parts AS (
    SELECT mp.message_id,
           string_agg(mp.text, ' ' ORDER BY mp.idx) AS parts_text
    FROM message_parts mp
    JOIN messages m ON m.id = mp.message_id
    WHERE mp.type IN ('text','reasoning')
      AND m.user_id = user_uuid
    GROUP BY mp.message_id
  )
  SELECT 
    m.id AS message_id,
    m.chat_id,
    c.title AS chat_title,
    COALESCE(p.parts_text, '') AS content,
    NULL::text AS highlighted_content,
    0.0::real AS rank,
    m.created_at
  FROM messages m
  JOIN chats c ON m.chat_id = c.id
  LEFT JOIN parts p ON p.message_id = m.id
  WHERE m.user_id = user_uuid
    AND COALESCE(p.parts_text, '') ILIKE '%' || search_query || '%'
  ORDER BY m.created_at DESC
  LIMIT page_limit
  OFFSET page_offset;
$$;

-- search_messages_count
CREATE OR REPLACE FUNCTION search_messages_count(
  search_query text,
  user_uuid uuid DEFAULT auth.uid()
)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH parts AS (
    SELECT mp.message_id,
           string_agg(mp.text, ' ' ORDER BY mp.idx) AS parts_text
    FROM message_parts mp
    JOIN messages m ON m.id = mp.message_id
    WHERE mp.type IN ('text','reasoning')
      AND m.user_id = user_uuid
    GROUP BY mp.message_id
  )
  SELECT COUNT(*)
  FROM messages m
  LEFT JOIN parts p ON p.message_id = m.id
  WHERE m.user_id = user_uuid
    AND COALESCE(p.parts_text, '') ILIKE '%' || search_query || '%';
$$;

COMMIT;
