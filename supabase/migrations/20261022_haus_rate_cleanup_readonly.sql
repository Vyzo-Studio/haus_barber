-- Haus Barber: anonymous reservation rate limiting + read-only availability.
-- Captured against live functions at change time; only inserts bounded guard and removes SELECT-side update.
create schema if not exists haus_security;
revoke all on schema haus_security from PUBLIC,anon,authenticated;
create table if not exists haus_security.booking_rate_secret(
 id integer primary key check(id=1),
 secret bytea not null
);
insert into haus_security.booking_rate_secret(id,secret) values(1,extensions.gen_random_bytes(32)) on conflict(id) do nothing;
create table if not exists haus_security.booking_rate_bucket(
 key_hash bytea primary key,
 window_started timestamptz not null default now(),
 attempts integer not null default 0 check(attempts>=0)
);
create index if not exists haus_booking_rate_expiry on haus_security.booking_rate_bucket(window_started);
revoke all on all tables in schema haus_security from PUBLIC,anon,authenticated;

create or replace function haus_security.enforce_booking_rate(
 p_customer_name text,p_booking_date date
) returns void language plpgsql security definer set search_path='' as $$
declare
 v_secret bytea;
 v_headers jsonb:='{}'::jsonb;
 v_ip text;
 v_n text;
 v_hash bytea;
 v_scope text;
 v_count integer;
 v_limit integer;
begin
 select secret into v_secret from haus_security.booking_rate_secret where id=1;
 if v_secret is null then raise exception 'Proteção de reservas indisponível.'; end if;
 v_n:=lower(btrim(coalesce(p_customer_name,'')));
 -- PostgREST request headers are best-effort identifiers; proxy headers may be spoofable.
 -- Rate limiting should be layered with infrastructure challenges for stronger bot defense.
 begin
   v_headers:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}'::jsonb);
 exception when others then v_headers:='{}'::jsonb;
 end;
 v_ip:=coalesce(nullif(v_headers->>'cf-connecting-ip',''),nullif(v_headers->>'x-real-ip',''),
      nullif(split_part(coalesce(v_headers->>'x-forwarded-for',''),',',1),''));
 if v_ip is not null and length(v_ip)>0 and length(v_ip)<=80 then
   v_ip:=lower(btrim(v_ip));
 else
   v_ip:=null;
 end if;
 -- Shared names remain usable, but repeated blocks by the same name/date are bounded.
 -- Use HMAC so no raw name or proxy address is retained in the guard table.
 for v_scope,v_limit in
   select 'name-date:'||v_n||'|'||p_booking_date::text, 3
   union all
   select 'proxy:'||v_ip, 10 where v_ip is not null
 loop
   v_hash:=extensions.hmac(convert_to(v_scope,'UTF8'),v_secret,'sha256');
   insert into haus_security.booking_rate_bucket(key_hash,window_started,attempts)
      values(v_hash,now(),1)
   on conflict(key_hash) do update
     set attempts=case when haus_security.booking_rate_bucket.window_started < now()-interval '15 minutes'
        then 1 else haus_security.booking_rate_bucket.attempts+1 end,
         window_started=case when haus_security.booking_rate_bucket.window_started < now()-interval '15 minutes'
        then now() else haus_security.booking_rate_bucket.window_started end
   returning attempts into v_count;
   if v_count>v_limit then
     raise exception 'Muitas solicitações recentes. Tente novamente em alguns minutos.';
   end if;
 end loop;
end $$;
revoke all on function haus_security.enforce_booking_rate(text,date) from PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.create_booking_request(p_customer_name text, p_service text, p_booking_date date, p_booking_time time without time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 -- Apply transactionally enforced request limits before touching the reservation table.
 perform haus_security.enforce_booking_rate(btrim(p_customer_name),p_booking_date);
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
end $function$
;
CREATE OR REPLACE FUNCTION public.get_public_booked_slots(p_start_date date, p_end_date date)
 RETURNS TABLE(booking_date date, booking_time time without time zone, slot_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if p_start_date is null or p_end_date is null or p_end_date<p_start_date
  or p_end_date>p_start_date+90 then raise exception 'Período inválido.'; end if;
 -- Read only: expired pending reservations are ignored in the SELECT below.
 -- Cleanup is scheduled separately to release GiST exclusion index entries.
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
end $function$
;

create or replace function public.haus_expire_pending_bookings()
returns integer language plpgsql security definer set search_path='' as $$
declare v_changed integer;
begin
 update public.bookings b
  set status='expired',updated_at=now()
  where b.status='pending' and b.expires_at is not null and b.expires_at<=now();
 get diagnostics v_changed=row_count;
 if extract(minute from now())::integer=0 then
   delete from haus_security.booking_rate_bucket
    where window_started<now()-interval '1 day';
 end if;
 return v_changed;
end $$;
revoke all on function public.haus_expire_pending_bookings() from PUBLIC,anon,authenticated;
-- Cron scheduler is installed in this project, with two existing cash-session jobs.
select cron.schedule('haus-barber-expire-reservations','* * * * *',
   'select public.haus_expire_pending_bookings();');

alter function public.set_updated_at() set search_path='';
-- Both indexes were structurally identical; retain phone_idx and safely remove lookup duplicate.
drop index if exists public.haus_combo_customers_phone_lookup;
