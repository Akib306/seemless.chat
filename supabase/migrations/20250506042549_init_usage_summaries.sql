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


