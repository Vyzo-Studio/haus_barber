-- Haus Barber / financial reconciliation: read-only production facts plus append-only reviews.
-- An anomaly does not prove incorrect payment; never move historical cash entries automatically.
create table if not exists public.haus_cash_reconciliation_events(
 id uuid primary key default gen_random_uuid(),
 cash_entry_id uuid not null references public.cash_entries(id) on delete restrict,
 review_status text not null check(review_status in ('under_review','explained','requires_correction')),
 justification text not null check(char_length(btrim(justification)) between 15 and 1000),
 reviewed_by uuid not null references auth.users(id),
 reviewed_at timestamptz not null default now()
);
create index if not exists haus_reconciliation_events_by_entry
 on public.haus_cash_reconciliation_events(cash_entry_id,reviewed_at desc);
alter table public.haus_cash_reconciliation_events enable row level security;
revoke all on public.haus_cash_reconciliation_events from PUBLIC,anon,authenticated;

create or replace function public.haus_admin_cash_reconciliation()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.recorded_at desc),'[]'::jsonb)
 into v_result from (
  select ce.id,ce.booking_id,ce.amount_cents,ce.payment_method,
   ce.created_at recorded_at,
   (ce.created_at at time zone 'America/Sao_Paulo')::date recorded_on,
   cs.business_date cash_business_date,
   b.booking_date service_date,
   coalesce(review.review_status,'not_reviewed') review_status,
   review.justification,
   review.reviewed_at,
   coalesce(review.events_count,0) review_count
  from public.cash_entries ce
  join public.cash_sessions cs on cs.id=ce.session_id
  join public.bookings b on b.id=ce.booking_id
  left join lateral (
    select x.review_status,x.justification,x.reviewed_at,
     (select count(*) from public.haus_cash_reconciliation_events z where z.cash_entry_id=ce.id) events_count
    from public.haus_cash_reconciliation_events x
    where x.cash_entry_id=ce.id order by x.reviewed_at desc,x.id desc limit 1
  ) review on true
  where ce.entry_type='sale' and b.is_manual
    and (ce.created_at at time zone 'America/Sao_Paulo')::date<>cs.business_date
  order by ce.created_at desc
  limit 500
 ) t;
 return v_result;
end $$;

create or replace function public.haus_admin_record_cash_review(
 p_entry_id uuid,p_review_status text,p_justification text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
 if p_review_status not in ('under_review','explained','requires_correction') then
   raise exception 'Situação de análise inválida.'; end if;
 if char_length(btrim(coalesce(p_justification,''))) not between 15 and 1000 then
   raise exception 'Escreva uma justificativa entre 15 e 1000 caracteres.'; end if;
 if not exists (
  select 1 from public.cash_entries ce
  join public.cash_sessions cs on cs.id=ce.session_id
  join public.bookings b on b.id=ce.booking_id
  where ce.id=p_entry_id and ce.entry_type='sale' and b.is_manual
   and (ce.created_at at time zone 'America/Sao_Paulo')::date<>cs.business_date
 ) then raise exception 'Lançamento não encontrado na lista de divergências.'; end if;
 insert into public.haus_cash_reconciliation_events(cash_entry_id,review_status,justification,reviewed_by)
 values(p_entry_id,p_review_status,btrim(p_justification),auth.uid()) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.haus_admin_cash_reconciliation() from PUBLIC,anon,authenticated;
revoke all on function public.haus_admin_record_cash_review(uuid,text,text) from PUBLIC,anon,authenticated;
grant execute on function public.haus_admin_cash_reconciliation() to authenticated;
grant execute on function public.haus_admin_record_cash_review(uuid,text,text) to authenticated;
