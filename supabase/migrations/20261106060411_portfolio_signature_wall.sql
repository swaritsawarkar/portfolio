create schema if not exists portfolio_private;

create function portfolio_private.valid_signature(strokes jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  stroke jsonb;
  point jsonb;
  x integer;
  y integer;
  previous_x integer;
  previous_y integer;
  points integer := 0;
  ink double precision := 0;
begin
  if jsonb_typeof(strokes) is distinct from 'array' then
    return false;
  end if;
  if jsonb_array_length(strokes) not between 1 and 24 then
    return false;
  end if;

  for stroke in select value from jsonb_array_elements(strokes) loop
    if jsonb_typeof(stroke) is distinct from 'array' then
      return false;
    end if;
    if jsonb_array_length(stroke) < 1 then
      return false;
    end if;
    points := points + jsonb_array_length(stroke);
    if points > 600 then
      return false;
    end if;
    previous_x := null;
    previous_y := null;
    ink := ink + 8;

    for point in select value from jsonb_array_elements(stroke) loop
      if jsonb_typeof(point) is distinct from 'array' then
        return false;
      end if;
      if jsonb_array_length(point) <> 2
        or jsonb_typeof(point -> 0) is distinct from 'number'
        or jsonb_typeof(point -> 1) is distinct from 'number'
        or (point ->> 0) !~ '^[0-9]{1,3}$'
        or (point ->> 1) !~ '^[0-9]{1,3}$' then
        return false;
      end if;
      x := (point ->> 0)::integer;
      y := (point ->> 1)::integer;
      if x not between 2 and 318 or y not between 2 and 178 then
        return false;
      end if;
      if previous_x is not null then
        ink := ink + sqrt(((x - previous_x)^2 + (y - previous_y)^2)::double precision);
      end if;
      if ink > 900.000001 then
        return false;
      end if;
      previous_x := x;
      previous_y := y;
    end loop;
  end loop;
  return true;
end;
$$;

revoke all on function portfolio_private.valid_signature(jsonb) from public;
grant usage on schema portfolio_private to anon, authenticated, service_role;
grant execute on function portfolio_private.valid_signature(jsonb) to anon, authenticated, service_role;

create table public.portfolio_signatures (
  id uuid primary key default gen_random_uuid(),
  slot integer not null unique check (slot between 0 and 119),
  name text not null check (
    char_length(name) between 1 and 40
    and name = btrim(name)
    and name ~ '[^[:space:]]'
    and name !~ '[[:cntrl:]]'
  ),
  strokes jsonb not null check (portfolio_private.valid_signature(strokes)),
  created_at timestamptz not null default now()
);

alter table public.portfolio_signatures enable row level security;
revoke all on public.portfolio_signatures from public, anon, authenticated;
grant select (id, slot, name, strokes) on public.portfolio_signatures to anon, authenticated;
grant insert (slot, name, strokes) on public.portfolio_signatures to anon;
grant delete on public.portfolio_signatures to authenticated;

create policy "Anyone can read the signing wall"
  on public.portfolio_signatures for select to anon, authenticated using (true);

create policy "Visitors can claim a free square"
  on public.portfolio_signatures for insert to anon with check (true);

create policy "Only the portfolio owner can remove a signature"
  on public.portfolio_signatures for delete to authenticated
  using ((select auth.jwt()) -> 'app_metadata' -> 'portfolio_wall_admin' = 'true'::jsonb);
