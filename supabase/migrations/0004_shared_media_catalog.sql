create table public.media_titles (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer not null,
  media_type public.media_type not null,
  title text not null,
  poster_path text,
  backdrop_path text,
  overview text not null,
  release_date_or_first_air_date text,
  genres_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tmdb_id, media_type)
);

create table public.media_movie_details (
  id uuid primary key default gen_random_uuid(),
  media_title_id uuid not null unique references public.media_titles(id) on delete cascade,
  runtime integer
);

create table public.media_tv_show_details (
  id uuid primary key default gen_random_uuid(),
  media_title_id uuid not null unique references public.media_titles(id) on delete cascade,
  total_seasons integer not null
);

create table public.media_seasons (
  id uuid primary key default gen_random_uuid(),
  tv_show_details_id uuid not null references public.media_tv_show_details(id) on delete cascade,
  season_number integer not null,
  name text not null,
  poster_path text,
  episode_count integer not null,
  unique (tv_show_details_id, season_number)
);

create table public.media_episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.media_seasons(id) on delete cascade,
  episode_number integer not null,
  name text not null,
  air_date text,
  runtime integer,
  unique (season_id, episode_number)
);

create table public.user_library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_title_id uuid not null references public.media_titles(id) on delete cascade,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, media_title_id)
);

create table public.user_watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_title_id uuid not null references public.media_titles(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (user_id, media_title_id)
);

create table public.user_movie_trackings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  library_item_id uuid not null unique references public.user_library_items(id) on delete cascade,
  watched boolean not null default false,
  user_rating double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, library_item_id)
);

create table public.user_show_trackings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  library_item_id uuid not null unique references public.user_library_items(id) on delete cascade,
  user_rating double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, library_item_id)
);

create table public.user_season_trackings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id uuid not null references public.media_seasons(id) on delete cascade,
  user_rating double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, season_id)
);

create table public.user_episode_trackings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.media_episodes(id) on delete cascade,
  watched boolean not null default false,
  user_rating double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, episode_id)
);

create index media_titles_media_type_idx on public.media_titles(media_type);
create index media_movie_details_media_title_id_idx on public.media_movie_details(media_title_id);
create index media_tv_show_details_media_title_id_idx on public.media_tv_show_details(media_title_id);
create index media_seasons_tv_show_details_id_idx on public.media_seasons(tv_show_details_id);
create index media_episodes_season_id_idx on public.media_episodes(season_id);
create index user_library_items_user_id_idx on public.user_library_items(user_id);
create index user_library_items_updated_at_idx on public.user_library_items(user_id, updated_at desc);
create index user_library_items_media_title_id_idx on public.user_library_items(media_title_id);
create index user_watchlist_items_user_id_idx on public.user_watchlist_items(user_id);
create index user_watchlist_items_added_at_idx on public.user_watchlist_items(user_id, added_at desc);
create index user_watchlist_items_media_title_id_idx on public.user_watchlist_items(media_title_id);
create index user_movie_trackings_user_id_idx on public.user_movie_trackings(user_id);
create index user_show_trackings_user_id_idx on public.user_show_trackings(user_id);
create index user_season_trackings_user_id_idx on public.user_season_trackings(user_id);
create index user_episode_trackings_user_id_idx on public.user_episode_trackings(user_id);

create trigger set_media_titles_updated_at
before update on public.media_titles
for each row execute function public.set_updated_at();

create trigger set_user_library_items_updated_at
before update on public.user_library_items
for each row execute function public.set_updated_at();

create trigger set_user_movie_trackings_updated_at
before update on public.user_movie_trackings
for each row execute function public.set_updated_at();

create trigger set_user_show_trackings_updated_at
before update on public.user_show_trackings
for each row execute function public.set_updated_at();

create trigger set_user_season_trackings_updated_at
before update on public.user_season_trackings
for each row execute function public.set_updated_at();

create trigger set_user_episode_trackings_updated_at
before update on public.user_episode_trackings
for each row execute function public.set_updated_at();

create or replace function public.is_user_library_item_owner(target_user_library_item_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_library_items user_library_item
    where user_library_item.id = target_user_library_item_id
      and user_library_item.user_id = auth.uid()
  );
$$;

create or replace function public.is_media_title_in_user_library(target_media_title_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_library_items user_library_item
    where user_library_item.media_title_id = target_media_title_id
      and user_library_item.user_id = auth.uid()
  );
$$;

create or replace function public.is_media_season_in_user_library(target_season_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.media_seasons season
    join public.media_tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
    join public.user_library_items user_library_item on user_library_item.media_title_id = tv_show_detail.media_title_id
    where season.id = target_season_id
      and user_library_item.user_id = auth.uid()
  );
$$;

create or replace function public.is_media_episode_in_user_library(target_episode_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.media_episodes episode
    join public.media_seasons season on season.id = episode.season_id
    join public.media_tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
    join public.user_library_items user_library_item on user_library_item.media_title_id = tv_show_detail.media_title_id
    where episode.id = target_episode_id
      and user_library_item.user_id = auth.uid()
  );
$$;

create or replace function public.touch_user_library_item(target_user_library_item_id uuid)
returns void
language sql
as $$
  update public.user_library_items
  set updated_at = now()
  where id = target_user_library_item_id;
$$;

create or replace function public.touch_user_library_item_from_season_tracking()
returns trigger
language plpgsql
as $$
declare
  target_user_id uuid;
  target_library_item_id uuid;
begin
  target_user_id := coalesce(new.user_id, old.user_id);

  select user_library_item.id
  into target_library_item_id
  from public.media_seasons season
  join public.media_tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
  join public.user_library_items user_library_item on user_library_item.media_title_id = tv_show_detail.media_title_id
  where season.id = coalesce(new.season_id, old.season_id)
    and user_library_item.user_id = target_user_id
  limit 1;

  if target_library_item_id is not null then
    perform public.touch_user_library_item(target_library_item_id);
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.touch_user_library_item_from_episode_tracking()
returns trigger
language plpgsql
as $$
declare
  target_user_id uuid;
  target_library_item_id uuid;
begin
  target_user_id := coalesce(new.user_id, old.user_id);

  select user_library_item.id
  into target_library_item_id
  from public.media_episodes episode
  join public.media_seasons season on season.id = episode.season_id
  join public.media_tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
  join public.user_library_items user_library_item on user_library_item.media_title_id = tv_show_detail.media_title_id
  where episode.id = coalesce(new.episode_id, old.episode_id)
    and user_library_item.user_id = target_user_id
  limit 1;

  if target_library_item_id is not null then
    perform public.touch_user_library_item(target_library_item_id);
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.touch_user_library_item_from_movie_tracking()
returns trigger
language plpgsql
as $$
begin
  perform public.touch_user_library_item(coalesce(new.library_item_id, old.library_item_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.touch_user_library_item_from_show_tracking()
returns trigger
language plpgsql
as $$
begin
  perform public.touch_user_library_item(coalesce(new.library_item_id, old.library_item_id));
  return coalesce(new, old);
end;
$$;

alter table public.media_titles enable row level security;
alter table public.media_movie_details enable row level security;
alter table public.media_tv_show_details enable row level security;
alter table public.media_seasons enable row level security;
alter table public.media_episodes enable row level security;
alter table public.user_library_items enable row level security;
alter table public.user_watchlist_items enable row level security;
alter table public.user_movie_trackings enable row level security;
alter table public.user_show_trackings enable row level security;
alter table public.user_season_trackings enable row level security;
alter table public.user_episode_trackings enable row level security;

create policy "media titles select authenticated"
on public.media_titles for select
using (auth.uid() is not null);

create policy "media titles insert authenticated"
on public.media_titles for insert
with check (auth.uid() is not null);

create policy "media movie details select authenticated"
on public.media_movie_details for select
using (auth.uid() is not null);

create policy "media movie details insert authenticated"
on public.media_movie_details for insert
with check (auth.uid() is not null and exists (
  select 1 from public.media_titles media_title where media_title.id = media_title_id
));

create policy "media tv show details select authenticated"
on public.media_tv_show_details for select
using (auth.uid() is not null);

create policy "media tv show details insert authenticated"
on public.media_tv_show_details for insert
with check (auth.uid() is not null and exists (
  select 1 from public.media_titles media_title where media_title.id = media_title_id
));

create policy "media seasons select authenticated"
on public.media_seasons for select
using (auth.uid() is not null);

create policy "media seasons insert authenticated"
on public.media_seasons for insert
with check (auth.uid() is not null and exists (
  select 1 from public.media_tv_show_details tv_show_detail where tv_show_detail.id = tv_show_details_id
));

create policy "media episodes select authenticated"
on public.media_episodes for select
using (auth.uid() is not null);

create policy "media episodes insert authenticated"
on public.media_episodes for insert
with check (auth.uid() is not null and exists (
  select 1 from public.media_seasons season where season.id = season_id
));

create policy "user library items select own"
on public.user_library_items for select
using (auth.uid() = user_id);

create policy "user library items insert own"
on public.user_library_items for insert
with check (auth.uid() = user_id);

create policy "user library items update own"
on public.user_library_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user library items delete own"
on public.user_library_items for delete
using (auth.uid() = user_id);

create policy "user watchlist items select own"
on public.user_watchlist_items for select
using (auth.uid() = user_id);

create policy "user watchlist items insert own"
on public.user_watchlist_items for insert
with check (auth.uid() = user_id);

create policy "user watchlist items update own"
on public.user_watchlist_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user watchlist items delete own"
on public.user_watchlist_items for delete
using (auth.uid() = user_id);

create policy "user movie trackings own"
on public.user_movie_trackings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id and public.is_user_library_item_owner(library_item_id));

create policy "user show trackings own"
on public.user_show_trackings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id and public.is_user_library_item_owner(library_item_id));

create policy "user season trackings own"
on public.user_season_trackings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id and public.is_media_season_in_user_library(season_id));

create policy "user episode trackings own"
on public.user_episode_trackings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id and public.is_media_episode_in_user_library(episode_id));

create trigger touch_user_library_item_from_movie_trackings
after insert or update or delete on public.user_movie_trackings
for each row execute function public.touch_user_library_item_from_movie_tracking();

create trigger touch_user_library_item_from_show_trackings
after insert or update or delete on public.user_show_trackings
for each row execute function public.touch_user_library_item_from_show_tracking();

create trigger touch_user_library_item_from_season_trackings
after insert or update or delete on public.user_season_trackings
for each row execute function public.touch_user_library_item_from_season_tracking();

create trigger touch_user_library_item_from_episode_trackings
after insert or update or delete on public.user_episode_trackings
for each row execute function public.touch_user_library_item_from_episode_tracking();

insert into public.media_titles (
  tmdb_id,
  media_type,
  title,
  poster_path,
  backdrop_path,
  overview,
  release_date_or_first_air_date,
  genres_json,
  created_at,
  updated_at
)
select distinct on (source.tmdb_id, source.media_type)
  source.tmdb_id,
  source.media_type,
  source.title,
  source.poster_path,
  source.backdrop_path,
  source.overview,
  source.release_date_or_first_air_date,
  source.genres_json,
  source.created_at,
  source.updated_at
from (
  select
    library_item.tmdb_id,
    library_item.media_type,
    library_item.title,
    library_item.poster_path,
    library_item.backdrop_path,
    library_item.overview,
    library_item.release_date_or_first_air_date,
    library_item.genres_json,
    library_item.added_at as created_at,
    library_item.updated_at,
    1 as source_priority
  from public.library_items library_item
  union all
  select
    watchlist_item.tmdb_id,
    watchlist_item.media_type,
    watchlist_item.title,
    watchlist_item.poster_path,
    watchlist_item.backdrop_path,
    watchlist_item.overview,
    watchlist_item.release_date_or_first_air_date,
    '[]'::jsonb as genres_json,
    watchlist_item.added_at as created_at,
    watchlist_item.added_at as updated_at,
    2 as source_priority
  from public.watchlist_items watchlist_item
) as source
order by source.tmdb_id, source.media_type, source.source_priority, source.updated_at desc;

insert into public.media_movie_details (media_title_id, runtime)
select distinct on (media_title.id)
  media_title.id,
  movie_detail.runtime
from public.movie_details movie_detail
join public.library_items library_item on library_item.id = movie_detail.library_item_id
join public.media_titles media_title
  on media_title.tmdb_id = library_item.tmdb_id
 and media_title.media_type = library_item.media_type
order by media_title.id, library_item.updated_at desc, movie_detail.id;

insert into public.media_tv_show_details (media_title_id, total_seasons)
select distinct on (media_title.id)
  media_title.id,
  tv_show_detail.total_seasons
from public.tv_show_details tv_show_detail
join public.library_items library_item on library_item.id = tv_show_detail.library_item_id
join public.media_titles media_title
  on media_title.tmdb_id = library_item.tmdb_id
 and media_title.media_type = library_item.media_type
order by media_title.id, library_item.updated_at desc, tv_show_detail.id;

insert into public.media_seasons (
  tv_show_details_id,
  season_number,
  name,
  poster_path,
  episode_count
)
select distinct on (new_tv_show_detail.id, season.season_number)
  new_tv_show_detail.id,
  season.season_number,
  season.name,
  season.poster_path,
  season.episode_count
from public.seasons season
join public.tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
join public.library_items library_item on library_item.id = tv_show_detail.library_item_id
join public.media_titles media_title
  on media_title.tmdb_id = library_item.tmdb_id
 and media_title.media_type = library_item.media_type
join public.media_tv_show_details new_tv_show_detail on new_tv_show_detail.media_title_id = media_title.id
order by new_tv_show_detail.id, season.season_number, library_item.updated_at desc, season.id;

insert into public.media_episodes (
  season_id,
  episode_number,
  name,
  air_date,
  runtime
)
select distinct on (new_season.id, episode.episode_number)
  new_season.id,
  episode.episode_number,
  episode.name,
  episode.air_date,
  episode.runtime
from public.episodes episode
join public.seasons season on season.id = episode.season_id
join public.tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
join public.library_items library_item on library_item.id = tv_show_detail.library_item_id
join public.media_titles media_title
  on media_title.tmdb_id = library_item.tmdb_id
 and media_title.media_type = library_item.media_type
join public.media_tv_show_details new_tv_show_detail on new_tv_show_detail.media_title_id = media_title.id
join public.media_seasons new_season
  on new_season.tv_show_details_id = new_tv_show_detail.id
 and new_season.season_number = season.season_number
order by new_season.id, episode.episode_number, library_item.updated_at desc, episode.id;

insert into public.user_library_items (
  user_id,
  media_title_id,
  added_at,
  updated_at
)
select
  library_item.user_id,
  media_title.id,
  library_item.added_at,
  library_item.updated_at
from public.library_items library_item
join public.media_titles media_title
  on media_title.tmdb_id = library_item.tmdb_id
 and media_title.media_type = library_item.media_type;

insert into public.user_watchlist_items (
  user_id,
  media_title_id,
  added_at
)
select
  watchlist_item.user_id,
  media_title.id,
  watchlist_item.added_at
from public.watchlist_items watchlist_item
join public.media_titles media_title
  on media_title.tmdb_id = watchlist_item.tmdb_id
 and media_title.media_type = watchlist_item.media_type;

insert into public.user_movie_trackings (
  user_id,
  library_item_id,
  watched,
  user_rating,
  created_at,
  updated_at
)
select
  movie_tracking.user_id,
  user_library_item.id,
  movie_tracking.watched,
  movie_tracking.user_rating,
  movie_tracking.created_at,
  movie_tracking.updated_at
from public.movie_trackings movie_tracking
join public.library_items library_item on library_item.id = movie_tracking.library_item_id
join public.media_titles media_title
  on media_title.tmdb_id = library_item.tmdb_id
 and media_title.media_type = library_item.media_type
join public.user_library_items user_library_item
  on user_library_item.user_id = movie_tracking.user_id
 and user_library_item.media_title_id = media_title.id;

insert into public.user_show_trackings (
  user_id,
  library_item_id,
  user_rating,
  created_at,
  updated_at
)
select
  show_tracking.user_id,
  user_library_item.id,
  show_tracking.user_rating,
  show_tracking.created_at,
  show_tracking.updated_at
from public.show_trackings show_tracking
join public.library_items library_item on library_item.id = show_tracking.library_item_id
join public.media_titles media_title
  on media_title.tmdb_id = library_item.tmdb_id
 and media_title.media_type = library_item.media_type
join public.user_library_items user_library_item
  on user_library_item.user_id = show_tracking.user_id
 and user_library_item.media_title_id = media_title.id;

insert into public.user_season_trackings (
  user_id,
  season_id,
  user_rating,
  created_at,
  updated_at
)
select distinct on (season_tracking.user_id, new_season.id)
  season_tracking.user_id,
  new_season.id,
  season_tracking.user_rating,
  season_tracking.created_at,
  season_tracking.updated_at
from public.season_trackings season_tracking
join public.seasons season on season.id = season_tracking.season_id
join public.tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
join public.library_items library_item on library_item.id = tv_show_detail.library_item_id
join public.media_titles media_title
  on media_title.tmdb_id = library_item.tmdb_id
 and media_title.media_type = library_item.media_type
join public.media_tv_show_details new_tv_show_detail on new_tv_show_detail.media_title_id = media_title.id
join public.media_seasons new_season
  on new_season.tv_show_details_id = new_tv_show_detail.id
 and new_season.season_number = season.season_number
order by season_tracking.user_id, new_season.id, season_tracking.updated_at desc, season_tracking.id;

insert into public.user_episode_trackings (
  user_id,
  episode_id,
  watched,
  user_rating,
  created_at,
  updated_at
)
select distinct on (episode_tracking.user_id, new_episode.id)
  episode_tracking.user_id,
  new_episode.id,
  episode_tracking.watched,
  episode_tracking.user_rating,
  episode_tracking.created_at,
  episode_tracking.updated_at
from public.episode_trackings episode_tracking
join public.episodes episode on episode.id = episode_tracking.episode_id
join public.seasons season on season.id = episode.season_id
join public.tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
join public.library_items library_item on library_item.id = tv_show_detail.library_item_id
join public.media_titles media_title
  on media_title.tmdb_id = library_item.tmdb_id
 and media_title.media_type = library_item.media_type
join public.media_tv_show_details new_tv_show_detail on new_tv_show_detail.media_title_id = media_title.id
join public.media_seasons new_season
  on new_season.tv_show_details_id = new_tv_show_detail.id
 and new_season.season_number = season.season_number
join public.media_episodes new_episode
  on new_episode.season_id = new_season.id
 and new_episode.episode_number = episode.episode_number
order by episode_tracking.user_id, new_episode.id, episode_tracking.updated_at desc, episode_tracking.id;

drop table if exists public.episode_trackings cascade;
drop table if exists public.season_trackings cascade;
drop table if exists public.show_trackings cascade;
drop table if exists public.movie_trackings cascade;
drop table if exists public.episodes cascade;
drop table if exists public.seasons cascade;
drop table if exists public.tv_show_details cascade;
drop table if exists public.movie_details cascade;
drop table if exists public.watchlist_items cascade;
drop table if exists public.library_items cascade;

drop function if exists public.touch_library_item(uuid);
drop function if exists public.touch_library_item_from_season_tracking();
drop function if exists public.touch_library_item_from_episode_tracking();
drop function if exists public.touch_library_item_from_movie_tracking();
drop function if exists public.touch_library_item_from_show_tracking();
drop function if exists public.is_library_item_owner(uuid);
drop function if exists public.is_tv_show_details_owner(uuid);
drop function if exists public.is_season_owner(uuid);
drop function if exists public.is_episode_owner(uuid);
