drop policy if exists "Users can read their own decks" on public.decks;
drop policy if exists "Users can read owned shared collaborative and public decks" on public.decks;

create policy "Users can read owned shared collaborative and public decks"
on public.decks for select
to authenticated
using (private.can_read_deck(id));

drop policy if exists "Users can read cards in their own decks" on public.cards;
drop policy if exists "Users can read cards in readable decks" on public.cards;

create policy "Users can read cards in readable decks"
on public.cards for select
to authenticated
using (private.can_read_deck(deck_id));

drop policy if exists "Users can read questions in readable decks" on public.questions;

create policy "Users can read questions in readable decks"
on public.questions for select
to authenticated
using (private.can_read_deck(deck_id));
