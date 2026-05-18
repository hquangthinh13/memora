-- Remove visibility-based access from can_read_deck().
-- Access is now: owner only, OR accepted collaborator, OR legacy deck_shares entry.
create or replace function private.can_read_deck(check_deck_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.decks
    where id = check_deck_id
      and owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.deck_collaborators
    where deck_id = check_deck_id
      and user_id = auth.uid()
      and status = 'accepted'
      and role in ('owner', 'editor', 'viewer')
  )
  or exists (
    select 1
    from public.deck_shares
    where deck_id = check_deck_id
      and user_id = auth.uid()
  );
$$;

-- Drop anonymous read policies (public/link access for unauthenticated users)
drop policy if exists "Anyone can read public and link decks" on public.decks;
drop policy if exists "Anyone can read cards in public and link decks" on public.cards;
drop policy if exists "Anyone can read card sides in public and link decks" on public.card_sides;
drop policy if exists "Anyone can read card examples in public and link decks" on public.card_examples;
drop policy if exists "Anyone can read card media in public and link decks" on public.card_media;
