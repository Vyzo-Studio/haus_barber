-- HAUS-005 | Duration-aware reservations for shared Haus scheduling resource.
-- Requires previous duration/schema migration. Staff must confirm real duration of each service.
-- Existing public RPC signatures and 30-minute grid remain compatible.

create or replace function public.create_booking_request(
  p_customer_name text,p_service text,p_booking_date date,p_booking_time time
) returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_id uuid;
 v_now timestamp:=timezone('America/Sao_Paulo',now());
 v_price integer;
 v_duration integer;
 v_category text;
 v_start timestamp;
 v_finish timestamp;
begin
 if char_length(btrim(coalesce(p_customer_name,''))) not between 2 and 80
 then raise exception 'Nome inválido.'; end if;
 if char_length(btrim(coalesce(p_service,''))) not between 2 and 120
 then raise exception 'Serviço inválido.'; end if;
 v_price:=public.service_price_cents(p_service);
 if v_price is null or v_price<=0 then raise exception 'Serviço sem valor cadastrado.'; end if;
 select s.duration_minutes,s.category into v_duration,v_category
 from public.haus_services s
 where s.active and (s.name=btrim(p_service) or s.legacy_label=btrim(p_service))
 order by (s.name=btrim(p_service)) desc,s.sort_order limit 1;
 -- Procedures of unknown duration must be configured in the panel before online booking.
 if v_category='estilo' and v_duration is null then
  raise exception 'Este serviço exige duração cadastrada. Entre em contato com a Haus.';
 end if;
 -- While durations are unconfigured, basic services occupy only the legacy 30-min slot.
 -- This is a compatibility minimum, NOT a claim about actual treatment duration.
 v_duration:=coalesce(v_duration,30);
 if p_booking_date is null or p_booking_time is null then raise exception 'Data e horário obrigatórios.'; end if;
 if extract(dow from p_booking_date)=0 then raise exception 'A Haus não atende aos domingos.'; end if;
 if p_booking_date<v_now::date or p_booking_date>v_now::date+60 then
  raise exception 'Data fora do período permitido.'; end if;
 if p_booking_time<time '09:00' or p_booking_time>=time '20:00'
  or extract(minute from p_booking_time) not in (0,30)
  or extract(second from p_booking_time)<>0 then
  raise exception 'Horário inválido.'; end if;
 v_start:=p_booking_date+p_booking_time;
 v_finish:=v_start+(v_duration*interval '1 minute');
 if v_start<=v_now then raise exception 'Esse horário já passou.'; end if;
 if v_finish>p_booking_date+time '20:00' then
  raise exception 'Este atendimento ultrapassaria o horário de fechamento.'; end if;
 update public.bookings set status='expired',updated_at=now()
 where status='pending' and expires_at is not null and expires_at<=now();
 -- Locks all new reservations for this date as a single constrained resource.
 perform pg_advisory_xact_lock(hashtextextended('haus_booking_date|'||p_booking_date::text,0));
 if exists(select 1 from public.bookings b where b.booking_date=p_booking_date
   and (b.status='confirmed' or (b.status='pending' and b.expires_at>now()))
   and tsrange(b.booking_date+b.booking_time,
     b.booking_date+b.booking_time+(coalesce(b.duration_minutes,30)*interval '1 minute'),'[)')
   && tsrange(v_start,v_finish,'[)')
 ) then raise exception 'Este período já está ocupado. Escolha outro horário.'; end if;
 -- Exclusion constraint on bookings also rejects a concurrent overlapping writer.
 insert into public.bookings(
  customer_name,service,service_amount_cents,booking_date,booking_time,
  duration_minutes,status,payment_status,expires_at
 ) values(
  btrim(p_customer_name),btrim(p_service),v_price,p_booking_date,p_booking_time,
  v_duration,'pending','unpaid',now()+interval '30 minutes'
 ) returning id into v_id;
 return v_id;
end $$;

create or replace function public.get_public_booked_slots(
  p_start_date date,p_end_date date
) returns table(booking_date date,booking_time time,slot_status text)
language plpgsql security definer set search_path='' as $$
begin
 if p_start_date is null or p_end_date is null or p_end_date<p_start_date
  or p_end_date>p_start_date+90 then raise exception 'Período inválido.'; end if;
 update public.bookings set status='expired',updated_at=now()
  where status='pending' and expires_at is not null and expires_at<=now();
 return query
 with active as (
   select b.booking_date,b.booking_time,coalesce(b.duration_minutes,30) duration_minutes,b.status
   from public.bookings b
   where b.booking_date between p_start_date and p_end_date
    and (b.status='confirmed' or (b.status='pending' and b.expires_at>now()))
 ),
 occupied as (
   select a.booking_date,s.slot::time booking_time,
     case when bool_or(a.status='confirmed') then 'occupied'::text else 'pending'::text end status
   from active a
   cross join lateral generate_series(
     a.booking_date+a.booking_time,
     a.booking_date+a.booking_time+(a.duration_minutes-30)*interval '1 minute',
     interval '30 minutes'
   ) s(slot)
   where s.slot::date=a.booking_date and s.slot::time<time '20:00'
   group by a.booking_date,s.slot
 )
 select o.booking_date,o.booking_time,o.status from occupied o
 order by o.booking_date,o.booking_time;
end $$;

revoke all on function public.create_booking_request(text,text,date,time) from PUBLIC,anon,authenticated;
revoke all on function public.get_public_booked_slots(date,date) from PUBLIC,anon,authenticated;
grant execute on function public.create_booking_request(text,text,date,time) to anon,authenticated;
grant execute on function public.get_public_booked_slots(date,date) to anon,authenticated;
