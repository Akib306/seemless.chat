create table profiles (
    id                  uuid not null primary key references auth.users(id) on delete cascade,
    username            text,
    stripe_customer_id  text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

-- Trigger to auto-stamp updated_at on each UPDATE

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
