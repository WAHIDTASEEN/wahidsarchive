# New-material email updates

The homepage subscription form stores subscriber email addresses privately. When an admin publishes a new material, the admin page calls a Netlify Function that sends an email to active subscribers through Resend.

## 1. Supabase

Run `newsletter.sql` in Supabase SQL Editor. The table has RLS enabled and grants no direct access to anonymous or signed-in website visitors.

## 2. Netlify environment variables

In Netlify site settings → Environment variables, add:

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — the public/anon key from the Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key; keep secret and never place it in frontend files
- `NEWSLETTER_ADMIN_USER_ID` — the UUID of the admin account allowed to send publish notifications
- `RESEND_API_KEY` — API key from Resend
- `NEWSLETTER_FROM` — a verified sender, e.g. `Wahid’s Archive <updates@your-verified-domain.example>`

The sender domain must be verified in Resend. Do not commit secrets to GitHub.

## 3. Deploy and test

Deploy the complete `wahid_work_build` folder to Netlify. Subscribe with an email you control. Then publish a test material while signed in as the configured admin user. The publish status will report whether email delivery was attempted and how many recipients were sent. Each email contains an unsubscribe link.

If these environment variables or the SQL migration are missing, the subscription form will show a configuration error, and material publishing will still succeed but email alerts will not be sent. Email delivery is not active until you complete these setup steps.
