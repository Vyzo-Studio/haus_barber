-- HAUS-005 | Duration storage and transactional exclusion of overlapping intervals.
-- Unknown durations deliberately remain NULL; no service time has been invented.
-- For older bookings, 30min reflects only the historic 30-minute booking SLOT, not verified actual treatment duration.
alter table public.haus_services add column if not exists duration_minutes integer;
alter table public.haus_services drop constraint if exists haus_services_duration_min_check;
alter table public.haus_services add constraint haus_services_duration_min_check
 check(duration_minutes is null or
       (duration_minutes between 30 and 480 and duration_minutes%30=0));
alter table public.bookings add column if not exists duration_minutes integer;
alter table public.bookings drop constraint if exists haus_bookings_duration_min_check;
alter table public.bookings add constraint haus_bookings_duration_min_check
 check(duration_minutes is null or
       (duration_minutes between 30 and 480 and duration_minutes%30=0));
alter table public.bookings drop constraint if exists haus_no_overlapping_bookings;
alter table public.bookings add constraint haus_no_overlapping_bookings
 exclude using gist (
   tsrange(booking_date+booking_time,
           booking_date+booking_time+(coalesce(duration_minutes,30)*interval '1 minute'),
           '[)') with &&
 )
 where (status in ('pending','confirmed'));
-- Existing customer records, legacy paid bookings and amounts remain unchanged.
