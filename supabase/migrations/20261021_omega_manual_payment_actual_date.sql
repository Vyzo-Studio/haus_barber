-- HAUS OMEGA | Registros presenciais: caixa do dia do recebimento, nunca a data do atendimento.
-- Snapshot auditado: supabase/migrations/20261021_omega_financial_rpc_snapshot.sql
-- Nenhum dado existente é movido, reclassificado ou excluído por esta migração.

create or replace function public.haus_register_manual_parts(
 p_request_id uuid,
 p_service text,
 p_booking_date date,
 p_booking_time time without time zone,
 p_customer_name text,
 p_parts jsonb,
 p_cash_received_cents integer,
 p_barber_id uuid default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_id uuid;
 v_existing uuid;
 v_batch uuid;
 v_cash_session uuid;
 v_name text:=btrim(coalesce(p_customer_name,''));
 v_service text:=btrim(coalesce(p_service,''));
 v_price integer;
 v_total bigint;
 v_count integer;
 v_distinct integer;
 v_cash_part bigint;
 v_part record;
 v_today date:=timezone('America/Sao_Paulo',now())::date;
 v_local_now timestamp:=timezone('America/Sao_Paulo',now());
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo necessário.'; end if;
 if p_request_id is null then raise exception 'Identificador da operação inválido.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('haus_manual_parts|'||p_request_id::text,0));
 select id into v_existing from public.bookings where manual_request_id=p_request_id;
 if found then
   if exists(select 1 from public.haus_payment_batches
      where request_id=p_request_id and booking_id=v_existing) then return v_existing; end if;
   raise exception 'Identificador já associado a outra operação. Consulte o histórico antes de reenviar.';
 end if;
 if v_name='' then v_name:='Cliente não informado'; end if;
 if char_length(v_name) not between 2 and 80 then raise exception 'Nome inválido.'; end if;
 if char_length(v_service) not between 2 and 120 then raise exception 'Serviço inválido.'; end if;
 v_price:=public.service_price_cents(v_service);
 if v_price is null or v_price<=0 then raise exception 'Serviço não cadastrado ou indisponível.'; end if;
 if p_booking_date is null or p_booking_date<date '2020-01-01' or p_booking_date>v_today+365
   then raise exception 'Data do atendimento fora do período permitido.'; end if;
 if p_booking_time is null or p_booking_time<time '09:00' or p_booking_time>time '20:00'
   or extract(minute from p_booking_time) not in (0,30)
   or extract(second from p_booking_time)<>0
   then raise exception 'Horário do atendimento inválido.'; end if;
 if p_barber_id is not null and not exists(
   select 1 from public.haus_barbers where id=p_barber_id and active
 ) then raise exception 'Profissional não cadastrado ou inativo.'; end if;
 if p_parts is null or jsonb_typeof(p_parts)<>'array' or jsonb_array_length(p_parts) not between 1 and 4
   then raise exception 'Selecione de uma a quatro formas de pagamento.'; end if;
 if exists(select 1 from jsonb_array_elements(p_parts) x
   where jsonb_typeof(x->'cents') is distinct from 'number'
      or coalesce(x->>'cents','') !~ '^[1-9][0-9]{0,7}$'
      or coalesce(x->>'method','') not in ('cash','pix','debit','credit')
 ) then raise exception 'Valor ou método de pagamento inválido.'; end if;
 select count(*),count(distinct x->>'method'),coalesce(sum((x->>'cents')::integer),0),
    coalesce(sum(case when x->>'method'='cash' then (x->>'cents')::integer else 0 end),0)
 into v_count,v_distinct,v_total,v_cash_part
 from jsonb_array_elements(p_parts) x;
 if v_distinct<>v_count or v_total<>v_price then
   raise exception 'A soma das formas de pagamento precisa corresponder ao preço do serviço.';
 end if;
 if v_cash_part>0 and (p_cash_received_cents is null
  or p_cash_received_cents<v_cash_part or p_cash_received_cents>99999999) then
    raise exception 'Dinheiro recebido insuficiente ou inválido.'; end if;
 if v_cash_part=0 and coalesce(p_cash_received_cents,0)<>0 then
    raise exception 'Informe troco somente em pagamento com dinheiro.'; end if;
 -- A operação é recebida AGORA, mesmo que o atendimento tenha acontecido ontem ou esteja agendado para amanhã.
 select id into v_cash_session from public.cash_sessions
 where business_date=v_today and status='open' for update;
 if not found then raise exception 'Abra o caixa de hoje para registrar o recebimento.'; end if;
 -- Compatibilidade com a agenda anterior: mesmo lock por dia + início.
 perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text||'|'||p_booking_time::text,0));
 if exists(select 1 from public.bookings b
   where b.booking_date=p_booking_date and b.booking_time=p_booking_time
   and (b.status='confirmed' or (b.status='pending' and b.expires_at>now()))
 ) then raise exception 'Já existe atendimento ou agendamento neste horário.'; end if;
 insert into public.bookings (
   customer_name,service,booking_date,booking_time,status,expires_at,service_amount_cents,
   payment_status,payment_method,paid_at,completed_at,is_manual,manual_request_id,haus_barber_id
 ) values (
   v_name,v_service,p_booking_date,p_booking_time,'confirmed',null,v_price,'paid',
   case when v_count=1 then p_parts->0->>'method' else null end,
   now(),
   case when p_booking_date+p_booking_time<=v_local_now
     then (p_booking_date+p_booking_time) at time zone 'America/Sao_Paulo' else null end,
   true,p_request_id,p_barber_id
 ) returning id into v_id;
 insert into public.haus_payment_batches(booking_id,request_id)
 values(v_id,p_request_id) returning id into v_batch;
 for v_part in select x->>'method' method,(x->>'cents')::integer cents
   from jsonb_array_elements(p_parts) x
 loop
   insert into public.cash_entries(
    session_id,booking_id,entry_type,amount_cents,payment_method,description,
    created_by,haus_payment_batch_id,cash_received_cents,change_given_cents
   ) values(
    v_cash_session,v_id,'sale',v_part.cents,v_part.method,
    'Recebimento presencial de atendimento manual; data do serviço: '||
    to_char(p_booking_date,'DD/MM/YYYY'),auth.uid(),v_batch,
    case when v_part.method='cash' then p_cash_received_cents else null end,
    case when v_part.method='cash' then p_cash_received_cents-v_cash_part else null end
   );
 end loop;
 return v_id;
end $$;

-- Mantenha o RPC legado seguro para telas que ainda o chamam:
create or replace function public.admin_register_manual_service(
 p_request_id uuid,p_service text,p_booking_date date,p_booking_time time without time zone,
 p_payment_method text,p_customer_name text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_id uuid;
 v_name text:=btrim(coalesce(p_customer_name,''));
 v_service text:=btrim(coalesce(p_service,''));
 v_method text:=lower(btrim(coalesce(p_payment_method,'')));
 v_price integer;
 v_cash uuid;
 v_today date:=timezone('America/Sao_Paulo',now())::date;
 v_local_now timestamp:=timezone('America/Sao_Paulo',now());
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
 if p_request_id is null then raise exception 'Identificador inválido.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('haus_manual|'||p_request_id::text,0));
 select id into v_id from public.bookings where manual_request_id=p_request_id;
 if found then return v_id; end if;
 if v_name='' then v_name:='Cliente não informado'; end if;
 if char_length(v_name) not between 2 and 80 then raise exception 'Nome inválido.'; end if;
 v_price:=public.service_price_cents(v_service);
 if v_price is null or v_price<=0 then raise exception 'Serviço não cadastrado.'; end if;
 if v_method not in ('cash','pix','debit','credit') then raise exception 'Forma de pagamento inválida.'; end if;
 if p_booking_date is null or p_booking_date<date '2020-01-01' or p_booking_date>v_today+365
 then raise exception 'Data inválida.'; end if;
 if p_booking_time is null or p_booking_time<time '09:00' or p_booking_time>time '20:00'
 or extract(minute from p_booking_time) not in (0,30)
 or extract(second from p_booking_time)<>0 then raise exception 'Horário inválido.'; end if;
 select id into v_cash from public.cash_sessions
  where business_date=v_today and status='open' for update;
 if not found then raise exception 'Abra o caixa de hoje para registrar recebimento.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text||'|'||p_booking_time::text,0));
 if exists(select 1 from public.bookings b where b.booking_date=p_booking_date and b.booking_time=p_booking_time
 and (b.status='confirmed' or (b.status='pending' and b.expires_at>now())))
 then raise exception 'Já existe agendamento neste horário.'; end if;
 insert into public.bookings(
 customer_name,service,booking_date,booking_time,status,expires_at,
 service_amount_cents,payment_status,payment_method,paid_at,
 completed_at,is_manual,manual_request_id
 ) values (
 v_name,v_service,p_booking_date,p_booking_time,'confirmed',null,
 v_price,'paid',v_method,now(),
 case when p_booking_date+p_booking_time<=v_local_now
   then (p_booking_date+p_booking_time) at time zone 'America/Sao_Paulo' else null end,
 true,p_request_id
 ) returning id into v_id;
 insert into public.cash_entries(session_id,booking_id,entry_type,amount_cents,payment_method,description,created_by)
 values(v_cash,v_id,'sale',v_price,v_method,
 'Recebimento presencial: data do serviço '||to_char(p_booking_date,'DD/MM/YYYY'),auth.uid());
 return v_id;
end $$;

revoke all on function public.haus_register_manual_parts(uuid,text,date,time,text,jsonb,integer,uuid) from public,anon,authenticated;
revoke all on function public.admin_register_manual_service(uuid,text,date,time,text,text) from public,anon,authenticated;
grant execute on function public.haus_register_manual_parts(uuid,text,date,time,text,jsonb,integer,uuid) to authenticated;
grant execute on function public.admin_register_manual_service(uuid,text,date,time,text,text) to authenticated;
