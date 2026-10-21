-- HAUS BARBER | Catalog, team roster, managed portfolio, split settlements.
-- Only HAUS data; this migration never writes into GNG tables.
create table if not exists public.haus_services (
  id text primary key,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  legacy_label text unique,
  category text not null check (category in ('corte','barba','quimica')),
  price_cents integer not null check (price_cents between 0 and 1000000),
  duration_minutes integer not null default 30 check (duration_minutes between 15 and 480),
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
create unique index if not exists haus_services_lower_name_uk on public.haus_services (lower(name));
insert into public.haus_services(id,name,legacy_label,category,price_cents,sort_order) values
('corte_social','Corte Social','Corte Social - R$ 20','corte',2000,1),
('corte_degrade','Corte Degradê','Corte Degradê - R$ 25','corte',2500,2),
('corte_navalhado','Corte Navalhado','Corte Navalhado - R$ 25','corte',2500,3),
('barba','Barba','Barba - R$ 20','barba',2000,4),
('pezinho','Pezinho','Pezinho - R$ 10','barba',1000,5),
('sobrancelha','Sobrancelha','Sobrancelha - R$ 5','barba',500,6),
('pigmentacao','Pigmentação','Pigmentação - R$ 20','barba',2000,7),
('progressiva','Progressiva Avulsa','Progressiva Avulsa - R$ 50','quimica',5000,8),
('progressiva_corte','Progressiva + Corte','Progressiva + Corte - R$ 70','quimica',7000,9),
('graxa','Graxa / Alisante','Graxa / Alisante - R$ 20','quimica',2000,10),
('luzes','Luzes + Corte','Luzes + Corte - R$ 110','quimica',11000,11),
('platinado','Platinado + Corte','Platinado + Corte - R$ 140','quimica',14000,12)
on conflict (id) do nothing;

create table if not exists public.haus_barbers (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(btrim(name)) between 2 and 80),
 active boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.haus_portfolio (
 id uuid primary key default gen_random_uuid(),
 image_path text not null unique check (char_length(image_path) between 4 and 350),
 storage_path text,
 category text not null default 'degrade' check (category ~ '^[a-z ]{3,60}$'),
 title text not null default 'Trabalho Haus' check (char_length(title) between 2 and 100),
 alt_text text not null default 'Corte realizado na Haus Barber' check (char_length(alt_text) between 4 and 180),
 active boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);

alter table public.haus_services enable row level security;
alter table public.haus_barbers enable row level security;
alter table public.haus_portfolio enable row level security;
-- Public may view only current offerings and public portfolio; admin controls all writes.
create policy haus_services_view on public.haus_services for select to anon,authenticated using (active or (select public.is_admin()));
create policy haus_services_create on public.haus_services for insert to authenticated with check ((select public.is_admin()));
create policy haus_services_edit on public.haus_services for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy haus_services_remove on public.haus_services for delete to authenticated using ((select public.is_admin()));
create policy haus_barbers_view on public.haus_barbers for select to anon,authenticated using (active or (select public.is_admin()));
create policy haus_barbers_create on public.haus_barbers for insert to authenticated with check ((select public.is_admin()));
create policy haus_barbers_edit on public.haus_barbers for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy haus_barbers_remove on public.haus_barbers for delete to authenticated using ((select public.is_admin()));
create policy haus_portfolio_view on public.haus_portfolio for select to anon,authenticated using (active or (select public.is_admin()));
create policy haus_portfolio_create on public.haus_portfolio for insert to authenticated with check ((select public.is_admin()));
create policy haus_portfolio_edit on public.haus_portfolio for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy haus_portfolio_remove on public.haus_portfolio for delete to authenticated using ((select public.is_admin()));
grant select on public.haus_services,public.haus_barbers,public.haus_portfolio to anon;
grant select,insert,update,delete on public.haus_services,public.haus_barbers,public.haus_portfolio to authenticated;

-- Staff assignment on new/manual bookings; existing records stay unchanged.
alter table public.bookings add column if not exists barber_id uuid references public.haus_barbers(id) on delete set null;
create index if not exists bookings_barber_id_idx on public.bookings(barber_id,booking_date);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('haus-portfolio','haus-portfolio',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy haus_portfolio_storage_insert on storage.objects for insert to authenticated
with check (bucket_id='haus-portfolio' and (select public.is_admin()));
create policy haus_portfolio_storage_update on storage.objects for update to authenticated
using (bucket_id='haus-portfolio' and (select public.is_admin()))
with check (bucket_id='haus-portfolio' and (select public.is_admin()));
create policy haus_portfolio_storage_delete on storage.objects for delete to authenticated
using (bucket_id='haus-portfolio' and (select public.is_admin()));

-- Booking RPC calls this function to get the CURRENT price. Old sales keep their price snapshot.
create or replace function public.service_price_cents(p_service text) returns integer
language sql stable security definer set search_path = '' as $$
 select s.price_cents from public.haus_services s
 where s.active and (s.name = btrim(p_service) or s.legacy_label = btrim(p_service))
 limit 1
$$;
revoke all on function public.service_price_cents(text) from public,anon;
grant execute on function public.service_price_cents(text) to authenticated;

-- One financial settlement, one set of journal entries; never record the cash tendered amount as revenue.
create or replace function public.admin_pay_booking_split(
  p_booking_id uuid, p_parts jsonb, p_cash_tendered_cents integer default null
) returns boolean language plpgsql security definer set search_path='' as $$
declare v_b public.bookings%rowtype; v_session uuid; v_parts jsonb; v_total bigint; v_cash bigint; v_count int; v_distinct int; v_method text; v_change int;
begin
 if not public.is_admin() then raise exception 'Acesso negado'; end if;
 if jsonb_typeof(p_parts) <> 'array' or jsonb_array_length(p_parts) < 1 or jsonb_array_length(p_parts)>4 then raise exception 'Selecione de 1 a 4 formas de pagamento'; end if;
 select * into v_b from public.bookings where id=p_booking_id for update;
 if not found or v_b.status<>'confirmed' or v_b.payment_status not in ('unpaid','refunded') then raise exception 'Atendimento não está pronto para pagamento'; end if;
 with parsed as (select value->>'method' method, (value->>'amount_cents')::integer cents from jsonb_array_elements(p_parts))
 select coalesce(sum(cents),0),coalesce(sum(cents) filter(where method='cash'),0),count(*),count(distinct method)
 into v_total,v_cash,v_count,v_distinct from parsed;
 if v_total<>v_b.service_amount_cents or v_total<=0 or v_count<>v_distinct then raise exception 'Valores divididos devem totalizar exatamente o preço do serviço'; end if;
 if exists (select 1 from jsonb_array_elements(p_parts) x where x->>'method' not in ('cash','pix','debit','credit') or (x->>'amount_cents')::integer<=0) then raise exception 'Forma ou valor inválido'; end if;
 if v_cash>0 and p_cash_tendered_cents is not null and p_cash_tendered_cents<v_cash then raise exception 'Dinheiro recebido menor que a parcela'; end if;
 if v_cash=0 and p_cash_tendered_cents is not null then raise exception 'Troco só se aplica a dinheiro'; end if;
 v_change := coalesce(p_cash_tendered_cents,v_cash)::int-v_cash::int;
 select id into v_session from public.cash_sessions where business_date=timezone('America/Sao_Paulo',now())::date and status='open' for update;
 if v_session is null then raise exception 'Abra o caixa antes de receber pagamentos'; end if;
 insert into public.cash_entries(session_id,booking_id,entry_type,amount_cents,payment_method,description,created_by)
 select v_session,p_booking_id,'sale',(e.value->>'amount_cents')::integer,e.value->>'method',
 case when e.value->>'method'='cash' and v_change>0 then 'Pagamento combinado • troco R$ '||to_char(v_change/100.0,'FM9999990D00') else 'Pagamento de atendimento' end,auth.uid()
 from jsonb_array_elements(p_parts) e;
 select case when jsonb_array_length(p_parts)=1 then p_parts->0->>'method' else null end into v_method;
 update public.bookings set payment_status='paid',payment_method=v_method,paid_at=now(),completed_at=coalesce(completed_at,now()) where id=p_booking_id;
 return true;
end $$;
revoke all on function public.admin_pay_booking_split(uuid,jsonb,integer) from public,anon;
grant execute on function public.admin_pay_booking_split(uuid,jsonb,integer) to authenticated;

-- Cancel a split settlement by reversing EACH non-refunded part; preserve payment method breakdown.
create or replace function public.refund_booking_payment(p_booking_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare v_b public.bookings%rowtype; v_session uuid; v_rows integer;
begin
 if not public.is_admin() then raise exception 'Acesso negado'; end if;
 select * into v_b from public.bookings where id=p_booking_id for update;
 if not found or v_b.payment_status<>'paid' then raise exception 'Este atendimento não possui pagamento disponível para estorno'; end if;
 select id into v_session from public.cash_sessions where business_date=timezone('America/Sao_Paulo',now())::date and status='open' for update;
 if v_session is null then raise exception 'Abra o caixa antes de registrar um estorno'; end if;
 insert into public.cash_entries(session_id,booking_id,entry_type,amount_cents,payment_method,description,created_by)
 select ce.session_id,ce.booking_id,'refund',ce.amount_cents,ce.payment_method,'Estorno para correção de pagamento',auth.uid()
 from public.cash_entries ce
 where ce.booking_id=p_booking_id and ce.entry_type='sale'
 and not exists (select 1 from public.cash_entries r where r.booking_id=p_booking_id and r.entry_type='refund' and r.created_at>ce.created_at);
 get diagnostics v_rows = row_count;
 if v_rows=0 then raise exception 'Não foi possível localizar as parcelas originais'; end if;
 update public.bookings set payment_status='refunded',payment_method=null where id=p_booking_id;
 return true;
end $$;
revoke all on function public.refund_booking_payment(uuid) from public,anon;
grant execute on function public.refund_booking_payment(uuid) to authenticated;

-- Manual service + combined payment, with atomic rollback and idempotency.
create or replace function public.admin_register_manual_service_v2(
 p_request_id uuid, p_service text, p_booking_date date, p_booking_time time,
 p_parts jsonb, p_customer_name text default null, p_cash_tendered_cents integer default null,
 p_barber_id uuid default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_today timestamp := timezone('America/Sao_Paulo',now());
 v_booking uuid; v_cash_session uuid; v_session_status text;
 v_price integer; v_parts_count int; v_method_count int; v_total bigint; v_cash bigint;
 v_name text := btrim(coalesce(p_customer_name,'')); v_service text := btrim(coalesce(p_service,''));
 v_primary text; v_change integer;
begin
 if not public.is_admin() then raise exception 'Acesso negado'; end if;
 if p_request_id is null then raise exception 'Operação inválida'; end if;
 perform pg_advisory_xact_lock(hashtextextended('haus_manual|'||p_request_id::text,0));
 select id into v_booking from public.bookings where manual_request_id=p_request_id;
 if found then return v_booking; end if;
 if v_name='' then v_name:='Cliente não informado'; end if;
 if char_length(v_name) not between 2 and 80 then raise exception 'Nome inválido'; end if;
 if not exists(select 1 from public.haus_services s where s.active and (s.name=v_service or s.legacy_label=v_service)) then raise exception 'Serviço não está disponível'; end if;
 v_price:=public.service_price_cents(v_service);
 if v_price is null or v_price<=0 then raise exception 'Preço do serviço inválido'; end if;
 if jsonb_typeof(p_parts)<>'array' or jsonb_array_length(p_parts) not between 1 and 4 then raise exception 'Informe 1 a 4 parcelas'; end if;
 with parsed as (select x.value->>'method' method, (x.value->>'amount_cents')::integer cents from jsonb_array_elements(p_parts) x)
 select sum(cents),coalesce(sum(cents) filter(where method='cash'),0),count(*),count(distinct method)
 into v_total,v_cash,v_parts_count,v_method_count from parsed;
 if v_total<>v_price or v_parts_count<>v_method_count then raise exception 'A soma das parcelas precisa corresponder ao preço do serviço'; end if;
 if exists(select 1 from jsonb_array_elements(p_parts) e where e.value->>'method' not in ('cash','pix','debit','credit') or (e.value->>'amount_cents')::integer<=0) then raise exception 'Parcela inválida'; end if;
 if v_cash>0 and p_cash_tendered_cents is not null and p_cash_tendered_cents<v_cash then raise exception 'Dinheiro recebido insuficiente'; end if;
 if v_cash=0 and p_cash_tendered_cents is not null then raise exception 'Troco apenas para dinheiro'; end if;
 v_change:=coalesce(p_cash_tendered_cents,v_cash)::int-v_cash::int;
 if p_booking_date is null or p_booking_time is null or p_booking_date < date '2020-01-01' or p_booking_date>v_today::date+365 then raise exception 'Data inválida'; end if;
 if p_booking_time<time '09:00' or p_booking_time>time '20:00' or extract(minute from p_booking_time) not in (0,30) or extract(second from p_booking_time)<>0 then raise exception 'Horário inválido'; end if;
 if p_barber_id is not null and not exists(select 1 from public.haus_barbers h where h.id=p_barber_id and h.active) then raise exception 'Barbeiro inativo ou inexistente'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text||'|'||p_booking_time::text,0));
 if exists(select 1 from public.bookings b where b.booking_date=p_booking_date and b.booking_time=p_booking_time and (b.status='confirmed' or (b.status='pending' and b.expires_at>now()))) then raise exception 'Já existe atendimento ou agendamento nesse horário'; end if;
 insert into public.cash_sessions(business_date,status,opening_amount_cents,opened_by,opened_at,closed_by,closed_at)
 values(p_booking_date,case when p_booking_date<v_today::date then 'closed' else 'open' end,0,auth.uid(),now(),case when p_booking_date<v_today::date then auth.uid() else null end,case when p_booking_date<v_today::date then now() else null end)
 on conflict(business_date) do nothing;
 select id,status into v_cash_session,v_session_status from public.cash_sessions where business_date=p_booking_date for update;
 if v_cash_session is null then raise exception 'Caixa não encontrado'; end if;
 select case when jsonb_array_length(p_parts)=1 then p_parts->0->>'method' else null end into v_primary;
 insert into public.bookings(customer_name,service,booking_date,booking_time,status,expires_at,service_amount_cents,payment_status,payment_method,paid_at,completed_at,is_manual,manual_request_id,barber_id)
 values (v_name,v_service,p_booking_date,p_booking_time,'confirmed',null,v_price,'paid',v_primary,now(),case when p_booking_date+p_booking_time<=v_today then (p_booking_date+p_booking_time) at time zone 'America/Sao_Paulo' else null end,true,p_request_id,p_barber_id)
 returning id into v_booking;
 insert into public.cash_entries(session_id,booking_id,entry_type,amount_cents,payment_method,description,created_by)
 select v_cash_session,v_booking,'sale',(e.value->>'amount_cents')::integer,e.value->>'method',
 'Atendimento manual'||case when v_session_status='closed' then ' • ajuste pós-fechamento' else '' end||case when e.value->>'method'='cash' and v_change>0 then ' • troco R$ '||to_char(v_change/100.0,'FM9999990D00') else '' end, auth.uid()
 from jsonb_array_elements(p_parts) e;
 return v_booking;
end $$;
revoke all on function public.admin_register_manual_service_v2(uuid,text,date,time,jsonb,text,integer,uuid) from public,anon;
grant execute on function public.admin_register_manual_service_v2(uuid,text,date,time,jsonb,text,integer,uuid) to authenticated;

-- Seed the existing 35 photos as manageable metadata; do not delete the original image assets.
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-002.webp','barba','Barba','Trabalho de barba realizado pela Haus Barber',1) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-080.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',2) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-114.webp','navalhado luzes','Navalhado + Luzes','Trabalho da Haus Barber com Degradê Navalhado e Luzes',3) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-008.webp','degrade','Degradê','Corte com degradê realizado pela Haus Barber',4) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-032.webp','luzes freestyle','Luzes + Freestyle','Trabalho da Haus Barber com Luzes e Freestyle / Desenhos',5) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-049.webp','navalhado','Degradê Navalhado','Degradê navalhado realizado pela Haus Barber',6) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-011.webp','barba','Barba','Trabalho de barba realizado pela Haus Barber',7) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-056.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',8) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-145.webp','luzes','Luzes','Trabalho com luzes realizado pela Haus Barber',9) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-060.webp','navalhado','Degradê Navalhado','Degradê navalhado realizado pela Haus Barber',10) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-024.webp','luzes','Luzes','Trabalho com luzes realizado pela Haus Barber',11) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-005.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',12) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-006.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',13) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-013.webp','degrade','Degradê','Corte com degradê realizado pela Haus Barber',14) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-018.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',15) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-019.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',16) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-020.webp','degrade','Degradê','Corte com degradê realizado pela Haus Barber',17) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-028.webp','degrade','Degradê','Corte com degradê realizado pela Haus Barber',18) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-030.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',19) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-034.webp','degrade','Degradê','Corte com degradê realizado pela Haus Barber',20) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-037.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',21) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-038.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',22) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-043.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',23) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-046.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',24) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-047.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',25) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-048.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',26) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-065.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',27) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-067.webp','degrade','Degradê','Corte com degradê realizado pela Haus Barber',28) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-071.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',29) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-095.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',30) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-100.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',31) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-102.webp','degrade','Degradê','Corte com degradê realizado pela Haus Barber',32) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-116.webp','navalhado','Degradê Navalhado','Degradê navalhado realizado pela Haus Barber',33) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-121.webp','freestyle','Freestyle / Desenho','Corte com desenho freestyle realizado pela Haus Barber',34) on conflict(image_path) do nothing;
insert into public.haus_portfolio(image_path,category,title,alt_text,sort_order) values('portfolio-128.webp','degrade','Degradê','Corte com degradê realizado pela Haus Barber',35) on conflict(image_path) do nothing;