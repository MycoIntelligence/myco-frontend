# Website accounts

The website uses Supabase for sign-up, sign-in, and customer profiles.
The marketing homepage is public. Visitors sign in or create an account
before opening the free-trial form. Trial submissions require an authenticated
session and use the existing Resend integration. See the root README for
Resend settings.

## Supabase setup

1. Apply `migrations/20261124000100_website_customer_data.sql` in the target
   project's SQL Editor or with a PostgreSQL connection that can run DDL.
   Run this file by itself on an existing project. It adds the customer
   table, signup trigger, and trial-request function in one transaction.
   The table starts empty. Customers can read only their own row, and
   Supabase Auth manages passwords and sessions.
2. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `.env.local`
   and in the deployment environment. Restart the dev server after changing
   local values. The website's authentication and customer access use the
   signed-in user's session and the publishable key.
3. Apply `migrations/20261124000200_website_direct_signup.sql`. It updates the
   website's signup trigger and leaves existing customer rows in place.
4. Set a fresh `SUPABASE_SECRET_KEY` in the server environment. Use a named
   secret key for the website. Keep it out of browser code and Git.
5. Set `WEBSITE_LOGIN_NAMESPACE_KEY` to a random server-only value, for example
   one generated with `openssl rand -hex 32`. Use the same value wherever the
   website talks to this Auth project. Keep it stable across deployments so
   existing website accounts can continue to sign in.
6. Apply `migrations/20261125000000_sync_website_customer_profiles.sql`.
   It captures profiles after Supabase writes the website account marker
   and repairs missing profiles from existing direct signups.

New website accounts sign in with the email and password the customer enters.
The server maps the email to an internal Auth identity under a reserved,
non-deliverable domain. The original contact email is saved in
`website_customer_data`. Supabase's shared email-confirmation policy stays
in effect for other apps. Earlier website accounts keep their original
login and any previously issued confirmation links.
