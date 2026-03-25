create extension if not exists pgcrypto;

create type public.media_type as enum ('movie', 'tv');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  media_type public.media_type not null,
  title text not null,
  poster_path text,
  backdrop_path text,
  overview text not null,
  release_date_or_first_air_date text,
  genres_json jsonb not null default '[]'::jsonb,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

create table public.movie_details (
  id uuid primary key default gen_random_uuid(),
  library_item_id uuid not null unique references public.library_items(id) on delete cascade,
  runtime integer
);

create table public.tv_show_details (
  id uuid primary key default gen_random_uuid(),
  library_item_id uuid not null unique references public.library_items(id) on delete cascade,
  total_seasons integer not null
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  tv_show_details_id uuid not null references public.tv_show_details(id) on delete cascade,
  season_number integer not null,
  name text not null,
  poster_path text,
  episode_count integer not null,
  unique (tv_show_details_id, season_number)
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  episode_number integer not null,
  name text not null,
  air_date text,
  runtime integer,
  unique (season_id, episode_number)
);

create table public.movie_trackings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  library_item_id uuid not null unique references public.library_items(id) on delete cascade,
  watched boolean not null default false,
  user_rating double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, library_item_id)
);

create table public.show_trackings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  library_item_id uuid not null unique references public.library_items(id) on delete cascade,
  user_rating double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, library_item_id)
);

create table public.season_trackings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  user_rating double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, season_id)
);

create table public.episode_trackings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  watched boolean not null default false,
  user_rating double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, episode_id)
);

create index library_items_user_id_idx on public.library_items(user_id);
create index library_items_media_type_idx on public.library_items(user_id, media_type);
create index library_items_updated_at_idx on public.library_items(user_id, updated_at desc);
create index movie_trackings_user_id_idx on public.movie_trackings(user_id);
create index show_trackings_user_id_idx on public.show_trackings(user_id);
create index season_trackings_user_id_idx on public.season_trackings(user_id);
create index episode_trackings_user_id_idx on public.episode_trackings(user_id);
create index seasons_tv_show_details_id_idx on public.seasons(tv_show_details_id);
create index episodes_season_id_idx on public.episodes(season_id);

create trigger set_library_items_updated_at
before update on public.library_items
for each row execute function public.set_updated_at();

create trigger set_movie_trackings_updated_at
before update on public.movie_trackings
for each row execute function public.set_updated_at();

create trigger set_show_trackings_updated_at
before update on public.show_trackings
for each row execute function public.set_updated_at();

create trigger set_season_trackings_updated_at
before update on public.season_trackings
for each row execute function public.set_updated_at();

create trigger set_episode_trackings_updated_at
before update on public.episode_trackings
for each row execute function public.set_updated_at();

create or replace function public.touch_library_item(target_library_item_id uuid)
returns void
language sql
as $$
  update public.library_items
  set updated_at = now()
  where id = target_library_item_id;
$$;

create or replace function public.touch_library_item_from_season_tracking()
returns trigger
language plpgsql
as $$
declare
  target_library_item_id uuid;
begin
  select library_item.id
  into target_library_item_id
  from public.seasons season
  join public.tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
  join public.library_items library_item on library_item.id = tv_show_detail.library_item_id
  where season.id = coalesce(new.season_id, old.season_id);

  if target_library_item_id is not null then
    perform public.touch_library_item(target_library_item_id);
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.touch_library_item_from_episode_tracking()
returns trigger
language plpgsql
as $$
declare
  target_library_item_id uuid;
begin
  select library_item.id
  into target_library_item_id
  from public.episodes episode
  join public.seasons season on season.id = episode.season_id
  join public.tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
  join public.library_items library_item on library_item.id = tv_show_detail.library_item_id
  where episode.id = coalesce(new.episode_id, old.episode_id);

  if target_library_item_id is not null then
    perform public.touch_library_item(target_library_item_id);
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.touch_library_item_from_movie_tracking()
returns trigger
language plpgsql
as $$
begin
  perform public.touch_library_item(coalesce(new.library_item_id, old.library_item_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.touch_library_item_from_show_tracking()
returns trigger
language plpgsql
as $$
begin
  perform public.touch_library_item(coalesce(new.library_item_id, old.library_item_id));
  return coalesce(new, old);
end;
$$;

create trigger touch_library_item_from_movie_trackings
after insert or update or delete on public.movie_trackings
for each row execute function public.touch_library_item_from_movie_tracking();

create trigger touch_library_item_from_show_trackings
after insert or update or delete on public.show_trackings
for each row execute function public.touch_library_item_from_show_tracking();

create trigger touch_library_item_from_season_trackings
after insert or update or delete on public.season_trackings
for each row execute function public.touch_library_item_from_season_tracking();

create trigger touch_library_item_from_episode_trackings
after insert or update or delete on public.episode_trackings
for each row execute function public.touch_library_item_from_episode_tracking();

create or replace function public.is_library_item_owner(target_library_item_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.library_items library_item
    where library_item.id = target_library_item_id
      and library_item.user_id = auth.uid()
  );
$$;

create or replace function public.is_tv_show_details_owner(target_tv_show_details_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tv_show_details tv_show_detail
    join public.library_items library_item on library_item.id = tv_show_detail.library_item_id
    where tv_show_detail.id = target_tv_show_details_id
      and library_item.user_id = auth.uid()
  );
$$;

create or replace function public.is_season_owner(target_season_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.seasons season
    join public.tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
    join public.library_items library_item on library_item.id = tv_show_detail.library_item_id
    where season.id = target_season_id
      and library_item.user_id = auth.uid()
  );
$$;

create or replace function public.is_episode_owner(target_episode_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.episodes episode
    join public.seasons season on season.id = episode.season_id
    join public.tv_show_details tv_show_detail on tv_show_detail.id = season.tv_show_details_id
    join public.library_items library_item on library_item.id = tv_show_detail.library_item_id
    where episode.id = target_episode_id
      and library_item.user_id = auth.uid()
  );
$$;

alter table public.library_items enable row level security;
alter table public.movie_details enable row level security;
alter table public.tv_show_details enable row level security;
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;
alter table public.movie_trackings enable row level security;
alter table public.show_trackings enable row level security;
alter table public.season_trackings enable row level security;
alter table public.episode_trackings enable row level security;

create policy "library items select own"
on public.library_items for select
using (auth.uid() = user_id);

create policy "library items insert own"
on public.library_items for insert
with check (auth.uid() = user_id);

create policy "library items update own"
on public.library_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "library items delete own"
on public.library_items for delete
using (auth.uid() = user_id);

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

create policy "movie trackings own"
on public.movie_trackings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id and public.is_library_item_owner(library_item_id));

create policy "show trackings own"
on public.show_trackings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id and public.is_library_item_owner(library_item_id));

create policy "season trackings own"
on public.season_trackings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id and public.is_season_owner(season_id));

create policy "episode trackings own"
on public.episode_trackings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id and public.is_episode_owner(episode_id));
