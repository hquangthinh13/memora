alter table public.decks
add column if not exists generation_question_types text[] not null default array['mcq', 'true_false']::text[];

alter table public.decks
drop constraint if exists decks_generation_question_types_check;

alter table public.decks
add constraint decks_generation_question_types_check
check (
  coalesce(array_length(generation_question_types, 1), 0) >= 1
  and generation_question_types <@ array['mcq', 'true_false']::text[]
);
