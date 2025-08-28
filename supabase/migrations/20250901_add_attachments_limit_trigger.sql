-- Enforce hard limit of 10 attachments per message using a trigger with advisory lock
-- Idempotent: drops old trigger/function if they exist and recreates them

begin;

-- Drop previous objects if they exist
drop trigger if exists trg_attachments_limit_per_message on public.attachments;
drop function if exists public.enforce_attachments_limit_per_message() cascade;

-- Create function that enforces the limit
create or replace function public.enforce_attachments_limit_per_message()
returns trigger
language plpgsql
as $$
declare
  max_allowed integer := 10;
  current_count integer;
  lock_key bigint;
begin
  -- Use a transaction-scoped advisory lock derived from message_id
  lock_key := hashtextextended(new.message_id::text, 0);
  perform pg_advisory_xact_lock(lock_key);

  select count(*) into current_count from public.attachments where message_id = new.message_id;
  if current_count >= max_allowed then
    raise exception 'You can attach up to % files per message.', max_allowed using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Attach the trigger to the attachments table
create trigger trg_attachments_limit_per_message
before insert on public.attachments
for each row
execute function public.enforce_attachments_limit_per_message();

commit;


