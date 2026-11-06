create table public.portfolio_visits (
  id uuid primary key,
  device text not null check (device in ('phone', 'tablet', 'desktop')),
  source text not null check (char_length(source) between 1 and 90 and source ~ '^[a-z0-9][a-z0-9.-]*$'),
  started_at timestamptz not null default now()
);

create table public.portfolio_activity (
  visit_id uuid not null references public.portfolio_visits(id) on delete cascade,
  kind text not null,
  detail text not null,
  happened_at timestamptz not null default now(),
  primary key (visit_id, kind, detail),
  check (
    (kind = 'section' and detail in ('home', 'work', 'creative', 'about', 'achievements', 'timeline', 'skills', 'signatures', 'contact'))
    or (kind = 'project' and detail in (
      'strikeout-os', 'pixelcut-pro', '10thhojayega', 'shorts-channel-os', 'ai-attention-analyzer',
      'chess-tracker-ai', 'dust-to-dollars', 'gen-z-is-cooked', 'gesture-to-text-wearable', 'webcam-latency-tester'
    ))
    or (kind = 'experience' and detail in ('entered', 'build-completed', 'build-skipped', 'boosted', 'light', 'dark'))
    or (kind = 'wall' and detail = 'started')
    or (kind = 'signed' and detail ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    or (kind = 'outbound' and detail in ('github', 'linkedin', 'instagram', 'spotify', 'email', 'project-site', 'hotstar'))
  )
);

create index portfolio_visits_started_idx on public.portfolio_visits (started_at desc);
create index portfolio_activity_recent_idx on public.portfolio_activity (visit_id, happened_at desc);
create unique index portfolio_activity_one_signing_idx on public.portfolio_activity (visit_id) where kind = 'signed';

alter table public.portfolio_visits enable row level security;
alter table public.portfolio_activity enable row level security;
revoke all on public.portfolio_visits, public.portfolio_activity from public, anon, authenticated;
grant insert (id, device, source) on public.portfolio_visits to anon;
grant insert (visit_id, kind, detail) on public.portfolio_activity to anon;
grant select on public.portfolio_visits, public.portfolio_activity to authenticated;

create policy "Anonymous visitors can record their arrival"
  on public.portfolio_visits for insert to anon with check (true);
create policy "Anonymous visitors can record a portfolio action"
  on public.portfolio_activity for insert to anon with check (true);
create policy "Only the portfolio owner can read visits"
  on public.portfolio_visits for select to authenticated
  using ((select auth.jwt()) -> 'app_metadata' -> 'portfolio_wall_admin' = 'true'::jsonb);
create policy "Only the portfolio owner can read activity"
  on public.portfolio_activity for select to authenticated
  using ((select auth.jwt()) -> 'app_metadata' -> 'portfolio_wall_admin' = 'true'::jsonb);

create function public.portfolio_stats(days integer default 7)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with period as (
    select (now() at time zone 'UTC')::date as today,
      case when days in (1, 7, 30) then days else 7 end as length
  ), visits as materialized (
    select v.* from public.portfolio_visits v, period p
    where v.started_at >= ((p.today - (p.length - 1))::timestamp at time zone 'UTC')
  ), activity as materialized (
    select a.* from public.portfolio_activity a join visits v on v.id = a.visit_id
  ), recent as (
    select v.id, v.device, v.source, greatest(v.started_at, max(a.happened_at)) as last_seen
    from visits v left join activity a on a.visit_id = v.id
    group by v.id, v.device, v.source, v.started_at
  ), daily as (
    select day::date as day, (select count(*) from visits where (started_at at time zone 'UTC')::date = day::date) as count
    from period p, generate_series((p.today - (p.length - 1))::timestamp, p.today::timestamp, interval '1 day') as day
  ), breakdown as (
    select kind, detail, count(*) as count from activity
    where kind in ('section', 'project', 'outbound', 'experience') group by kind, detail
  ), sources as (
    select source as label, count(*) as count from visits group by source order by count desc, label limit 8
  ), devices as (
    select device as label, count(*) as count from visits group by device order by count desc, label
  ), latest as (
    select left(r.id::text, 8) as visitor, r.device, r.source, r.last_seen, (
      select coalesce(jsonb_agg(to_jsonb(action) order by action.happened_at desc), '[]'::jsonb)
      from (
        select a.kind, case when a.kind = 'signed' then m.name else a.detail end as detail, a.happened_at
        from activity a left join public.portfolio_wall_marks m on a.kind = 'signed' and m.id::text = a.detail
        where a.visit_id = r.id order by a.happened_at desc limit 6
      ) action
    ) as actions
    from recent r order by r.last_seen desc limit 30
  )
  select case when (select auth.jwt()) -> 'app_metadata' -> 'portfolio_wall_admin' = 'true'::jsonb then
    jsonb_build_object(
      'visits', (select count(*) from visits),
      'recently_active', (select count(*) from recent where last_seen >= now() - interval '5 minutes'),
      'entered', (select count(*) from activity where kind = 'experience' and detail = 'entered'),
      'signed', (select count(distinct visit_id) from activity where kind = 'signed'),
      'daily', (select coalesce(jsonb_agg(to_jsonb(daily) order by day), '[]'::jsonb) from daily),
      'breakdown', (select coalesce(jsonb_agg(to_jsonb(breakdown) order by count desc, detail), '[]'::jsonb) from breakdown),
      'sources', (select coalesce(jsonb_agg(to_jsonb(sources) order by count desc, label), '[]'::jsonb) from sources),
      'devices', (select coalesce(jsonb_agg(to_jsonb(devices) order by count desc, label), '[]'::jsonb) from devices),
      'latest', (select coalesce(jsonb_agg(to_jsonb(latest) order by last_seen desc), '[]'::jsonb) from latest)
    )
  else null end;
$$;

revoke all on function public.portfolio_stats(integer) from public, anon, authenticated;
grant execute on function public.portfolio_stats(integer) to authenticated;
