create schema if not exists private;

create or replace function private.is_room_participant(check_room_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.room_players
    where room_players.room_id = check_room_id
      and room_players.user_id = auth.uid()
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_room_participant(uuid) to authenticated;

drop policy if exists "Room participants can read room players" on public.room_players;

create policy "Room participants can read room players"
on public.room_players for select
to authenticated
using (
  user_id = auth.uid()
  or private.is_room_participant(room_id)
  or exists (
    select 1
    from public.rooms
    where rooms.id = room_players.room_id
      and rooms.host_id = auth.uid()
  )
);
