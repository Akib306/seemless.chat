create table "public"."chats" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "title" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."chats" enable row level security;

CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (id);

alter table "public"."chats" add constraint "chats_pkey" PRIMARY KEY using index "chats_pkey";

alter table "public"."chats" add constraint "chats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_user_id_fkey";

grant delete on table "public"."chats" to "anon";

grant insert on table "public"."chats" to "anon";

grant references on table "public"."chats" to "anon";

grant select on table "public"."chats" to "anon";

grant trigger on table "public"."chats" to "anon";

grant truncate on table "public"."chats" to "anon";

grant update on table "public"."chats" to "anon";

grant delete on table "public"."chats" to "authenticated";

grant insert on table "public"."chats" to "authenticated";

grant references on table "public"."chats" to "authenticated";

grant select on table "public"."chats" to "authenticated";

grant trigger on table "public"."chats" to "authenticated";

grant truncate on table "public"."chats" to "authenticated";

grant update on table "public"."chats" to "authenticated";

grant delete on table "public"."chats" to "service_role";

grant insert on table "public"."chats" to "service_role";

grant references on table "public"."chats" to "service_role";

grant select on table "public"."chats" to "service_role";

grant trigger on table "public"."chats" to "service_role";

grant truncate on table "public"."chats" to "service_role";

grant update on table "public"."chats" to "service_role";

create policy "chats: insert own"
on "public"."chats"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "chats: select own"
on "public"."chats"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "chats: update own"
on "public"."chats"
as permissive
for update
to public
using ((user_id = auth.uid()));


CREATE TRIGGER chats_set_updated_at BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION set_updated_at();


