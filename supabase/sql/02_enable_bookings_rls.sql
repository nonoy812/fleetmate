-- STEP 2 of 2 — run ONLY after the website update that uses
-- get_booked_dates() is live. Running it earlier makes the booking
-- calendar show every date as free until the update is deployed.

alter table public.bookings enable row level security;

-- Customers (not logged in) may only CREATE new pending bookings.
-- They cannot read, edit or delete any booking.
drop policy if exists "Public can create pending bookings" on public.bookings;
create policy "Public can create pending bookings"
  on public.bookings
  for insert
  to anon
  with check (status = 'pending');

-- Logged-in admins can do everything.
-- IMPORTANT: turn OFF public sign-ups in Supabase
-- (Authentication > Sign In / Providers > "Allow new users to sign up"),
-- otherwise anyone could create an account and get admin access.
drop policy if exists "Admins have full access" on public.bookings;
create policy "Admins have full access"
  on public.bookings
  for all
  to authenticated
  using (true)
  with check (true);
