create table if not exists usage_summaries (
  user_id uuid        not null references profiles(id),
  year    integer     not null,
  month   integer     not null,
  prompts integer     not null default 0,
  tokens  integer     not null default 0,
  primary key (user_id, year, month)
);
