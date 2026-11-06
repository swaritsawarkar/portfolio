create function portfolio_private.wall_bounds(signature_name text, strokes jsonb)
returns integer[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  stroke jsonb;
  point jsonb;
  x integer;
  y integer;
  px integer;
  py integer;
  min_x integer := 1800;
  min_y integer := 8200;
  max_x integer := 0;
  max_y integer := 0;
  points integer := 0;
  ink double precision := 0;
  label_width integer := least(360, greatest(120, char_length(signature_name) * 14 + 10));
  left_edge integer;
begin
  if jsonb_typeof(strokes) is distinct from 'array' then return null; end if;
  if jsonb_array_length(strokes) not between 1 and 48 then return null; end if;
  for stroke in select value from jsonb_array_elements(strokes) loop
    if jsonb_typeof(stroke) is distinct from 'array' then return null; end if;
    points := points + jsonb_array_length(stroke);
    if jsonb_array_length(stroke) = 0 or points > 1200 then return null; end if;
    px := null;
    py := null;
    ink := ink + 8;
    for point in select value from jsonb_array_elements(stroke) loop
      if jsonb_typeof(point) is distinct from 'array' then return null; end if;
      if jsonb_array_length(point) <> 2
        or jsonb_typeof(point -> 0) is distinct from 'number'
        or jsonb_typeof(point -> 1) is distinct from 'number'
        or (point ->> 0) !~ '^[0-9]{1,4}$'
        or (point ->> 1) !~ '^[0-9]{1,4}$' then
        return null;
      end if;
      x := (point ->> 0)::integer;
      y := (point ->> 1)::integer;
      if x not between 14 and 1786 or y not between 14 and 8146 then return null; end if;
      if px is not null then
        ink := ink + sqrt(((x - px)^2 + (y - py)^2)::double precision);
      end if;
      if ink > 1800.000001 then return null; end if;
      min_x := least(min_x, x);
      min_y := least(min_y, y);
      max_x := greatest(max_x, x);
      max_y := greatest(max_y, y);
      px := x;
      py := y;
    end loop;
  end loop;
  left_edge := least(min_x - 12, 1800 - label_width - 24);
  return array[left_edge, min_y - 12, greatest(max_x + 12, left_edge + label_width + 12), max_y + 54];
end;
$$;

revoke all on function portfolio_private.wall_bounds(text, jsonb) from public;
grant execute on function portfolio_private.wall_bounds(text, jsonb) to anon, authenticated, service_role;

create table public.portfolio_wall_marks (
  id uuid primary key default gen_random_uuid(),
  name text not null check (
    char_length(name) between 1 and 40 and name = btrim(name)
    and name ~ '[^[:space:]]' and name !~ '[[:cntrl:]]'
  ),
  strokes jsonb not null,
  bounds integer[] generated always as (portfolio_private.wall_bounds(name, strokes)) stored not null,
  created_at timestamptz not null default now(),
  constraint wall_marks_do_not_overlap exclude using gist (
    int4range(bounds[1], bounds[3], '[)') with &&,
    int4range(bounds[2], bounds[4], '[)') with &&
  )
);

alter table public.portfolio_wall_marks enable row level security;
revoke all on public.portfolio_wall_marks from public, anon, authenticated;
grant select (id, name, strokes, bounds) on public.portfolio_wall_marks to anon, authenticated;
grant insert (name, strokes) on public.portfolio_wall_marks to anon;
grant delete on public.portfolio_wall_marks to authenticated;

create policy "Anyone can read wall marks"
  on public.portfolio_wall_marks for select to anon, authenticated using (true);
create policy "Anyone can sign the wall"
  on public.portfolio_wall_marks for insert to anon with check (true);
create policy "Only the portfolio owner can remove wall marks"
  on public.portfolio_wall_marks for delete to authenticated
  using ((select auth.jwt()) -> 'app_metadata' -> 'portfolio_wall_admin' = 'true'::jsonb);

lock table public.portfolio_signatures in access exclusive mode;
revoke insert (slot, name, strokes) on public.portfolio_signatures from anon;
delete from public.portfolio_signatures
where id = 'f9761679-127f-40a5-a404-3dc30efdc9ea' and name = 'SWARIT !!';

insert into public.portfolio_wall_marks (id, name, strokes, created_at)
select entry.id, entry.name, (
  select jsonb_agg((
    select jsonb_agg(jsonb_build_array(
      32 + (entry.slot % 4) * 450 + (point ->> 0)::integer,
      32 + (entry.slot / 4) * 248 + (point ->> 1)::integer
    ) order by point_number)
    from jsonb_array_elements(stroke) with ordinality as p(point, point_number)
  ) order by stroke_number)
  from jsonb_array_elements(entry.strokes) with ordinality as s(stroke, stroke_number)
), entry.created_at
from public.portfolio_signatures as entry;
