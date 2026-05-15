alter function public.set_updated_at()
set search_path = public, pg_catalog;

create index study_progress_card_id_idx on public.study_progress(card_id);
