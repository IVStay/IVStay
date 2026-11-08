-- A tiny subset of pgTAP (only the functions the project's test file uses), so the real test file
-- can run in PGlite, which doesn't ship pgTAP. Counters live in transaction-local settings.
create or replace function extensions._tap(pass boolean, description text, diag text default null)
returns text language plpgsql as $$
declare
  n int := coalesce(nullif(current_setting('tap.n', true), ''), '0')::int + 1;
begin
  perform set_config('tap.n', n::text, true);
  if not pass then
    perform set_config('tap.failed',
      (coalesce(nullif(current_setting('tap.failed', true), ''), '0')::int + 1)::text, true);
  end if;
  return case when pass then 'ok ' else 'not ok ' end || n || ' - ' || coalesce(description, '')
    || case when not pass and diag is not null then E'\n#   ' || diag else '' end;
end $$;

create or replace function extensions.plan(n int) returns text language plpgsql as $$
begin
  perform set_config('tap.planned', n::text, true);
  perform set_config('tap.n', '0', true);
  perform set_config('tap.failed', '0', true);
  return '1..' || n;
end $$;

create or replace function extensions.ok(pass boolean, description text) returns text
language sql as $$ select extensions._tap(coalesce(pass, false), description) $$;

create or replace function extensions.is(have anyelement, want anyelement, description text)
returns text language plpgsql as $$
begin
  return extensions._tap(have is not distinct from want, description, format('have: %s   want: %s', have, want));
end $$;

create or replace function extensions.matches(have text, regex text, description text) returns text
language sql as $$
  select extensions._tap(coalesce(have ~ regex, false), description, format('%L does not match %L', have, regex))
$$;

create or replace function extensions.lives_ok(sql text, description text) returns text
language plpgsql as $$
begin
  execute sql;
  return extensions._tap(true, description);
exception when others then
  return extensions._tap(false, description, 'died: ' || sqlstate || ' ' || sqlerrm);
end $$;

create or replace function extensions.throws_ok(sql text, errcode text, errmsg text, description text)
returns text language plpgsql as $$
begin
  execute sql;
  return extensions._tap(false, description, 'no exception was thrown');
exception when others then
  return extensions._tap(sqlstate = errcode and (errmsg is null or sqlerrm = errmsg), description,
    format('caught %s: %s (wanted %s)', sqlstate, sqlerrm, errcode));
end $$;

create or replace function extensions.results_eq(have_sql text, want_sql text, description text)
returns text language plpgsql as $$
declare
  extra int;
  missing int;
begin
  execute format('select count(*) from ((%s) except all (%s)) x', have_sql, want_sql) into extra;
  execute format('select count(*) from ((%s) except all (%s)) x', want_sql, have_sql) into missing;
  return extensions._tap(extra = 0 and missing = 0, description,
    format('%s unexpected row(s), %s missing row(s)', extra, missing));
end $$;

create or replace function extensions.finish() returns setof text language plpgsql as $$
declare
  planned int := nullif(current_setting('tap.planned', true), '')::int;
  ran int := coalesce(nullif(current_setting('tap.n', true), ''), '0')::int;
  failed int := coalesce(nullif(current_setting('tap.failed', true), ''), '0')::int;
begin
  if planned is not null and planned <> ran then
    return next format('# Looks like you planned %s tests but ran %s', planned, ran);
  end if;
  if failed > 0 then
    return next format('# Looks like you failed %s test(s) of %s', failed, ran);
  end if;
  return next format('# %s/%s passed', ran - failed, ran);
end $$;

grant execute on all functions in schema extensions to anon, authenticated, service_role;
