create table "public"."api_usage" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "chat_id" uuid,
    "endpoint" text not null,
    "model" text not null,
    "prompt_tokens" integer not null default 0,
    "completion_tokens" integer not null default 0,
    "total_tokens" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."api_usage" enable row level security;

CREATE UNIQUE INDEX api_usage_pkey ON public.api_usage USING btree (id);

alter table "public"."api_usage" add constraint "api_usage_pkey" PRIMARY KEY using index "api_usage_pkey";

alter table "public"."api_usage" add constraint "api_usage_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE not valid;

alter table "public"."api_usage" validate constraint "api_usage_chat_id_fkey";

alter table "public"."api_usage" add constraint "api_usage_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."api_usage" validate constraint "api_usage_user_id_fkey";

grant delete on table "public"."api_usage" to "anon";

grant insert on table "public"."api_usage" to "anon";

grant references on table "public"."api_usage" to "anon";

grant select on table "public"."api_usage" to "anon";

grant trigger on table "public"."api_usage" to "anon";

grant truncate on table "public"."api_usage" to "anon";

grant update on table "public"."api_usage" to "anon";

grant delete on table "public"."api_usage" to "authenticated";

grant insert on table "public"."api_usage" to "authenticated";

grant references on table "public"."api_usage" to "authenticated";

grant select on table "public"."api_usage" to "authenticated";

grant trigger on table "public"."api_usage" to "authenticated";

grant truncate on table "public"."api_usage" to "authenticated";

grant update on table "public"."api_usage" to "authenticated";

grant delete on table "public"."api_usage" to "service_role";

grant insert on table "public"."api_usage" to "service_role";

grant references on table "public"."api_usage" to "service_role";

grant select on table "public"."api_usage" to "service_role";

grant trigger on table "public"."api_usage" to "service_role";

grant truncate on table "public"."api_usage" to "service_role";

grant update on table "public"."api_usage" to "service_role";

create policy "api_usage: insert own"
on "public"."api_usage"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "api_usage: select own"
on "public"."api_usage"
as permissive
for select
to public
using ((user_id = auth.uid()));



