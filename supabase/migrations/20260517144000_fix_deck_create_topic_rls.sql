create or replace function private.can_write_deck_metadata(
  check_owner_id uuid,
  check_topic_id uuid
)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select
    check_owner_id = auth.uid()
    and (
      check_topic_id is null
      or exists (
        select 1
        from public.topics
        where topics.id = check_topic_id
          and topics.user_id = check_owner_id
      )
    );
$$;

grant execute on function private.can_write_deck_metadata(uuid, uuid) to authenticated;

drop policy if exists "Users can create their own decks" on public.decks;
drop policy if exists "Users can update their own decks" on public.decks;
drop policy if exists "Deck owners can update decks" on public.decks;

create policy "Users can create their own decks"
on public.decks for insert
to authenticated
with check (private.can_write_deck_metadata(owner_id, topic_id));

create policy "Deck owners can update decks"
on public.decks for update
to authenticated
using (private.is_deck_owner(id))
with check (private.can_write_deck_metadata(owner_id, topic_id));
