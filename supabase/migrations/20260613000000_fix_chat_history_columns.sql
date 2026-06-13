alter table if exists public.chats
  add column if not exists pinned_at timestamptz;

drop index if exists public.chats_user_pinned_updated_idx;
create index if not exists chats_user_pinned_updated_idx
  on public.chats (user_id, pinned_at desc nulls last, updated_at desc);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'messages_role_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages drop constraint messages_role_check;
  end if;
end $$;

alter table if exists public.messages
  add constraint messages_role_check check (role in ('user', 'assistant'));
