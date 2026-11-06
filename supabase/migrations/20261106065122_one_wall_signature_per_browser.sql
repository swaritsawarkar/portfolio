do $$
begin
  alter table public.portfolio_wall_marks add column if not exists visitor_id uuid;
  update public.portfolio_wall_marks set visitor_id = gen_random_uuid() where visitor_id is null;
  alter table public.portfolio_wall_marks alter column visitor_id set not null;
  create unique index if not exists portfolio_wall_marks_one_per_visitor
    on public.portfolio_wall_marks (visitor_id);
  grant insert (visitor_id) on public.portfolio_wall_marks to anon;
end;
$$;
