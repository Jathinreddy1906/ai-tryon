create table public.try_on_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_slug text not null,
  provider_prediction_id text unique,
  status text not null default 'starting'
    check (status in ('starting', 'in_queue', 'processing', 'completed', 'failed', 'expired')),
  consent_version text not null,
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index try_on_jobs_user_created_at_idx
  on public.try_on_jobs (user_id, created_at desc);

alter table public.try_on_jobs enable row level security;
revoke all on public.try_on_jobs from public, anon, authenticated;
grant select, insert, update, delete on public.try_on_jobs to service_role;

create trigger try_on_jobs_set_updated_at
  before update on public.try_on_jobs
  for each row execute function public.set_updated_at();

create or replace function public.create_try_on_job(
  p_user_id uuid,
  p_product_slug text,
  p_consent_version text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_job_id uuid;
begin
  if p_consent_version is null or length(p_consent_version) > 100 then
    raise exception 'INVALID_CONSENT_VERSION' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if exists (
    select 1
    from public.try_on_jobs
    where user_id = p_user_id
      and status in ('starting', 'in_queue', 'processing')
      and created_at > now() - interval '10 minutes'
  ) then
    raise exception 'TRY_ON_ALREADY_ACTIVE' using errcode = 'P0001';
  end if;

  if (
    select count(*)
    from public.try_on_jobs
    where user_id = p_user_id
      and created_at > now() - interval '24 hours'
  ) >= 3 then
    raise exception 'TRY_ON_DAILY_LIMIT' using errcode = 'P0001';
  end if;

  insert into public.try_on_jobs (user_id, product_slug, consent_version)
  values (p_user_id, p_product_slug, p_consent_version)
  returning id into new_job_id;

  return new_job_id;
end;
$$;

revoke all on function public.create_try_on_job(uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_try_on_job(uuid, text, text) to service_role;
