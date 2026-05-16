-- Learning analytics tables: aggregate per-user stats and per-day activity
-- set_updated_at() trigger function is already defined in the initial schema migration.

create table public.user_learning_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_cards_studied integer not null default 0,
  total_quizzes_completed integer not null default 0,
  total_questions_answered integer not null default 0,
  total_correct_answers integer not null default 0,
  total_incorrect_answers integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_studied_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_learning_stats enable row level security;

create policy "Users can manage their own learning stats"
  on public.user_learning_stats
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger set_user_learning_stats_updated_at
  before update on public.user_learning_stats
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------

create table public.learning_activity_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  cards_studied integer not null default 0,
  quizzes_completed integer not null default 0,
  questions_answered integer not null default 0,
  correct_answers integer not null default 0,
  incorrect_answers integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, activity_date)
);

alter table public.learning_activity_days enable row level security;

create policy "Users can manage their own activity days"
  on public.learning_activity_days
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index idx_learning_activity_days_user_date
  on public.learning_activity_days(user_id, activity_date desc);

create trigger set_learning_activity_days_updated_at
  before update on public.learning_activity_days
  for each row execute function public.set_updated_at();
