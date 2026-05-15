alter table public.decks
add column if not exists cover_image_url text;

update public.decks
set cover_image_url = cover_url
where cover_image_url is null
  and cover_url is not null;

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  addressee_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self_request check (requester_id <> addressee_id),
  constraint friendships_requester_addressee_key unique (requester_id, addressee_id)
);

create table if not exists public.deck_collaborators (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'viewer'
    check (role in ('owner', 'editor', 'viewer')),
  invited_by uuid references public.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deck_collaborators_deck_user_key unique (deck_id, user_id)
);

create table if not exists public.saved_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_decks_user_deck_key unique (user_id, deck_id)
);

create index if not exists friendships_requester_id_idx
on public.friendships(requester_id);

create index if not exists friendships_addressee_id_idx
on public.friendships(addressee_id);

create index if not exists friendships_status_idx
on public.friendships(status);

create index if not exists deck_collaborators_deck_id_idx
on public.deck_collaborators(deck_id);

create index if not exists deck_collaborators_user_id_idx
on public.deck_collaborators(user_id);

create index if not exists deck_collaborators_status_idx
on public.deck_collaborators(status);

create index if not exists deck_collaborators_role_idx
on public.deck_collaborators(role);

create index if not exists saved_decks_user_id_idx
on public.saved_decks(user_id);

create index if not exists saved_decks_deck_id_idx
on public.saved_decks(deck_id);

create trigger set_friendships_updated_at
before update on public.friendships
for each row execute function public.set_updated_at();

create trigger set_deck_collaborators_updated_at
before update on public.deck_collaborators
for each row execute function public.set_updated_at();

alter table public.friendships enable row level security;
alter table public.deck_collaborators enable row level security;
alter table public.saved_decks enable row level security;

grant select, insert, update, delete on public.friendships to authenticated;
grant select, insert, update, delete on public.deck_collaborators to authenticated;
grant select, insert, delete on public.saved_decks to authenticated;

create schema if not exists private;

create or replace function private.are_friends(other_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.friendships
    where status = 'accepted'
      and (
        (requester_id = auth.uid() and addressee_id = other_user_id)
        or (requester_id = other_user_id and addressee_id = auth.uid())
      )
  );
$$;

create or replace function private.is_deck_owner(check_deck_id uuid)
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
  );
$$;

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
      and (
        owner_id = auth.uid()
        or visibility in ('PUBLIC', 'LINK')
      )
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

create or replace function private.can_edit_deck_cards(check_deck_id uuid)
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
      and role in ('owner', 'editor')
  )
  or exists (
    select 1
    from public.deck_shares
    where deck_id = check_deck_id
      and user_id = auth.uid()
      and permission = 'EDIT'
  );
$$;

create or replace function private.can_read_card(check_card_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.cards
    where id = check_card_id
      and private.can_read_deck(deck_id)
  );
$$;

create or replace function private.can_edit_card(check_card_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.cards
    where id = check_card_id
      and private.can_edit_deck_cards(deck_id)
  );
$$;

create or replace function private.add_owner_deck_collaborator()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.deck_collaborators (deck_id, user_id, role, invited_by, status)
  values (new.id, new.owner_id, 'owner', new.owner_id, 'accepted')
  on conflict (deck_id, user_id) do update
  set role = 'owner',
      status = 'accepted',
      invited_by = coalesce(public.deck_collaborators.invited_by, excluded.invited_by),
      updated_at = now();

  return new;
end;
$$;

grant usage on schema private to authenticated;
grant execute on function private.are_friends(uuid) to authenticated;
grant execute on function private.is_deck_owner(uuid) to authenticated;
grant execute on function private.can_read_deck(uuid) to authenticated;
grant execute on function private.can_edit_deck_cards(uuid) to authenticated;
grant execute on function private.can_read_card(uuid) to authenticated;
grant execute on function private.can_edit_card(uuid) to authenticated;

drop trigger if exists add_owner_deck_collaborator_on_deck_insert on public.decks;

create trigger add_owner_deck_collaborator_on_deck_insert
after insert on public.decks
for each row execute function private.add_owner_deck_collaborator();

insert into public.deck_collaborators (deck_id, user_id, role, invited_by, status)
select id, owner_id, 'owner', owner_id, 'accepted'
from public.decks
on conflict (deck_id, user_id) do update
set role = 'owner',
    status = 'accepted',
    invited_by = coalesce(public.deck_collaborators.invited_by, excluded.invited_by),
    updated_at = now();

drop policy if exists "Users can read owned shared and public decks" on public.decks;
drop policy if exists "Users can update their own decks" on public.decks;
drop policy if exists "Users can delete their own decks" on public.decks;

create policy "Users can read owned shared collaborative and public decks"
on public.decks for select
to authenticated
using (private.can_read_deck(id));

create policy "Deck owners can update decks"
on public.decks for update
to authenticated
using (private.is_deck_owner(id))
with check (private.is_deck_owner(id));

create policy "Deck owners can delete decks"
on public.decks for delete
to authenticated
using (private.is_deck_owner(id));

create policy "Users can read their friendships"
on public.friendships for select
to authenticated
using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "Users can create friend requests"
on public.friendships for insert
to authenticated
with check (requester_id = auth.uid() and addressee_id <> auth.uid());

create policy "Addressees can update friend requests"
on public.friendships for update
to authenticated
using (addressee_id = auth.uid())
with check (addressee_id = auth.uid());

create policy "Requesters can cancel friend requests"
on public.friendships for delete
to authenticated
using (requester_id = auth.uid());

create policy "Users can read visible deck collaborators"
on public.deck_collaborators for select
to authenticated
using (
  user_id = auth.uid()
  or private.is_deck_owner(deck_id)
  or private.can_read_deck(deck_id)
);

create policy "Deck owners can invite collaborators"
on public.deck_collaborators for insert
to authenticated
with check (
  private.is_deck_owner(deck_id)
  and invited_by = auth.uid()
);

create policy "Deck owners and invitees can update collaborators"
on public.deck_collaborators for update
to authenticated
using (private.is_deck_owner(deck_id) or user_id = auth.uid())
with check (private.is_deck_owner(deck_id) or user_id = auth.uid());

create policy "Deck owners and invitees can remove collaborators"
on public.deck_collaborators for delete
to authenticated
using (private.is_deck_owner(deck_id) or user_id = auth.uid());

create policy "Users can read their saved decks"
on public.saved_decks for select
to authenticated
using (user_id = auth.uid());

create policy "Users can save readable decks"
on public.saved_decks for insert
to authenticated
with check (user_id = auth.uid() and private.can_read_deck(deck_id));

create policy "Users can unsave their saved decks"
on public.saved_decks for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Deck owners can create cards" on public.cards;
drop policy if exists "Deck owners can update cards" on public.cards;
drop policy if exists "Deck owners can delete cards" on public.cards;

create policy "Deck owners and editors can create cards"
on public.cards for insert
to authenticated
with check (private.can_edit_deck_cards(deck_id));

create policy "Deck owners and editors can update cards"
on public.cards for update
to authenticated
using (private.can_edit_deck_cards(deck_id))
with check (private.can_edit_deck_cards(deck_id));

create policy "Deck owners and editors can delete cards"
on public.cards for delete
to authenticated
using (private.can_edit_deck_cards(deck_id));

drop policy if exists "Deck owners can manage card sides" on public.card_sides;
drop policy if exists "Deck owners can manage card examples" on public.card_examples;
drop policy if exists "Deck owners can manage card media" on public.card_media;

create policy "Deck owners and editors can manage card sides"
on public.card_sides for all
to authenticated
using (private.can_edit_card(card_id))
with check (private.can_edit_card(card_id));

create policy "Deck owners and editors can manage card examples"
on public.card_examples for all
to authenticated
using (private.can_edit_card(card_id))
with check (private.can_edit_card(card_id));

create policy "Deck owners and editors can manage card media"
on public.card_media for all
to authenticated
using (private.can_edit_card(card_id))
with check (private.can_edit_card(card_id));

drop policy if exists "Room hosts and participants can read rooms" on public.rooms;

create policy "Room hosts participants and friends can read rooms"
on public.rooms for select
to authenticated
using (
  host_id = auth.uid()
  or private.is_room_participant(id)
  or (
    status = 'WAITING'
    and allow_late_join
    and private.are_friends(host_id)
  )
);
