-- enable RLS
alter table public.profiles enable row level security;

-- only let users see/insert/update their own row
create policy "profiles: select own"
    on public.profiles for select
    using ( id = auth.uid() );

create policy "profiles: insert own"
    on public.profiles for insert
    with check ( id = auth.uid() );

create policy "profiles: update own"
    on public.profiles for update
    using ( id = auth.uid() )
    with check ( id = auth.uid() );