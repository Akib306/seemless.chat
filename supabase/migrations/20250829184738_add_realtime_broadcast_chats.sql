-- Enable authenticated users to receive broadcasts from realtime.messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'realtime'
      AND tablename = 'messages'
      AND policyname = 'authenticated can receive broadcasts'
  ) THEN
    CREATE POLICY "authenticated can receive broadcasts"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING ( true );
  END IF;
END
$$;

-- Broadcast chats table changes to a per-user topic: "chats:user:<user_id>"
CREATE OR REPLACE FUNCTION public.chats_broadcast_changes()
RETURNS trigger
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  topic text;
BEGIN
  topic := 'chats:user:' || COALESCE(NEW.user_id, OLD.user_id)::text;
  PERFORM realtime.broadcast_changes(
    topic,
    TG_OP,            -- event name
    TG_OP,            -- operation
    TG_TABLE_NAME,    -- table
    TG_TABLE_SCHEMA,  -- schema
    NEW,              -- new record
    OLD               -- old record
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists and is idempotent
DROP TRIGGER IF EXISTS broadcast_changes_for_chats ON public.chats;
CREATE TRIGGER broadcast_changes_for_chats
AFTER INSERT OR UPDATE OR DELETE ON public.chats
FOR EACH ROW
EXECUTE FUNCTION public.chats_broadcast_changes();
