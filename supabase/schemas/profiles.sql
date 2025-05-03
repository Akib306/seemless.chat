create table profiles (
    id                  uuid not null primary key references auth.users(id) on delete cascade,
    username            text,
    stripe_customer_id  text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

-- 2) Enable Row-Level Security
alter table profiles enable row level security;

-- 3) RLS policies

-- Allow users to select their own profile
create policy "profiles: select own"
    on profiles
    for select
    using ( id = auth.uid() );

-- Allow users to insert only with their own Auth ID
create policy "profiles: insert own"
    on profiles
    for insert
    with check ( id = auth.uid() );

-- Allow users to update only their own profile
create policy "profiles: update own"
    on profiles
    for update
    using ( id = auth.uid() )
    with check ( id = auth.uid() );

-- 4) Trigger to auto-stamp updated_at on each UPDATE

-- Trigger function
create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Attach it to profiles
create trigger profiles_set_updated_at
    before update on profiles
    for each row
    execute procedure set_updated_at();
