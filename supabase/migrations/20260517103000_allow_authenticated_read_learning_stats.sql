create policy "Authenticated users can read all learning stats"
  on public.user_learning_stats
  for select
  to authenticated
  using (true);

