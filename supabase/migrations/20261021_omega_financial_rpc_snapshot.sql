-- HAUS BARBER | Exact production definitions inspected 2026-10-21.
-- Reproducible baseline only. The chronological successor migration corrects manual payment dating.
-- Apply this file before the subsequent finance reconciliation migration when rebuilding a clean DB.
CREATE OR REPLACE FUNCTION public.haus_register_payment_parts(p_booking_id uuid, p_parts jsonb, p_cash_received_cents integer, p_request_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_booking public.bookings%rowtype;
 v_cash uuid;
 v_batch uuid;
 v_parts_count integer;
 v_total bigint;
 v_cash_part bigint;
 v_method_count integer;
 v_now_date date := timezone('America/Sao_Paulo',now())::date;
 v_part record;
begin
 if not public.is_admin() then raise exception 'Acesso administrativo necessário.'; end if;
 if p_booking_id is null or p_request_id is null then raise exception 'Operação inválida.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('haus_pay|'||p_request_id::text,0));
 if exists(select 1 from public.haus_payment_batches where request_id=p_request_id and booking_id=p_booking_id) then
   return true;
 end if;
 select * into v_booking from public.bookings where id=p_booking_id for update;
 if not found or v_booking.status<>'confirmed' then raise exception 'Atendimento não está confirmado.'; end if;
 if v_booking.payment_status='paid' then raise exception 'Este atendimento já foi pago.'; end if;
 if v_booking.payment_status not in ('unpaid','refunded') then raise exception 'Estado do pagamento inválido.'; end if;
 if jsonb_typeof(p_parts)<>'array' then raise exception 'Informe os valores por forma de pagamento.'; end if;
 if exists(select 1 from jsonb_array_elements(p_parts) x where jsonb_typeof(x->'cents')<>'number' or (x->>'cents')!~'^[0-9]{1,8}$' or (x->>'method') not in ('cash','pix','debit','credit')) then
  raise exception 'Pagamento contém forma ou valor inválido.';
 end if;
 select count(*),coalesce(sum((x->>'cents')::integer),0),coalesce(sum(case when x->>'method'='cash' then (x->>'cents')::integer else 0 end),0),count(distinct x->>'method')
 into v_parts_count,v_total,v_cash_part,v_method_count from jsonb_array_elements(p_parts) x;
 if v_parts_count < 1 or v_parts_count > 4 or v_method_count<>v_parts_count or v_total<>v_booking.service_amount_cents or exists(select 1 from jsonb_array_elements(p_parts) x where (x->>'cents')::integer<=0) then
   raise exception 'A soma dos valores precisa ser igual ao total do serviço e não pode repetir métodos.';
 end if;
 if v_cash_part>0 and coalesce(p_cash_received_cents,0)<v_cash_part then raise exception 'Valor em dinheiro insuficiente.'; end if;
 if v_cash_part=0 and coalesce(p_cash_received_cents,0)<>0 then raise exception 'Informe dinheiro recebido apenas quando houver pagamento em dinheiro.'; end if;
 select id into v_cash from public.cash_sessions where business_date=v_now_date and status='open' for update;
 if v_cash is null then raise exception 'Abra o caixa de hoje para registrar o pagamento.'; end if;
 insert into public.haus_payment_batches(booking_id,request_id) values(p_booking_id,p_request_id) returning id into v_batch;
 for v_part in select x->>'method' method,(x->>'cents')::integer cents from jsonb_array_elements(p_parts) x loop
  insert into public.cash_entries(session_id,booking_id,entry_type,amount_cents,payment_method,description,created_by,haus_payment_batch_id,cash_received_cents,change_given_cents)
  values(v_cash,p_booking_id,'sale',v_part.cents,v_part.method,'Pagamento registrado na Haus',auth.uid(),v_batch,
   case when v_part.method='cash' then p_cash_received_cents else null end,
   case when v_part.method='cash' then p_cash_received_cents-v_part.cents else null end);
 end loop;
 update public.bookings set payment_status='paid',
 payment_method=case when v_parts_count=1 then p_parts->0->>'method' else null end,
 paid_at=now(),completed_at=coalesce(completed_at,now())
 where id=p_booking_id;
 return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.haus_register_manual_parts(p_request_id uuid, p_service text, p_booking_date date, p_booking_time time without time zone, p_customer_name text, p_parts jsonb, p_cash_received_cents integer, p_barber_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid; v_existing uuid; v_batch uuid; v_session uuid; v_sale record; v_part record;
 v_total bigint;v_count integer;v_distinct integer;v_cash_part bigint;
begin
 if not public.is_admin() then raise exception 'Acesso administrativo necessário.'; end if;
 if p_request_id is null then raise exception 'Operação inválida.'; end if;
 if p_barber_id is not null and not exists(select 1 from public.haus_barbers where id=p_barber_id and active=true) then raise exception 'Barbeiro inválido ou inativo.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('haus_manual_parts|'||p_request_id::text,0));
 select b.id into v_existing from public.bookings b where b.manual_request_id=p_request_id;
 if v_existing is not null then
   if exists(select 1 from public.haus_payment_batches where request_id=p_request_id and booking_id=v_existing) then return v_existing; end if;
   raise exception 'Esta operação já existe no modelo antigo.';
 end if;
 if jsonb_typeof(p_parts)<>'array' then raise exception 'Informe o pagamento.'; end if;
 if exists(select 1 from jsonb_array_elements(p_parts) x where jsonb_typeof(x->'cents')<>'number' or (x->>'cents')!~'^[0-9]{1,8}$' or (x->>'method') not in ('cash','pix','debit','credit')) then raise exception 'Pagamento inválido.'; end if;
 select count(*),count(distinct x->>'method'),coalesce(sum((x->>'cents')::integer),0),
 coalesce(sum(case when x->>'method'='cash' then (x->>'cents')::integer else 0 end),0)
 into v_count,v_distinct,v_total,v_cash_part from jsonb_array_elements(p_parts) x;
 if v_count<1 or v_count>4 or v_distinct<>v_count or v_total<=0
 or exists(select 1 from jsonb_array_elements(p_parts) x where (x->>'cents')::integer<=0) then raise exception 'Distribuição inválida.'; end if;
 if v_cash_part>0 and coalesce(p_cash_received_cents,0)<v_cash_part then raise exception 'Dinheiro recebido insuficiente.'; end if;
 if v_cash_part=0 and coalesce(p_cash_received_cents,0)<>0 then raise exception 'Valor em dinheiro inesperado.'; end if;
 if v_total<>public.service_price_cents(p_service) then raise exception 'Os pagamentos não correspondem ao preço atual do serviço.'; end if;
 v_id:=public.admin_register_manual_service(p_request_id,p_service,p_booking_date,p_booking_time,'cash',p_customer_name);
 select cs.id into v_session from public.cash_sessions cs where cs.business_date=p_booking_date for update;
 -- The legacy RPC just created precisely one sale, not previously committed.
 delete from public.cash_entries where booking_id=v_id and entry_type='sale';
 insert into public.haus_payment_batches(booking_id,request_id) values(v_id,p_request_id) returning id into v_batch;
 for v_part in select x->>'method' method,(x->>'cents')::integer cents from jsonb_array_elements(p_parts) x loop
   insert into public.cash_entries(session_id,booking_id,entry_type,amount_cents,payment_method,description,created_by,haus_payment_batch_id,cash_received_cents,change_given_cents)
   values(v_session,v_id,'sale',v_part.cents,v_part.method,'Atendimento manual - pagamento discriminado',auth.uid(),v_batch,
    case when v_part.method='cash' then p_cash_received_cents else null end,
    case when v_part.method='cash' then p_cash_received_cents-v_part.cents else null end);
 end loop;
 update public.bookings set payment_method=case when v_count=1 then p_parts->0->>'method' else null end, haus_barber_id=p_barber_id where id=v_id;
 return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.haus_refund_payment(p_booking_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_booking public.bookings%rowtype; v_batch public.haus_payment_batches%rowtype; v_sale record;
begin
 if not public.is_admin() then raise exception 'Acesso administrativo necessário.'; end if;
 select * into v_booking from public.bookings where id=p_booking_id for update;
 if not found then raise exception 'Atendimento não encontrado.'; end if;
 if v_booking.payment_status<>'paid' then raise exception 'Pagamento não está ativo.'; end if;
 select * into v_batch from public.haus_payment_batches where booking_id=p_booking_id and refunded_at is null order by created_at desc limit 1 for update;
 if not found then return public.refund_booking_payment(p_booking_id); end if;
 if not exists(select 1 from public.cash_sessions where business_date=timezone('America/Sao_Paulo',now())::date and status='open') then
   raise exception 'Abra ou reabra o caixa de hoje antes de registrar o estorno.';
 end if;
 for v_sale in select * from public.cash_entries where haus_payment_batch_id=v_batch.id and entry_type='sale' loop
   insert into public.cash_entries(session_id,booking_id,entry_type,amount_cents,payment_method,description,created_by,haus_payment_batch_id)
   values(v_sale.session_id,p_booking_id,'refund',v_sale.amount_cents,v_sale.payment_method,'Estorno de pagamento combinado',auth.uid(),v_batch.id);
 end loop;
 update public.haus_payment_batches set refunded_at=now() where id=v_batch.id;
 update public.bookings set payment_status='refunded',payment_method=null where id=p_booking_id;
 return true;
end;
$function$;
