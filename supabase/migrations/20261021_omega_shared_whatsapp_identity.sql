-- HAUS-011 | WhatsApp may be shared by multiple people. No existing customer rows rewritten.
-- Migrates unique contact identity into stable customer IDs with shared phone permitted.
alter table public.haus_combo_customers drop constraint if exists haus_combo_customers_whatsapp_digits_key;
create index if not exists haus_combo_customers_phone_lookup
 on public.haus_combo_customers(whatsapp_digits);
-- Existing SQL function, preserved from production with only identity matching changed.
CREATE OR REPLACE FUNCTION public.haus_combo_create(p_request_id uuid, p_customer_name text, p_whatsapp text, p_plan_id text, p_start_date date, p_payments jsonb, p_cash_received_cents integer DEFAULT NULL::integer, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 -- Número de telefone é dado de contato, não chave global da identidade.
 -- Reutiliza o cadastro apenas quando NOME e WHATSAPP correspondem explicitamente.
 perform pg_advisory_xact_lock(hashtextextended('haus_combo_customer|'||lower(v_name)||'|'||v_phone,0));
 select c.id into v_customer from public.haus_combo_customers c
   where lower(btrim(c.full_name))=lower(v_name) and c.whatsapp_digits=v_phone
   order by c.created_at asc limit 1;
 if v_customer is null then
   insert into public.haus_combo_customers(full_name,whatsapp_digits)
   values(v_name,v_phone) returning id into v_customer;
 end if;
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
end $function$
;

revoke all on function public.haus_combo_create(uuid,text,text,text,date,jsonb,integer,text) from PUBLIC,anon,authenticated;
grant execute on function public.haus_combo_create(uuid,text,text,text,date,jsonb,integer,text) to authenticated;