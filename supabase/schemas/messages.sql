create table if not exists messages (
  id                uuid         not null primary key default uuid_generate_v4(),
  chat_id           uuid         not null references chats(id) on delete cascade,
  user_id           uuid         not null references profiles(id) on delete cascade,
  role              text         not null check (role in ('user','ai')),
  content           text         not null,
  model_used        text,
  tokens_used       integer      not null default 0,
  created_at        timestamptz  not null default now()

);

alter table messages enable row level security;
create policy "messages: select own"
  on messages for select using (user_id = auth.uid());
create policy "messages: insert own"
  on messages for insert with check (user_id = auth.uid());

-- Allow users to update *only* their own messages that they sent (role = 'user')
create policy "messages: update own user messages"
  on messages
  for update
  using (
    user_id = auth.uid()
    and role = 'user'
  )
  with check (
    user_id = auth.uid()
    and role = 'user'
  );
