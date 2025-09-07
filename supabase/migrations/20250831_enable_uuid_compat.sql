-- Ensure UUID generation is available for migrations using uuid_generate_v4()
-- without modifying existing migration files.

create extension if not exists "pgcrypto";

do $$
begin
  -- Create a compatibility wrapper only if uuid_generate_v4() doesn't exist.
  if not exists (
    select 1
    from pg_proc p
    where p.proname = 'uuid_generate_v4'
  ) then
    create function uuid_generate_v4() returns uuid
    language sql immutable as $$ select gen_random_uuid() $$;
  end if;
end $$;


