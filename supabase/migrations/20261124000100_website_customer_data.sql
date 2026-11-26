begin;
set local lock_timeout = '3s';

create table public.website_customer_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) between 1 and 100),
  email text not null,
  created_at timestamptz not null default now(),
  trial_requested_at timestamptz
);

alter table public.website_customer_data enable row level security;

revoke all on public.website_customer_data from public, anon, authenticated, service_role;
grant select on public.website_customer_data to authenticated;
grant select on public.website_customer_data to service_role;

create policy "Website customers can read their own record"
  on public.website_customer_data for select
  to authenticated
  using ((select auth.uid()) = user_id);

create function public.sync_myco_website_customer_data()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.email is not null and new.raw_user_meta_data ->> 'signup_source' = 'myco_website' then
      insert into public.website_customer_data (user_id, full_name, email)
      values (new.id, nullif(left(btrim(new.raw_user_meta_data ->> 'full_name'), 100), ''), new.email);
    end if;
  elsif new.email is not null and new.email is distinct from old.email then
    update public.website_customer_data set email = new.email where user_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_myco_website_customer_data() from public, anon, authenticated, service_role;

create trigger sync_myco_website_customer_data
  after insert or update of email on auth.users
  for each row execute function public.sync_myco_website_customer_data();

create function public.request_website_customer_trial()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  customer auth.users%rowtype;
begin
  select * into customer from auth.users where id = (select auth.uid()) for share;
  if not found or customer.email is null or customer.email_confirmed_at is null then
    raise exception 'A confirmed email account is required' using errcode = '42501';
  end if;

  insert into public.website_customer_data (user_id, full_name, email, trial_requested_at)
  values (
    customer.id,
    nullif(left(btrim(customer.raw_user_meta_data ->> 'full_name'), 100), ''),
    customer.email,
    now()
  )
  on conflict (user_id) do update
    set trial_requested_at = excluded.trial_requested_at
    where public.website_customer_data.trial_requested_at is null;
end;
$$;

revoke all on function public.request_website_customer_trial() from public, anon, authenticated, service_role;
grant execute on function public.request_website_customer_trial() to authenticated;

-- Signups check for this function before creating any Auth users.
create function public.website_customer_signup_ready()
returns boolean
language sql
stable
set search_path = ''
as $$ select true $$;

revoke all on function public.website_customer_signup_ready() from public, anon, authenticated, service_role;
grant execute on function public.website_customer_signup_ready() to anon;

commit;
