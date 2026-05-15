create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_name_not_empty check (length(trim(name)) > 0)
);

alter table public.decks
add column if not exists topic_id uuid references public.topics(id) on delete set null,
add column if not exists source_type text not null default 'text',
add column if not exists source_text text,
add column if not exists source_file_path text,
add column if not exists status text not null default 'Ready',
add column if not exists generation_error text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cards'
      and column_name = 'difficulty'
      and udt_name = 'card_difficulty'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cards'
      and column_name = 'difficulty_legacy'
  ) then
    alter table public.cards rename column difficulty to difficulty_legacy;
  end if;
end $$;

alter table public.cards
add column if not exists front text,
add column if not exists back text,
add column if not exists difficulty integer not null default 3;

update public.cards
set front = coalesce(front, term),
    back = coalesce(back, definition),
    difficulty = case
      when difficulty_legacy = 'EASY' then 1
      when difficulty_legacy = 'HARD' then 5
      else coalesce(difficulty, 3)
    end
where front is null
   or back is null
   or difficulty is null;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  type text not null default 'mcq',
  question text not null,
  correct_answer jsonb not null,
  wrong_answers text[] not null default '{}',
  difficulty integer not null default 3,
  time_limit integer not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_type_check check (type in ('mcq', 'fill_in_the_blank', 'true_false', 'short_answer')),
  constraint questions_question_not_empty check (length(trim(question)) > 0),
  constraint questions_difficulty_check check (difficulty between 1 and 5),
  constraint questions_time_limit_check check (time_limit > 0)
);

create index if not exists topics_user_id_idx
on public.topics(user_id);

create unique index if not exists topics_user_lower_name_idx
on public.topics(user_id, lower(name));

create index if not exists decks_topic_id_idx
on public.decks(topic_id);

create index if not exists decks_owner_id_status_idx
on public.decks(owner_id, status);

create index if not exists cards_deck_id_front_idx
on public.cards(deck_id, front);

create index if not exists questions_deck_id_idx
on public.questions(deck_id);

create index if not exists questions_deck_id_type_idx
on public.questions(deck_id, type);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'decks_source_type_check'
      and conrelid = 'public.decks'::regclass
  ) then
    alter table public.decks
    add constraint decks_source_type_check check (source_type in ('text', 'pdf'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'decks_status_check'
      and conrelid = 'public.decks'::regclass
  ) then
    alter table public.decks
    add constraint decks_status_check check (status in ('Preparing', 'Ready', 'Failed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cards_difficulty_check'
      and conrelid = 'public.cards'::regclass
  ) then
    alter table public.cards
    add constraint cards_difficulty_check check (difficulty between 1 and 5);
  end if;
end $$;

drop trigger if exists set_topics_updated_at on public.topics;
create trigger set_topics_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

drop trigger if exists set_questions_updated_at on public.questions;
create trigger set_questions_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

alter table public.topics enable row level security;
alter table public.questions enable row level security;

grant select, insert, update, delete on public.topics to authenticated;
grant select, insert, update, delete on public.questions to authenticated;
grant select, insert, update, delete on public.decks to authenticated;
grant select, insert, update, delete on public.cards to authenticated;

drop policy if exists "Users can manage their own topics" on public.topics;
create policy "Users can manage their own topics"
on public.topics for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read owned shared and public decks" on public.decks;
drop policy if exists "Anyone can read public and link decks" on public.decks;
drop policy if exists "Users can create their own decks" on public.decks;
drop policy if exists "Users can update their own decks" on public.decks;
drop policy if exists "Users can delete their own decks" on public.decks;
drop policy if exists "Users can read owned shared collaborative and public decks" on public.decks;
drop policy if exists "Deck owners can update decks" on public.decks;
drop policy if exists "Deck owners can delete decks" on public.decks;

create policy "Users can read their own decks"
on public.decks for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can create their own decks"
on public.decks for insert
to authenticated
with check (
  owner_id = auth.uid()
  and (
    topic_id is null
    or exists (
      select 1
      from public.topics
      where topics.id = decks.topic_id
        and topics.user_id = auth.uid()
    )
  )
);

create policy "Users can update their own decks"
on public.decks for update
to authenticated
using (owner_id = auth.uid())
with check (
  owner_id = auth.uid()
  and (
    topic_id is null
    or exists (
      select 1
      from public.topics
      where topics.id = decks.topic_id
        and topics.user_id = auth.uid()
    )
  )
);

create policy "Users can delete their own decks"
on public.decks for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can read cards in readable decks" on public.cards;
drop policy if exists "Anyone can read cards in public and link decks" on public.cards;
drop policy if exists "Deck owners can create cards" on public.cards;
drop policy if exists "Deck owners can update cards" on public.cards;
drop policy if exists "Deck owners can delete cards" on public.cards;
drop policy if exists "Deck owners and editors can create cards" on public.cards;
drop policy if exists "Deck owners and editors can update cards" on public.cards;
drop policy if exists "Deck owners and editors can delete cards" on public.cards;

create policy "Users can read cards in their own decks"
on public.cards for select
to authenticated
using (
  exists (
    select 1
    from public.decks
    where decks.id = cards.deck_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Users can create cards in their own decks"
on public.cards for insert
to authenticated
with check (
  exists (
    select 1
    from public.decks
    where decks.id = cards.deck_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Users can update cards in their own decks"
on public.cards for update
to authenticated
using (
  exists (
    select 1
    from public.decks
    where decks.id = cards.deck_id
      and decks.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.decks
    where decks.id = cards.deck_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Users can delete cards in their own decks"
on public.cards for delete
to authenticated
using (
  exists (
    select 1
    from public.decks
    where decks.id = cards.deck_id
      and decks.owner_id = auth.uid()
  )
);

drop policy if exists "Users can manage questions in their own decks" on public.questions;
create policy "Users can manage questions in their own decks"
on public.questions for all
to authenticated
using (
  exists (
    select 1
    from public.decks
    where decks.id = questions.deck_id
      and decks.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.decks
    where decks.id = questions.deck_id
      and decks.owner_id = auth.uid()
  )
);
