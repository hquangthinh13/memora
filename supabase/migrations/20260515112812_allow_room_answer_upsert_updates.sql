drop policy if exists "Room participants can update their own answers" on public.room_answers;

create policy "Room participants can update their own answers"
on public.room_answers for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.room_players
    where room_players.room_id = room_answers.room_id
      and room_players.user_id = auth.uid()
      and room_players.left_at is null
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.room_players
    where room_players.room_id = room_answers.room_id
      and room_players.user_id = auth.uid()
      and room_players.left_at is null
  )
);
