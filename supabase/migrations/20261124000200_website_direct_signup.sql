begin;
set local lock_timeout = '3s';

create or replace function public.sync_myco_website_customer_data()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  website_account boolean := new.raw_app_meta_data -> 'myco_website_password_account' = 'true'::jsonb;
  contact_email text;
begin
  if tg_op = 'INSERT' then
    if website_account then
      contact_email := nullif(lower(btrim(new.raw_user_meta_data ->> 'myco_contact_email')), '');
      if contact_email is null or new.email is null
         or new.email !~ '^[0-9a-f]{64}@myco-website[.]invalid$' then
        raise exception 'Invalid website signup identity';
      end if;
    elsif new.raw_user_meta_data ->> 'signup_source' = 'myco_website' then
      contact_email := new.email;
    end if;

    if contact_email is not null then
      insert into public.website_customer_data (user_id, full_name, email)
      values (new.id, nullif(left(btrim(new.raw_user_meta_data ->> 'full_name'), 100), ''), contact_email);
    end if;
  elsif website_account is not true and new.email is not null and new.email is distinct from old.email then
    update public.website_customer_data set email = new.email where user_id = new.id;
  end if;
  return new;
end;
$$;

create function public.website_direct_signup_status(contact_email text)
returns text
language sql
stable
set search_path = ''
as $$
  select case when exists (
    select 1 from public.website_customer_data
    where lower(email) = lower(btrim(contact_email))
  ) then 'exists' else 'ready' end
$$;

revoke all on function public.website_direct_signup_status(text) from public, anon, authenticated, service_role;
grant execute on function public.website_direct_signup_status(text) to service_role;

commit;
