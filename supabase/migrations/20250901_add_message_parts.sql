-- Create message_parts table with generic columns for UIMessage parts
create table if not exists message_parts (
  id                uuid         primary key default uuid_generate_v4(),
  message_id        uuid         not null references messages(id) on delete cascade,
  idx               integer      not null,
  type              text         not null,
  state             text,

  -- text / reasoning
  text              text,

  -- file
  url               text,
  media_type        text,
  filename          text,

  -- sources
  title             text,

  -- tool (generic across tools)
  tool_name         text,
  tool_call_id      text,
  tool_input        jsonb,
  tool_output       jsonb,
  error_text        text,

  -- generic data part
  data_name         text,
  data              jsonb,

  provider_metadata jsonb,
  created_at        timestamptz not null default now(),

  unique(message_id, idx)
);

create index if not exists message_parts_message_idx on message_parts(message_id);
create index if not exists message_parts_message_idx_order on message_parts(message_id, idx);

alter table message_parts enable row level security;

create policy "parts: select own" on message_parts
  for select using (
    exists (
      select 1 from messages m
      where m.id = message_id and m.user_id = auth.uid()
    )
  );

create policy "parts: insert own" on message_parts
  for insert with check (
    exists (
      select 1 from messages m
      where m.id = message_id and m.user_id = auth.uid()
    )
  );


