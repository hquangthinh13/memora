drop policy if exists "Users can read owned shared collaborative and public decks" on public.decks;

create policy "Users can read owned shared collaborative and public decks"
on public.decks for select
to authenticated
using (
  owner_id = auth.uid()
  or visibility in ('PUBLIC', 'LINK')
  or exists (
    select 1
    from public.deck_collaborators
    where deck_collaborators.deck_id = decks.id
      and deck_collaborators.user_id = auth.uid()
      and deck_collaborators.status = 'accepted'
      and deck_collaborators.role in ('owner', 'editor', 'viewer')
  )
  or exists (
    select 1
    from public.deck_shares
    where deck_shares.deck_id = decks.id
      and deck_shares.user_id = auth.uid()
  )
);
