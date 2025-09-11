-- Drop column content from public.messages (Supabase migration style)

alter table "public"."messages"
  drop column if exists "content";

