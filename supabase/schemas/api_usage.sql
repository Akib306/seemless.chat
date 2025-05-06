create table if not exists api_usage (
  id                uuid         not null primary key default uuid_generate_v4(),
  user_id           uuid         not null references profiles(id) on delete cascade,
  chat_id           uuid         references chats(id) on delete cascade,
  endpoint          text         not null,
  model             text         not null,
  prompt_tokens     integer      not null default 0,
  completion_tokens integer      not null default 0,
  total_tokens      integer      not null default 0,
  created_at        timestamptz  not null default now()
);

alter table api_usage enable row level security;
create policy "api_usage: select own"
  on api_usage for select using (user_id = auth.uid());
create policy "api_usage: insert own"
  on api_usage for insert with check (user_id = auth.uid());
