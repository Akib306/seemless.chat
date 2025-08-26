-- Init attachments storage and metadata
-- - Creates private storage bucket `chat_attachments`
-- - Creates `public.attachments` table with indexes and RLS
-- - Adds RLS policies for `storage.objects` scoped to user-id folder prefix

-- 1) Storage bucket (private) with constraints
-- Some Supabase projects include additional columns like allowed_mime_types and file_size_limit.
-- Upsert the bucket so migration is idempotent.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat_attachments',
  'chat_attachments',
  false,
  10485760, -- 10MB
  array[
    -- images
    'image/jpeg','image/png','image/webp',
    -- docs & data
    'application/pdf','text/plain','text/markdown','application/json','text/csv','text/x-yaml',
    -- web & scripts
    'application/javascript','text/javascript','application/typescript','text/typescript','application/x-sh','text/x-shellscript',
    -- common languages
    'text/x-python','text/x-go','text/x-java-source','text/x-c','text/x-c++','text/x-sql','text/x-ruby','text/x-php'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 2) Attachments table (metadata)
create table if not exists public.attachments (
  id            uuid         not null primary key default gen_random_uuid(),
  message_id    uuid         not null references public.messages(id) on delete cascade,
  user_id       uuid         not null references public.profiles(id) on delete cascade,
  storage_path  text         not null unique, -- e.g., '{user_id}/{message_id}/{uuid}.{ext}'
  file_name     text         not null,
  mime_type     text         not null,
  file_size     bigint       not null,
  created_at    timestamptz  not null default now(),

  -- Ensure path is scoped under the user’s folder
  constraint attachments_storage_path_prefix_check
    check (split_part(storage_path, '/', 1) = user_id::text),

  -- DB-side size cap (mirror bucket limit; adjust if you introduce tiers)
  constraint attachments_file_size_limit_check
    check (file_size > 0 and file_size <= 10485760)
);

-- Indexes for common access patterns
create index if not exists idx_attachments_message_id on public.attachments(message_id);
create index if not exists idx_attachments_user_id on public.attachments(user_id);
create index if not exists idx_attachments_created_at on public.attachments(created_at);

-- Optional description
comment on table public.attachments is 'Stores metadata for files attached to chat messages.';
comment on column public.attachments.storage_path is 'Full object path in the chat_attachments bucket.';

-- 3) RLS for attachments metadata
alter table public.attachments enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'attachments' and policyname = 'attachments: insert own'
  ) then
    create policy "attachments: insert own"
      on public.attachments for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'attachments' and policyname = 'attachments: select own'
  ) then
    create policy "attachments: select own"
      on public.attachments for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'attachments' and policyname = 'attachments: update own'
  ) then
    create policy "attachments: update own"
      on public.attachments for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'attachments' and policyname = 'attachments: delete own'
  ) then
    create policy "attachments: delete own"
      on public.attachments for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

-- 4) Storage policies for objects (per-user folder prefix)

-- Insert restricted to paths beginning with the user id
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'objects: insert own (chat_attachments)'
  ) then
    create policy "objects: insert own (chat_attachments)"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'chat_attachments'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;

-- Read restricted to objects under the user-id prefix
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'objects: select own (chat_attachments)'
  ) then
    create policy "objects: select own (chat_attachments)"
      on storage.objects for select
      to authenticated
      using (
        bucket_id = 'chat_attachments'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;

-- Update restricted to objects under the user-id prefix
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'objects: update own (chat_attachments)'
  ) then
    create policy "objects: update own (chat_attachments)"
      on storage.objects for update
      to authenticated
      using (
        bucket_id = 'chat_attachments'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;

-- Delete restricted to objects under the user-id prefix
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'objects: delete own (chat_attachments)'
  ) then
    create policy "objects: delete own (chat_attachments)"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'chat_attachments'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;


