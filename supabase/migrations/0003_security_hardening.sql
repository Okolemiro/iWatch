drop policy if exists "movie details owner access" on public.movie_details;
drop policy if exists "tv show details owner access" on public.tv_show_details;
drop policy if exists "seasons owner access" on public.seasons;
drop policy if exists "episodes owner access" on public.episodes;

create policy "movie details select own"
on public.movie_details for select
using (public.is_library_item_owner(library_item_id));

create policy "movie details insert own"
on public.movie_details for insert
with check (public.is_library_item_owner(library_item_id));

create policy "tv show details select own"
on public.tv_show_details for select
using (public.is_library_item_owner(library_item_id));

create policy "tv show details insert own"
on public.tv_show_details for insert
with check (public.is_library_item_owner(library_item_id));

create policy "seasons select own"
on public.seasons for select
using (public.is_tv_show_details_owner(tv_show_details_id));

create policy "seasons insert own"
on public.seasons for insert
with check (public.is_tv_show_details_owner(tv_show_details_id));

create policy "episodes select own"
on public.episodes for select
using (public.is_season_owner(season_id));

create policy "episodes insert own"
on public.episodes for insert
with check (public.is_season_owner(season_id));
