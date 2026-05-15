create extension if not exists "pgcrypto";

create type public.deck_visibility as enum ('PRIVATE', 'LINK', 'PUBLIC');
create type public.share_permission as enum ('VIEW', 'EDIT');
create type public.room_status as enum ('WAITING', 'PLAYING', 'FINISHED', 'CANCELLED');
create type public.question_type as enum ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'TYPING', 'MATCHING', 'FILL_IN_BLANK');
create type public.card_difficulty as enum ('EASY', 'MEDIUM', 'HARD');
create type public.card_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
create type public.card_side_type as enum ('FRONT', 'BACK', 'HINT', 'EXPLANATION');
create type public.media_type as enum ('IMAGE', 'AUDIO', 'VIDEO');
create type public.auth_provider as enum ('EMAIL', 'GOOGLE', 'FACEBOOK', 'GITHUB', 'DISCORD', 'APPLE', 'OTHER');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  avatar_url text,
  username text unique,
  bio text,
  locale text,
  timezone text,
  primary_provider public.auth_provider not null default 'EMAIL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.decks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  visibility public.deck_visibility not null default 'PRIVATE',
  share_code text unique,
  language text,
  tags text[] not null default '{}',
  cover_url text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  term text,
  definition text,
  pronunciation text,
  ipa text,
  part_of_speech text,
  language text,
  translation text,
  transliteration text,
  example text,
  note text,
  hint text,
  explanation text,
  mnemonic text,
  metadata jsonb,
  tags text[] not null default '{}',
  difficulty public.card_difficulty not null default 'MEDIUM',
  status public.card_status not null default 'PUBLISHED',
  image_url text,
  audio_url text,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.card_sides (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  type public.card_side_type not null,
  content text not null,
  "order" integer not null default 0,
  language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.card_examples (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  sentence text not null,
  translation text,
  note text,
  source text,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.card_media (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  type public.media_type not null,
  url text not null,
  caption text,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.deck_shares (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  permission public.share_permission not null default 'VIEW',
  created_at timestamptz not null default now(),
  unique (deck_id, user_id)
);

create table public.study_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  ease_factor double precision not null default 2.5,
  interval_days integer not null default 0,
  repetition integer not null default 0,
  lapses integer not null default 0,
  next_review_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, card_id)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  code text not null unique,
  status public.room_status not null default 'WAITING',
  current_question_index integer not null default 0,
  max_players integer,
  question_time_limit integer not null default 15,
  allow_late_join boolean not null default true,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  nickname text,
  score integer not null default 0,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (room_id, user_id)
);

create table public.room_questions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  card_id uuid references public.cards(id) on delete set null,
  index integer not null,
  type public.question_type not null default 'MULTIPLE_CHOICE',
  prompt text not null,
  correct_answer text not null,
  options jsonb,
  accepted_answers jsonb,
  explanation text,
  time_limit_sec integer not null default 15,
  points integer not null default 100,
  created_at timestamptz not null default now(),
  unique (room_id, index)
);

create table public.room_answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  question_id uuid not null references public.room_questions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  answer text not null,
  is_correct boolean not null,
  response_ms integer not null,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  unique (question_id, user_id)
);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at before update on public.users
for each row execute function public.set_updated_at();

create trigger set_decks_updated_at before update on public.decks
for each row execute function public.set_updated_at();

create trigger set_cards_updated_at before update on public.cards
for each row execute function public.set_updated_at();

create trigger set_card_sides_updated_at before update on public.card_sides
for each row execute function public.set_updated_at();

create trigger set_card_examples_updated_at before update on public.card_examples
for each row execute function public.set_updated_at();

create trigger set_study_progress_updated_at before update on public.study_progress
for each row execute function public.set_updated_at();

create trigger set_rooms_updated_at before update on public.rooms
for each row execute function public.set_updated_at();

create index decks_owner_id_idx on public.decks(owner_id);
create index decks_visibility_idx on public.decks(visibility);
create index decks_share_code_idx on public.decks(share_code) where share_code is not null;
create index cards_deck_id_idx on public.cards(deck_id);
create index cards_deck_id_order_idx on public.cards(deck_id, "order");
create index cards_status_idx on public.cards(status);
create index card_sides_card_id_idx on public.card_sides(card_id);
create index card_sides_card_id_type_idx on public.card_sides(card_id, type);
create index card_examples_card_id_idx on public.card_examples(card_id);
create index card_media_card_id_idx on public.card_media(card_id);
create index deck_shares_user_id_idx on public.deck_shares(user_id);
create index study_progress_user_id_next_review_at_idx on public.study_progress(user_id, next_review_at);
create index rooms_host_id_idx on public.rooms(host_id);
create index rooms_deck_id_idx on public.rooms(deck_id);
create index rooms_code_idx on public.rooms(code);
create index room_players_user_id_idx on public.room_players(user_id);
create index room_players_room_id_idx on public.room_players(room_id);
create index room_questions_room_id_idx on public.room_questions(room_id);
create index room_questions_card_id_idx on public.room_questions(card_id);
create index room_answers_room_id_idx on public.room_answers(room_id);
create index room_answers_user_id_idx on public.room_answers(user_id);

alter table public.users enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.card_sides enable row level security;
alter table public.card_examples enable row level security;
alter table public.card_media enable row level security;
alter table public.deck_shares enable row level security;
alter table public.study_progress enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_questions enable row level security;
alter table public.room_answers enable row level security;

create policy "Users can read their own profile"
on public.users for select
to authenticated
using (id = auth.uid());

create policy "Users can insert their own profile"
on public.users for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can read owned shared and public decks"
on public.decks for select
to authenticated
using (
  owner_id = auth.uid()
  or visibility in ('PUBLIC', 'LINK')
  or exists (
    select 1 from public.deck_shares
    where deck_shares.deck_id = decks.id
      and deck_shares.user_id = auth.uid()
  )
);

create policy "Anyone can read public and link decks"
on public.decks for select
to anon
using (visibility in ('PUBLIC', 'LINK'));

create policy "Users can create their own decks"
on public.decks for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update their own decks"
on public.decks for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete their own decks"
on public.decks for delete
to authenticated
using (owner_id = auth.uid());

create policy "Users can read deck shares they own or receive"
on public.deck_shares for select
to authenticated
using (
  user_id = auth.uid()
);

create policy "Deck owners can create shares"
on public.deck_shares for insert
to authenticated
with check (
  exists (
    select 1 from public.decks
    where decks.id = deck_shares.deck_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Deck owners can update shares"
on public.deck_shares for update
to authenticated
using (
  exists (
    select 1 from public.decks
    where decks.id = deck_shares.deck_id
      and decks.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.decks
    where decks.id = deck_shares.deck_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Deck owners can delete shares"
on public.deck_shares for delete
to authenticated
using (
  exists (
    select 1 from public.decks
    where decks.id = deck_shares.deck_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Users can read cards in readable decks"
on public.cards for select
to authenticated
using (
  exists (
    select 1 from public.decks
    where decks.id = cards.deck_id
      and (
        decks.owner_id = auth.uid()
        or decks.visibility in ('PUBLIC', 'LINK')
        or exists (
          select 1 from public.deck_shares
          where deck_shares.deck_id = decks.id
            and deck_shares.user_id = auth.uid()
        )
      )
  )
);

create policy "Anyone can read cards in public and link decks"
on public.cards for select
to anon
using (
  exists (
    select 1 from public.decks
    where decks.id = cards.deck_id
      and decks.visibility in ('PUBLIC', 'LINK')
  )
);

create policy "Deck owners can create cards"
on public.cards for insert
to authenticated
with check (
  exists (
    select 1 from public.decks
    where decks.id = cards.deck_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Deck owners can update cards"
on public.cards for update
to authenticated
using (
  exists (
    select 1 from public.decks
    where decks.id = cards.deck_id
      and decks.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.decks
    where decks.id = cards.deck_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Deck owners can delete cards"
on public.cards for delete
to authenticated
using (
  exists (
    select 1 from public.decks
    where decks.id = cards.deck_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Users can read card sides in readable decks"
on public.card_sides for select
to authenticated
using (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_sides.card_id
      and (
        decks.owner_id = auth.uid()
        or decks.visibility in ('PUBLIC', 'LINK')
        or exists (
          select 1 from public.deck_shares
          where deck_shares.deck_id = decks.id
            and deck_shares.user_id = auth.uid()
        )
      )
  )
);

create policy "Anyone can read card sides in public and link decks"
on public.card_sides for select
to anon
using (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_sides.card_id
      and decks.visibility in ('PUBLIC', 'LINK')
  )
);

create policy "Deck owners can manage card sides"
on public.card_sides for all
to authenticated
using (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_sides.card_id
      and decks.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_sides.card_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Users can read card examples in readable decks"
on public.card_examples for select
to authenticated
using (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_examples.card_id
      and (
        decks.owner_id = auth.uid()
        or decks.visibility in ('PUBLIC', 'LINK')
        or exists (
          select 1 from public.deck_shares
          where deck_shares.deck_id = decks.id
            and deck_shares.user_id = auth.uid()
        )
      )
  )
);

create policy "Anyone can read card examples in public and link decks"
on public.card_examples for select
to anon
using (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_examples.card_id
      and decks.visibility in ('PUBLIC', 'LINK')
  )
);

create policy "Deck owners can manage card examples"
on public.card_examples for all
to authenticated
using (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_examples.card_id
      and decks.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_examples.card_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Users can read card media in readable decks"
on public.card_media for select
to authenticated
using (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_media.card_id
      and (
        decks.owner_id = auth.uid()
        or decks.visibility in ('PUBLIC', 'LINK')
        or exists (
          select 1 from public.deck_shares
          where deck_shares.deck_id = decks.id
            and deck_shares.user_id = auth.uid()
        )
      )
  )
);

create policy "Anyone can read card media in public and link decks"
on public.card_media for select
to anon
using (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_media.card_id
      and decks.visibility in ('PUBLIC', 'LINK')
  )
);

create policy "Deck owners can manage card media"
on public.card_media for all
to authenticated
using (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_media.card_id
      and decks.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = card_media.card_id
      and decks.owner_id = auth.uid()
  )
);

create policy "Users can manage their own study progress"
on public.study_progress for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Room hosts and participants can read rooms"
on public.rooms for select
to authenticated
using (
  host_id = auth.uid()
  or exists (
    select 1 from public.room_players
    where room_players.room_id = rooms.id
      and room_players.user_id = auth.uid()
  )
);

create policy "Users can create hosted rooms"
on public.rooms for insert
to authenticated
with check (host_id = auth.uid());

create policy "Room hosts can update rooms"
on public.rooms for update
to authenticated
using (host_id = auth.uid())
with check (host_id = auth.uid());

create policy "Room hosts can delete rooms"
on public.rooms for delete
to authenticated
using (host_id = auth.uid());

create policy "Room participants can read room players"
on public.room_players for select
to authenticated
using (
  user_id = auth.uid()
);

create policy "Users can join rooms as themselves"
on public.room_players for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own room player row"
on public.room_players for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can leave their own room player row"
on public.room_players for delete
to authenticated
using (user_id = auth.uid());

create policy "Room participants can read questions"
on public.room_questions for select
to authenticated
using (
  exists (
    select 1 from public.rooms
    where rooms.id = room_questions.room_id
      and rooms.host_id = auth.uid()
  )
  or exists (
    select 1 from public.room_players
    where room_players.room_id = room_questions.room_id
      and room_players.user_id = auth.uid()
  )
);

create policy "Room hosts can manage questions"
on public.room_questions for all
to authenticated
using (
  exists (
    select 1 from public.rooms
    where rooms.id = room_questions.room_id
      and rooms.host_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.rooms
    where rooms.id = room_questions.room_id
      and rooms.host_id = auth.uid()
  )
);

create policy "Room participants can read answers"
on public.room_answers for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.rooms
    where rooms.id = room_answers.room_id
      and rooms.host_id = auth.uid()
  )
  or exists (
    select 1 from public.room_players
    where room_players.room_id = room_answers.room_id
      and room_players.user_id = auth.uid()
  )
);

create policy "Room participants can create their own answers"
on public.room_answers for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.room_players
    where room_players.room_id = room_answers.room_id
      and room_players.user_id = auth.uid()
  )
);
