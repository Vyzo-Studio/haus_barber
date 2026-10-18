CREATE OR REPLACE FUNCTION public.admin_register_manual_service(p_request_id uuid, p_service text, p_booking_date date, p_booking_time time without time zone, p_payment_method text, p_customer_name text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_now_local timestamp without time zone := timezone('America/Sao_Paulo', now());
  v_name text := btrim(coalesce(p_customer_name, ''));
  v_service text := btrim(coalesce(p_service, ''));
  v_method text := lower(btrim(coalesce(p_payment_method, '')));
  v_price integer;
  v_session uuid;
  v_session_status text;
  v_booking uuid;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo obrigatório.';
  end if;

  if p_request_id is null then
    raise exception 'Identificador da operação inválido.';
  end if;

  -- Repeated submissions of the same operation must never generate another sale.
  perform pg_advisory_xact_lock(
    hashtextextended('haus_manual|' || p_request_id::text, 0)
  );

  select b.id into v_booking
  from public.bookings b
  where b.manual_request_id = p_request_id;

  if v_booking is not null then
    return v_booking;
  end if;

  if v_name = '' then
    v_name := 'Cliente não informado';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Nome do cliente deve ter até 80 caracteres e ao menos 2 quando informado.';
  end if;

  -- Only canonical services from the public Haus booking form are accepted.
  if v_service not in (
    'Corte Social - R$ 20',
    'Corte Degradê - R$ 25',
    'Corte Navalhado - R$ 25',
    'Barba - R$ 20',
    'Pezinho - R$ 10',
    'Sobrancelha - R$ 5',
    'Pigmentação - R$ 20',
    'Progressiva Avulsa - R$ 50',
    'Progressiva + Corte - R$ 70',
    'Graxa / Alisante - R$ 20',
    'Luzes + Corte - R$ 110',
    'Platinado + Corte - R$ 140'
  ) then
    raise exception 'Serviço inválido.';
  end if;

  v_price := public.service_price_cents(v_service);
  if v_price is null or v_price <= 0 then
    raise exception 'Serviço sem valor válido cadastrado.';
  end if;

  if v_method not in ('cash', 'pix', 'debit', 'credit') then
    raise exception 'Forma de pagamento inválida.';
  end if;

  if p_booking_date is null or p_booking_time is null then
    raise exception 'Data e horário são obrigatórios.';
  end if;

  if p_booking_date < date '2020-01-01'
    or p_booking_date > v_now_local::date + 365 then
    raise exception 'Data fora do período permitido.';
  end if;

  if p_booking_time < time '09:00' or p_booking_time > time '20:00'
    or extract(minute from p_booking_time) not in (0,30)
    or extract(second from p_booking_time) <> 0 then
    raise exception 'Escolha um horário entre 09:00 e 20:00, de 30 em 30 minutos.';
  end if;

  -- Same lock key used by existing public booking and admin confirmation RPCs.
  perform pg_advisory_xact_lock(
    hashtextextended(p_booking_date::text || '|' || p_booking_time::text, 0)
  );

  if exists (
    select 1 from public.bookings b
    where b.booking_date = p_booking_date
      and b.booking_time = p_booking_time
      and (
        b.status = 'confirmed'
        or (b.status = 'pending' and b.expires_at > now())
      )
  ) then
    raise exception 'Já existe um atendimento ou agendamento nesse horário.';
  end if;

  insert into public.cash_sessions (
    business_date, status, opening_amount_cents,
    opened_by, opened_at, closed_by, closed_at
  ) values (
    p_booking_date,
    case when p_booking_date < v_now_local::date then 'closed' else 'open' end,
    0,
    auth.uid(), now(),
    case when p_booking_date < v_now_local::date then auth.uid() else null end,
    case when p_booking_date < v_now_local::date then now() else null end
  ) on conflict (business_date) do nothing;

  select cs.id, cs.status
    into v_session, v_session_status
  from public.cash_sessions cs
  where cs.business_date = p_booking_date
  for update;

  if v_session is null then
    raise exception 'Não foi possível localizar o caixa da data selecionada.';
  end if;

  insert into public.bookings (
    customer_name,
    service,
    booking_date,
    booking_time,
    status,
    expires_at,
    service_amount_cents,
    payment_status,
    payment_method,
    paid_at,
    completed_at,
    is_manual,
    manual_request_id
  ) values (
    v_name,
    v_service,
    p_booking_date,
    p_booking_time,
    'confirmed',
    null,
    v_price,
    'paid',
    v_method,
    now(),
    case
      when p_booking_date + p_booking_time <= v_now_local
        then (p_booking_date + p_booking_time) at time zone 'America/Sao_Paulo'
      else null
    end,
    true,
    p_request_id
  ) returning id into v_booking;

  insert into public.cash_entries (
    session_id,
    booking_id,
    entry_type,
    amount_cents,
    payment_method,
    description,
    created_by
  ) values (
    v_session,
    v_booking,
    'sale',
    v_price,
    v_method,
    case
      when p_booking_date < v_now_local::date then
        'Atendimento retroativo registrado em ' || to_char(v_now_local, 'DD/MM/YYYY HH24:MI')
      when p_booking_date > v_now_local::date then
        'Lançamento antecipado registrado em ' || to_char(v_now_local, 'DD/MM/YYYY HH24:MI')
      else
        'Atendimento lançado manualmente'
    end || case when v_session_status = 'closed' then ' (ajuste após fechamento)' else '' end,
    auth.uid()
  );

  return v_booking;
end;
$function$;

revoke all on function public.admin_register_manual_service(uuid, text, date, time without time zone, text, text) from public, anon;
grant execute on function public.admin_register_manual_service(uuid, text, date, time without time zone, text, text) to authenticated;
