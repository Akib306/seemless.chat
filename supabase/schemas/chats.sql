create table if not exists chats (
  id         uuid         not null primary key default uuid_generate_v4(),
  user_id    uuid         not null references profiles(id) on delete cascade,
  title      text,
  created_at timestamptz  not null default now(),
  updated_at timestamptz  not null default now()
);

alter table chats enable row level security;

-- only user can see their own chats
create policy "chats: select own"
  on chats for select using (user_id = auth.uid());
 -- only user can insert/update their own chats
create policy "chats: insert own"
  on chats for insert with check (user_id = auth.uid());
create policy "chats: update own"
  on chats for update using (user_id = auth.uid());

create trigger chats_set_updated_at
  before update on chats
  for each row execute procedure set_updated_at();
