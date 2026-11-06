-- Keep every existing ID, stroke, name and visitor receipt. New clients arrange
-- marks visually; legacy clients still get their original collision protection.
alter table public.portfolio_wall_marks
  add column packed boolean not null default false,
  add column display_order bigint generated always as identity,
  drop constraint wall_marks_do_not_overlap,
  add constraint wall_marks_do_not_overlap exclude using gist (
    int4range(bounds[1], bounds[3], '[)') with &&,
    int4range(bounds[2], bounds[4], '[)') with &&
  ) where (not packed);
grant select (display_order) on public.portfolio_wall_marks to anon, authenticated;
grant insert (packed) on public.portfolio_wall_marks to anon;
