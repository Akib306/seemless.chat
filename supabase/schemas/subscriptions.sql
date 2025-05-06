create table if not exists subscriptions (
  id                     uuid         not null primary key default uuid_generate_v4(),
  user_id                uuid         not null references profiles(id) on delete cascade,
  stripe_subscription_id text         not null unique,
  status                 text         not null,
  current_period_start   timestamptz  not null,
  current_period_end     timestamptz  not null,
  created_at             timestamptz  not null default now(),
  updated_at             timestamptz  not null default now()
);

alter table subscriptions enable row level security;
create policy "subscriptions: select own"
  on subscriptions for select using (user_id = auth.uid());
create policy "subscriptions: insert own"
  on subscriptions for insert with check (user_id = auth.uid());
create policy "subscriptions: update own"
  on subscriptions for update using (user_id = auth.uid());

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute procedure set_updated_at();
