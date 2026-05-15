drop policy if exists "Room hosts participants and friends can read rooms" on public.rooms;

create policy "Room hosts participants friends and code joiners can read rooms"
on public.rooms for select
to authenticated
using (
  host_id = auth.uid()
  or private.is_room_participant(id)
  or (
    status = 'WAITING'
    and allow_late_join
  )
);
