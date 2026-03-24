create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  media_type public.media_type not null,
  title text not null,
  poster_path text,
  backdrop_path text,
  overview text not null,
  release_date_or_first_air_date text,
  added_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

create index if not exists watchlist_items_user_id_idx on public.watchlist_items(user_id);
create index if not exists watchlist_items_added_at_idx on public.watchlist_items(user_id, added_at desc);

alter table public.watchlist_items enable row level security;

create policy "watchlist items select own"
on public.watchlist_items for select
using (auth.uid() = user_id);

create policy "watchlist items insert own"
on public.watchlist_items for insert
with check (auth.uid() = user_id);

create policy "watchlist items update own"
on public.watchlist_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "watchlist items delete own"
on public.watchlist_items for delete
using (auth.uid() = user_id);
