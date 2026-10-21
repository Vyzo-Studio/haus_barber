-- HAUS Barber | Gestão de combos: contratos, pagamentos, utilização e trilha de auditoria
-- Exclusivo da Haus. Não modifica dados ou recursos da GNG.
create table if not exists public.haus_combo_plans (
  id text primary key,
  name text not null check (char_length(name) between 4 and 120),
  price_cents integer not null check (price_cents > 0),
  cuts_total integer not null default 0 check (cuts_total between 0 and 20),
  beards_total integer not null default 0 check (beards_total between 0 and 20),
  brows_total integer not null default 0 check (brows_total between 0 and 20),
  duration_days integer not null default 45 check (duration_days = 45),
  active boolean not null default true,
  sort_order integer not null default 0,
  check (cuts_total + beards_total + brows_total > 0)
);
insert into public.haus_combo_plans(id,name,price_cents,cuts_total,beards_total,brows_total,sort_order) values
 ('degrade_4','4 Cortes Degradê',7500,4,0,0,10),
 ('degrade_brows','4 Cortes Degradê + Sobrancelha',9000,4,0,4,20),
 ('degrade_beard','4 Cortes Degradê + Barba',13500,4,4,0,30),
 ('social_4','4 Cortes Social',6000,4,0,0,40),
 ('social_brows','4 Cortes Social + Sobrancelha',7500,4,0,4,50),
 ('social_beard','4 Cortes Social + Barba',12000,4,4,0,60),
 ('beard_4','4 Barbas',6000,0,4,0,70)
on conflict (id) do nothing;

create table if not exists public.haus_combo_customers (
 id uuid primary key default gen_random_uuid(),
 full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
 whatsapp_digits text not null unique check (whatsapp_digits ~ '^55[0-9]{10,11}$'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.haus_combo_memberships (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 customer_id uuid not null references public.haus_combo_customers(id),
 plan_id text not null references public.haus_combo_plans(id),
 plan_name text not null,
 price_cents integer not null check(price_cents>0),
 cuts_total integer not null check(cuts_total>=0),
 beards_total integer not null check(beards_total>=0),
 brows_total integer not null check(brows_total>=0),
 start_date date not null,
 expires_on date not null,
 status text not null default 'active' check(status in ('active','canceled')),
 notes text,
 created_at timestamptz not null default now(),
 created_by uuid references auth.users(id),
 check(expires_on = start_date + 45)
);
create index if not exists haus_combo_member_customer on public.haus_combo_memberships(customer_id,created_at desc);
create index if not exists haus_combo_member_dates on public.haus_combo_memberships(start_date,expires_on);
create table if not exists public.haus_combo_uses (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 membership_id uuid not null references public.haus_combo_memberships(id),
 kind text not null check(kind in ('cut','beard','brows')),
 used_on date not null,
 used_time time,
 barber_id uuid references public.haus_barbers(id) on delete set null,
 note text check(note is null or char_length(note)<=300),
 created_at timestamptz not null default now(),
 created_by uuid references auth.users(id),
 voided_at timestamptz,
 voided_by uuid references auth.users(id),
 void_reason text
);
create unique index if not exists haus_combo_unique_daily_use
 on public.haus_combo_uses(membership_id,kind,used_on) where voided_at is null;
create index if not exists haus_combo_uses_member on public.haus_combo_uses(membership_id,created_at desc);
alter table public.cash_entries
 add column if not exists haus_combo_membership_id uuid references public.haus_combo_memberships(id) on delete restrict;
create unique index if not exists haus_combo_one_payment_per_method
 on public.cash_entries(haus_combo_membership_id,payment_method)
 where haus_combo_membership_id is not null and entry_type='sale';

alter table public.haus_combo_plans enable row level security;
alter table public.haus_combo_customers enable row level security;
alter table public.haus_combo_memberships enable row level security;
alter table public.haus_combo_uses enable row level security;
revoke all on public.haus_combo_plans,public.haus_combo_customers,public.haus_combo_memberships,public.haus_combo_uses from PUBLIC,anon,authenticated;

create or replace function public.haus_combo_admin_summary()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
 select jsonb_build_object(
  'plans',coalesce((select jsonb_agg(to_jsonb(p) order by p.sort_order)
                      from public.haus_combo_plans p where p.active),'[]'::jsonb),
  'barbers',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name) order by b.name)
                       from public.haus_barbers b where b.active),'[]'::jsonb),
  'memberships',coalesce((
    select jsonb_agg(to_jsonb(t) order by t.created_at desc)
    from (
      select m.id,m.customer_id,m.plan_id,m.plan_name,m.price_cents,
       m.cuts_total,m.beards_total,m.brows_total,m.start_date,m.expires_on,m.status,
       m.notes,m.created_at, c.full_name,c.whatsapp_digits,
       coalesce(u.cuts_used,0) cuts_used,coalesce(u.beards_used,0) beards_used,
       coalesce(u.brows_used,0) brows_used,
       greatest(0,m.expires_on - (timezone('America/Sao_Paulo',now()))::date) days_left
      from public.haus_combo_memberships m
      join public.haus_combo_customers c on c.id=m.customer_id
      left join lateral (
       select count(*) filter(where kind='cut') cuts_used,
              count(*) filter(where kind='beard') beards_used,
              count(*) filter(where kind='brows') brows_used
       from public.haus_combo_uses x where x.membership_id=m.id and x.voided_at is null
      ) u on true
      order by m.created_at desc limit 700
    ) t
  ),'[]'::jsonb)
 ) into v_result;
 return v_result;
end $$;

create or replace function public.haus_combo_admin_history(p_membership_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
 select coalesce(jsonb_agg(
   jsonb_build_object('id',u.id,'kind',u.kind,'used_on',u.used_on,
    'used_time',u.used_time,'note',u.note,'created_at',u.created_at,
    'voided_at',u.voided_at,'void_reason',u.void_reason,'barber_name',b.name)
   order by u.created_at desc
 ),'[]'::jsonb) into v_result
 from public.haus_combo_uses u
 left join public.haus_barbers b on b.id=u.barber_id
 where u.membership_id=p_membership_id;
 return v_result;
end $$;

create or replace function public.haus_combo_create(
 p_request_id uuid,p_customer_name text,p_whatsapp text,p_plan_id text,
 p_start_date date,p_payments jsonb,p_cash_received_cents integer default null,
 p_notes text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_today date:=timezone('America/Sao_Paulo',now())::date;
 v_name text:=btrim(coalesce(p_customer_name,''));
 v_phone text:=regexp_replace(coalesce(p_whatsapp,''),'[^0-9]','','g');
 v_plan public.haus_combo_plans%rowtype;
 v_customer uuid;
 v_member uuid;
 v_cash_session uuid;
 v_parts integer:=0;
 v_paid integer:=0;
 v_cash integer:=0;
 v_cash_received integer;
 v_item jsonb;
 v_method text;
 v_amount integer;
 v_methods text[]:=array[]::text[];
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
 if p_request_id is null then raise exception 'Identificador obrigatório.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('haus_combo_sale|'||p_request_id::text,0));
 select id into v_member from public.haus_combo_memberships where request_id=p_request_id;
 if found then return v_member; end if;
 if char_length(v_name)<2 or char_length(v_name)>80 then raise exception 'Nome precisa ter entre 2 e 80 caracteres.'; end if;
 if char_length(v_phone) in (10,11) then v_phone:='55'||v_phone; end if;
 if v_phone !~ '^55[0-9]{10,11}$' then raise exception 'WhatsApp inválido. Use número com DDD.'; end if;
 if p_start_date is null or p_start_date<date '2020-01-01' or p_start_date>v_today+365 then
   raise exception 'Data de início inválida.'; end if;
 if p_notes is not null and char_length(p_notes)>400 then raise exception 'Observação muito longa.'; end if;
 select * into v_plan from public.haus_combo_plans where id=p_plan_id and active for share;
 if not found then raise exception 'Plano indisponível.'; end if;
 if p_payments is null or jsonb_typeof(p_payments)<>'array' or jsonb_array_length(p_payments) not between 1 and 4
 then raise exception 'Selecione de 1 a 4 formas de pagamento.'; end if;
 for v_item in select value from jsonb_array_elements(p_payments) loop
   v_method:=v_item->>'method';
   if v_method is null or v_method not in ('cash','pix','debit','credit')
     or v_method=any(v_methods) then raise exception 'Métodos de pagamento inválidos ou duplicados.'; end if;
   if coalesce(v_item->>'cents','') !~ '^[1-9][0-9]{0,7}$' then raise exception 'Valor de pagamento inválido.'; end if;
   v_amount:=(v_item->>'cents')::integer;
   v_methods:=array_append(v_methods,v_method);
   v_paid:=v_paid+v_amount;
   if v_method='cash' then v_cash:=v_amount; end if;
   v_parts:=v_parts+1;
 end loop;
 if v_paid<>v_plan.price_cents then raise exception 'O total dos pagamentos precisa ser igual ao preço do plano.'; end if;
 if v_cash>0 then
    v_cash_received:=coalesce(p_cash_received_cents,v_cash);
    if v_cash_received<v_cash or v_cash_received>99999999 then
      raise exception 'O valor recebido em dinheiro deve ser igual ou maior que a parte em dinheiro.'; end if;
 elsif p_cash_received_cents is not null then
    raise exception 'Troco somente em pagamentos com dinheiro.';
 end if;
 select id into v_cash_session from public.cash_sessions
  where business_date=v_today and status='open' for update;
 if not found then raise exception 'Abra o caixa de hoje antes de vender um combo.'; end if;
 insert into public.haus_combo_customers(full_name,whatsapp_digits)
  values(v_name,v_phone) on conflict(whatsapp_digits)
  do update set full_name=excluded.full_name,updated_at=now()
  returning id into v_customer;
 insert into public.haus_combo_memberships
  (request_id,customer_id,plan_id,plan_name,price_cents,cuts_total,beards_total,brows_total,
   start_date,expires_on,notes,created_by)
  values(p_request_id,v_customer,v_plan.id,v_plan.name,v_plan.price_cents,
    v_plan.cuts_total,v_plan.beards_total,v_plan.brows_total,
    p_start_date,p_start_date+45,nullif(btrim(coalesce(p_notes,'')),''),auth.uid())
  returning id into v_member;
 for v_item in select value from jsonb_array_elements(p_payments) loop
   v_method:=v_item->>'method';
   v_amount:=(v_item->>'cents')::integer;
   insert into public.cash_entries
    (session_id,haus_combo_membership_id,entry_type,amount_cents,payment_method,description,
     created_by,cash_received_cents,change_given_cents)
   values(v_cash_session,v_member,'sale',v_amount,v_method,
     'Venda de plano Haus: '||v_plan.name,auth.uid(),
     case when v_method='cash' then v_cash_received else null end,
     case when v_method='cash' then v_cash_received-v_cash else null end);
 end loop;
 return v_member;
end $$;

create or replace function public.haus_combo_redeem(
 p_request_id uuid,p_membership_id uuid,p_kind text,p_used_on date,
 p_used_time time default null,p_barber_id uuid default null,p_note text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_member public.haus_combo_memberships%rowtype;
 v_quota int;
 v_used int;
 v_id uuid;
 v_today date:=timezone('America/Sao_Paulo',now())::date;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
 if p_request_id is null or p_membership_id is null then raise exception 'Operação inválida.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('haus_combo_use|'||p_membership_id::text,0));
 select id into v_id from public.haus_combo_uses where request_id=p_request_id;
 if found then return v_id; end if;
 select * into v_member from public.haus_combo_memberships where id=p_membership_id for update;
 if not found then raise exception 'Combo não encontrado.'; end if;
 if v_member.status<>'active' then raise exception 'Combo cancelado.'; end if;
 if p_kind not in ('cut','beard','brows') then raise exception 'Tipo de serviço inválido.'; end if;
 if p_used_on is null or p_used_on<v_member.start_date or p_used_on>=v_member.expires_on
    or p_used_on>v_today then raise exception 'Data fora da validade do combo ou no futuro.'; end if;
 if p_note is not null and char_length(p_note)>300 then raise exception 'Observação muito longa.'; end if;
 if p_barber_id is not null and not exists(
   select 1 from public.haus_barbers where id=p_barber_id and active)
   then raise exception 'Barbeiro inativo ou não encontrado.'; end if;
 v_quota:=case p_kind when 'cut' then v_member.cuts_total
                     when 'beard' then v_member.beards_total
                     else v_member.brows_total end;
 if v_quota=0 then raise exception 'Esse serviço não faz parte do combo.'; end if;
 select count(*) into v_used from public.haus_combo_uses
   where membership_id=p_membership_id and kind=p_kind and voided_at is null;
 if v_used>=v_quota then raise exception 'Saldo esgotado para este serviço.'; end if;
 if exists(select 1 from public.haus_combo_uses
    where membership_id=p_membership_id and kind=p_kind
       and used_on=p_used_on and voided_at is null) then
    raise exception 'Esse serviço já foi lançado nesta data.'; end if;
 insert into public.haus_combo_uses
   (request_id,membership_id,kind,used_on,used_time,barber_id,note,created_by)
 values(p_request_id,p_membership_id,p_kind,p_used_on,p_used_time,p_barber_id,
   nullif(btrim(coalesce(p_note,'')),''),auth.uid())
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.haus_combo_void_use(p_use_id uuid,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
 if char_length(btrim(coalesce(p_reason,'')))<5 or char_length(p_reason)>250 then
    raise exception 'Informe o motivo da correção (5 a 250 caracteres).'; end if;
 update public.haus_combo_uses
 set voided_at=now(),voided_by=auth.uid(),void_reason=btrim(p_reason)
 where id=p_use_id and voided_at is null returning id into v_id;
 if v_id is null then raise exception 'Utilização não encontrada ou já corrigida.'; end if;
 return true;
end $$;

create or replace function public.haus_combo_update_customer(
 p_customer_id uuid,p_name text,p_whatsapp text
) returns boolean language plpgsql security definer set search_path='' as $$
declare v_phone text:=regexp_replace(coalesce(p_whatsapp,''),'[^0-9]','','g');
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
 if char_length(btrim(coalesce(p_name,''))) not between 2 and 80 then
   raise exception 'Nome inválido.'; end if;
 if char_length(v_phone) in (10,11) then v_phone:='55'||v_phone; end if;
 if v_phone !~ '^55[0-9]{10,11}$' then raise exception 'WhatsApp inválido.'; end if;
 update public.haus_combo_customers set full_name=btrim(p_name),whatsapp_digits=v_phone,
   updated_at=now() where id=p_customer_id;
 if not found then raise exception 'Cliente não encontrado.'; end if;
 return true;
end $$;
do $$
declare v_name text;
begin
 foreach v_name in array array[
 'haus_combo_admin_summary','haus_combo_admin_history','haus_combo_create',
 'haus_combo_redeem','haus_combo_void_use','haus_combo_update_customer'
 ] loop
  execute format('revoke all on function public.%I from public,anon,authenticated',v_name);
  execute format('grant execute on function public.%I to authenticated',v_name);
 end loop;
end $$;
-- Membership sale ledger is linked to cash_entries, never to fake bookings.

-- A visit can consume cut and extras atomically in one administrative action.
alter table public.haus_combo_uses add column if not exists visit_request_id uuid;
create unique index if not exists haus_combo_visit_unique_kind
 on public.haus_combo_uses(visit_request_id,kind) where visit_request_id is not null;
create or replace function public.haus_combo_redeem_visit(
 p_request_id uuid,p_membership_id uuid,p_kinds text[],p_used_on date,
 p_used_time time default null,p_barber_id uuid default null,p_note text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_member public.haus_combo_memberships%rowtype;
 v_kind text;
 v_quota int;
 v_used int;
 v_id uuid;
 v_ids jsonb:='[]'::jsonb;
 v_today date:=timezone('America/Sao_Paulo',now())::date;
 v_seen text[]:=array[]::text[];
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
 if p_request_id is null or p_membership_id is null then raise exception 'Operação inválida.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('haus_combo_visit|'||p_membership_id::text,0));
 if exists(select 1 from public.haus_combo_uses where visit_request_id=p_request_id) then
   select coalesce(jsonb_agg(to_jsonb(x.id)),'[]'::jsonb) into v_ids
   from public.haus_combo_uses x where x.visit_request_id=p_request_id;
   return v_ids;
 end if;
 select * into v_member from public.haus_combo_memberships where id=p_membership_id for update;
 if not found then raise exception 'Combo não encontrado.'; end if;
 if v_member.status<>'active' then raise exception 'Combo cancelado.'; end if;
 if p_used_on is null or p_used_on<v_member.start_date or p_used_on>=v_member.expires_on
   or p_used_on>v_today then raise exception 'Data fora da validade do combo ou no futuro.'; end if;
 if p_note is not null and char_length(p_note)>300 then raise exception 'Observação muito longa.'; end if;
 if p_kinds is null or array_length(p_kinds,1) not between 1 and 3 then
   raise exception 'Selecione pelo menos um serviço deste atendimento.'; end if;
 if p_barber_id is not null and not exists(
   select 1 from public.haus_barbers where id=p_barber_id and active)
   then raise exception 'Barbeiro inativo ou não encontrado.'; end if;
 foreach v_kind in array p_kinds loop
   if v_kind is null or v_kind not in ('cut','beard','brows')
      or v_kind=any(v_seen) then raise exception 'Serviços inválidos ou repetidos.'; end if;
   v_seen:=array_append(v_seen,v_kind);
   v_quota:=case v_kind when 'cut' then v_member.cuts_total
                        when 'beard' then v_member.beards_total else v_member.brows_total end;
   if v_quota=0 then raise exception 'Esse serviço não faz parte do combo.'; end if;
   select count(*) into v_used from public.haus_combo_uses
     where membership_id=p_membership_id and kind=v_kind and voided_at is null;
   if v_used>=v_quota then raise exception 'Saldo esgotado para '||v_kind; end if;
   if exists(select 1 from public.haus_combo_uses
      where membership_id=p_membership_id and kind=v_kind and used_on=p_used_on and voided_at is null)
     then raise exception 'Esse serviço já foi lançado nesta data.'; end if;
 end loop;
 foreach v_kind in array p_kinds loop
   insert into public.haus_combo_uses
    (request_id,visit_request_id,membership_id,kind,used_on,used_time,barber_id,note,created_by)
   values(gen_random_uuid(),p_request_id,p_membership_id,v_kind,p_used_on,p_used_time,p_barber_id,
     nullif(btrim(coalesce(p_note,'')),''),auth.uid()) returning id into v_id;
   v_ids:=v_ids||jsonb_build_array(v_id);
 end loop;
 return v_ids;
end $$;
revoke all on function public.haus_combo_redeem_visit(uuid,uuid,text[],date,time,uuid,text) from public,anon,authenticated;
grant execute on function public.haus_combo_redeem_visit(uuid,uuid,text[],date,time,uuid,text) to authenticated;
