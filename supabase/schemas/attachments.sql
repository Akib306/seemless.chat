create table if not exists attachments (
  id            uuid         not null primary key default uuid_generate_v4(),
  message_id    uuid         not null references messages(id) on delete cascade,
  user_id       uuid         not null references profiles(id) on delete cascade,
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
create index if not exists idx_attachments_message_id on attachments(message_id);
create index if not exists idx_attachments_user_id on attachments(user_id);
create index if not exists idx_attachments_created_at on attachments(created_at);

-- RLS
alter table attachments enable row level security;

create policy "attachments: insert own"
  on attachments for insert
  with check (auth.uid() = user_id);

create policy "attachments: select own"
  on attachments for select
  using (auth.uid() = user_id);

create policy "attachments: update own"
  on attachments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "attachments: delete own"
  on attachments for delete
  using (auth.uid() = user_id);