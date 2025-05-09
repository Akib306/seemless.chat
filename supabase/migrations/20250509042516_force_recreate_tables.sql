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


create table "public"."messages" (
    "id" uuid not null default uuid_generate_v4(),
    "chat_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null,
    "content" text not null,
    "model_used" text,
    "tokens_used" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."messages" enable row level security;

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."messages" add constraint "messages_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_chat_id_fkey";

alter table "public"."messages" add constraint "messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'ai'::text]))) not valid;

alter table "public"."messages" validate constraint "messages_role_check";

alter table "public"."messages" add constraint "messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_user_id_fkey";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

create policy "messages: insert own"
on "public"."messages"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "messages: select own"
on "public"."messages"
as permissive
for select
to public
using ((user_id = auth.uid()));



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



create table "public"."subscriptions" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "stripe_subscription_id" text not null,
    "status" text not null,
    "current_period_start" timestamp with time zone not null,
    "current_period_end" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."subscriptions" enable row level security;

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX subscriptions_stripe_subscription_id_key ON public.subscriptions USING btree (stripe_subscription_id);

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_stripe_subscription_id_key" UNIQUE using index "subscriptions_stripe_subscription_id_key";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_user_id_fkey";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

create policy "subscriptions: insert own"
on "public"."subscriptions"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "subscriptions: select own"
on "public"."subscriptions"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "subscriptions: update own"
on "public"."subscriptions"
as permissive
for update
to public
using ((user_id = auth.uid()));


CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();


create table "public"."usage_summaries" (
    "user_id" uuid not null,
    "year" integer not null,
    "month" integer not null,
    "prompts" integer not null default 0,
    "tokens" integer not null default 0
);


CREATE UNIQUE INDEX usage_summaries_pkey ON public.usage_summaries USING btree (user_id, year, month);

alter table "public"."usage_summaries" add constraint "usage_summaries_pkey" PRIMARY KEY using index "usage_summaries_pkey";

alter table "public"."usage_summaries" add constraint "usage_summaries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."usage_summaries" validate constraint "usage_summaries_user_id_fkey";

grant delete on table "public"."usage_summaries" to "anon";

grant insert on table "public"."usage_summaries" to "anon";

grant references on table "public"."usage_summaries" to "anon";

grant select on table "public"."usage_summaries" to "anon";

grant trigger on table "public"."usage_summaries" to "anon";

grant truncate on table "public"."usage_summaries" to "anon";

grant update on table "public"."usage_summaries" to "anon";

grant delete on table "public"."usage_summaries" to "authenticated";

grant insert on table "public"."usage_summaries" to "authenticated";

grant references on table "public"."usage_summaries" to "authenticated";

grant select on table "public"."usage_summaries" to "authenticated";

grant trigger on table "public"."usage_summaries" to "authenticated";

grant truncate on table "public"."usage_summaries" to "authenticated";

grant update on table "public"."usage_summaries" to "authenticated";

grant delete on table "public"."usage_summaries" to "service_role";

grant insert on table "public"."usage_summaries" to "service_role";

grant references on table "public"."usage_summaries" to "service_role";

grant select on table "public"."usage_summaries" to "service_role";

grant trigger on table "public"."usage_summaries" to "service_role";

grant truncate on table "public"."usage_summaries" to "service_role";

grant update on table "public"."usage_summaries" to "service_role";


