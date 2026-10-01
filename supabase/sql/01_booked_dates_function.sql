-- STEP 1 of 2 — safe to run any time, changes nothing for current users.
--
-- Lets the public website see which dates are taken WITHOUT being able
-- to read customer names, phones or emails from the bookings table.

create or replace function public.get_booked_dates(p_vehicle_id text default null)
returns table (vehicle_id text, pickup_date date, return_date date)
language sql
stable
security definer
set search_path = public
as $$
  select b.vehicle_id::text, b.pickup_date::date, b.return_date::date
  from public.bookings b
  where b.status = 'approved'
    and (p_vehicle_id is null or b.vehicle_id::text = p_vehicle_id);
$$;

grant execute on function public.get_booked_dates(text) to anon, authenticated;
