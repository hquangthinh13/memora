-- Allow authenticated users to read any user's public profile.
-- Required for friend search and collaborator display.
create policy "Authenticated users can read any profile"
  on public.users for select
  to authenticated
  using (true);

-- Allow both parties to remove an accepted friendship (unfriend).
-- The old policy only let requesters cancel/delete.
drop policy if exists "Requesters can cancel friend requests" on public.friendships;

create policy "Users can remove their own friendships"
  on public.friendships for delete
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
