begin;
set local lock_timeout = '3s';

-- Supabase Auth sets custom app metadata after inserting an admin-created user.
create function public.capture_website_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  contact_email text := nullif(lower(btrim(new.raw_user_meta_data ->> 'myco_contact_email')), '');
begin
  if new.email ~ '^[0-9a-f]{64}@myco-website[.]invalid$' and contact_email is not null then
    insert into public.website_customer_data (user_id, full_name, email, created_at)
    values (
      new.id,
      nullif(left(btrim(new.raw_user_meta_data ->> 'full_name'), 100), ''),
      contact_email,
      coalesce(new.created_at, now())
    )
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.capture_website_customer_profile() from public, anon, authenticated, service_role;

create trigger capture_website_customer_profile
  after update of raw_app_meta_data on auth.users
  for each row
  when (
    old.raw_app_meta_data -> 'myco_website_password_account' is distinct from 'true'::jsonb
    and new.raw_app_meta_data -> 'myco_website_password_account' = 'true'::jsonb
  )
  execute function public.capture_website_customer_profile();

-- Repair only website accounts created before the metadata trigger existed.
insert into public.website_customer_data (user_id, full_name, email, created_at)
select
  id,
  nullif(left(btrim(raw_user_meta_data ->> 'full_name'), 100), ''),
  lower(btrim(raw_user_meta_data ->> 'myco_contact_email')),
  coalesce(created_at, now())
from auth.users
where raw_app_meta_data -> 'myco_website_password_account' = 'true'::jsonb
  and email ~ '^[0-9a-f]{64}@myco-website[.]invalid$'
  and nullif(btrim(raw_user_meta_data ->> 'myco_contact_email'), '') is not null
on conflict (user_id) do update set email = excluded.email
where public.website_customer_data.email ~ '^[0-9a-f]{64}@myco-website[.]invalid$';

commit;
