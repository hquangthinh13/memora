create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (
    type in (
      'friend_request',
      'friend_request_accepted',
      'deck_processing_completed',
      'deck_invitation',
      'deck_invitation_accepted'
    )
  ),
  title text not null,
  message text,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_read_created_idx
  on public.notifications (user_id, read_at, created_at desc);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_created_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

grant select, update on public.notifications to authenticated;
grant insert on public.notifications to service_role;

create policy "Users can read their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can mark their own notifications as read"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter publication supabase_realtime add table public.notifications;

create or replace function private.notify_friend_request_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.status = 'pending' then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      new.addressee_id,
      'friend_request',
      'New friend request',
      'You have received a new friend request.',
      jsonb_build_object(
        'friendship_id', new.id,
        'requester_id', new.requester_id,
        'addressee_id', new.addressee_id
      )
    );
  end if;

  return new;
end;
$$;

create or replace function private.notify_friend_request_accepted()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if old.status is distinct from new.status and new.status = 'accepted' then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      new.requester_id,
      'friend_request_accepted',
      'Friend request accepted',
      'Your friend request has been accepted.',
      jsonb_build_object(
        'friendship_id', new.id,
        'requester_id', new.requester_id,
        'addressee_id', new.addressee_id
      )
    );
  end if;

  return new;
end;
$$;

create or replace function private.notify_deck_invitation_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  deck_title text;
begin
  if new.status = 'pending' and new.role <> 'owner' then
    select title into deck_title
    from public.decks
    where id = new.deck_id;

    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      new.user_id,
      'deck_invitation',
      'Deck collaboration invite',
      coalesce(deck_title, 'A deck') || ' invited you to collaborate.',
      jsonb_build_object(
        'deck_id', new.deck_id,
        'collaborator_id', new.id,
        'invited_by', new.invited_by,
        'role', new.role
      )
    );
  end if;

  return new;
end;
$$;

create or replace function private.notify_deck_invitation_accepted()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  deck_title text;
begin
  if old.status is distinct from new.status
     and new.status = 'accepted'
     and coalesce(new.invited_by, new.user_id) <> new.user_id then
    select title into deck_title
    from public.decks
    where id = new.deck_id;

    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      new.invited_by,
      'deck_invitation_accepted',
      'Deck invitation accepted',
      'Your invite to collaborate on ' || coalesce(deck_title, 'a deck') || ' was accepted.',
      jsonb_build_object(
        'deck_id', new.deck_id,
        'collaborator_id', new.id,
        'user_id', new.user_id,
        'invited_by', new.invited_by,
        'role', new.role
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_friend_request_created on public.friendships;
create trigger notify_friend_request_created
after insert on public.friendships
for each row execute function private.notify_friend_request_created();

drop trigger if exists notify_friend_request_accepted on public.friendships;
create trigger notify_friend_request_accepted
after update on public.friendships
for each row execute function private.notify_friend_request_accepted();

drop trigger if exists notify_deck_invitation_created on public.deck_collaborators;
create trigger notify_deck_invitation_created
after insert on public.deck_collaborators
for each row execute function private.notify_deck_invitation_created();

drop trigger if exists notify_deck_invitation_accepted on public.deck_collaborators;
create trigger notify_deck_invitation_accepted
after update on public.deck_collaborators
for each row execute function private.notify_deck_invitation_accepted();
