-- Haus Barber | Ajuste de saldo reversível e cancelamento administrativo sem apagar contratos ou caixa
-- As funções novas preservam o histórico, os pagamentos originais e todas as utilizações.

alter table public.haus_combo_memberships
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id),
  add column if not exists cancel_reason text,
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references auth.users(id),
  add column if not exists restore_reason text;

create table if not exists public.haus_combo_status_events (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.haus_combo_memberships(id) on delete restrict,
  event_type text not null check (event_type in ('canceled','restored')),
  reason text not null check (char_length(btrim(reason)) between 5 and 250),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists haus_combo_status_events_by_membership
  on public.haus_combo_status_events(membership_id,created_at desc);

alter table public.haus_combo_status_events enable row level security;
revoke all on public.haus_combo_status_events from public,anon,authenticated;

create or replace function public.haus_combo_cancel(
  p_membership_id uuid,p_reason text
) returns boolean language plpgsql security definer set search_path='' as $$
declare
  v_status text;
  v_reason text:=btrim(coalesce(p_reason,''));
begin
  if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
  if p_membership_id is null then raise exception 'Contrato obrigatório.'; end if;
  if char_length(v_reason) not between 5 and 250 then
    raise exception 'Informe um motivo de cancelamento entre 5 e 250 caracteres.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('haus_combo_membership|'||p_membership_id::text,0));
  select status into v_status
    from public.haus_combo_memberships
    where id=p_membership_id for update;
  if not found then raise exception 'Combo não encontrado.'; end if;
  if v_status='canceled' then raise exception 'Este combo já foi cancelado.'; end if;
  update public.haus_combo_memberships set
    status='canceled',cancelled_at=now(),cancelled_by=auth.uid(),cancel_reason=v_reason
  where id=p_membership_id;
  insert into public.haus_combo_status_events(membership_id,event_type,reason,created_by)
  values(p_membership_id,'canceled',v_reason,auth.uid());
  return true;
end $$;

create or replace function public.haus_combo_restore(
  p_membership_id uuid,p_reason text
) returns boolean language plpgsql security definer set search_path='' as $$
declare
  v_status text;
  v_reason text:=btrim(coalesce(p_reason,''));
begin
  if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
  if p_membership_id is null then raise exception 'Contrato obrigatório.'; end if;
  if char_length(v_reason) not between 5 and 250 then
    raise exception 'Informe um motivo de restauração entre 5 e 250 caracteres.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('haus_combo_membership|'||p_membership_id::text,0));
  select status into v_status
    from public.haus_combo_memberships
    where id=p_membership_id for update;
  if not found then raise exception 'Combo não encontrado.'; end if;
  if v_status<>'canceled' then raise exception 'Este combo não está cancelado.'; end if;
  update public.haus_combo_memberships set
    status='active',restored_at=now(),restored_by=auth.uid(),restore_reason=v_reason
  where id=p_membership_id;
  insert into public.haus_combo_status_events(membership_id,event_type,reason,created_by)
  values(p_membership_id,'restored',v_reason,auth.uid());
  return true;
end $$;

create or replace function public.haus_combo_admin_status_history(p_membership_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_events jsonb;
begin
  if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id',e.id,'event_type',e.event_type,'reason',e.reason,'created_at',e.created_at
    ) order by e.created_at desc),'[]'::jsonb)
  into v_events
  from public.haus_combo_status_events e where e.membership_id=p_membership_id;
  return v_events;
end $$;

-- Use correction must serialize with visit registration and cancellation.
create or replace function public.haus_combo_void_use(p_use_id uuid,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  v_member uuid;
  v_use uuid;
  v_reason text:=btrim(coalesce(p_reason,''));
begin
  if not coalesce(public.is_admin(),false) then raise exception 'Acesso administrativo obrigatório.'; end if;
  if p_use_id is null then raise exception 'Utilização obrigatória.'; end if;
  if char_length(v_reason) not between 5 and 250 then
    raise exception 'Informe o motivo da correção (5 a 250 caracteres).';
  end if;
  select membership_id into v_member
    from public.haus_combo_uses where id=p_use_id;
  if not found then raise exception 'Utilização não encontrada.'; end if;
  perform pg_advisory_xact_lock(hashtextextended('haus_combo_membership|'||v_member::text,0));
  update public.haus_combo_uses
    set voided_at=now(),voided_by=auth.uid(),void_reason=v_reason
    where id=p_use_id and voided_at is null
    returning id into v_use;
  if v_use is null then raise exception 'Utilização já corrigida.'; end if;
  return true;
end $$;

revoke all on function public.haus_combo_cancel(uuid,text) from PUBLIC,anon,authenticated;
revoke all on function public.haus_combo_restore(uuid,text) from PUBLIC,anon,authenticated;
revoke all on function public.haus_combo_admin_status_history(uuid) from PUBLIC,anon,authenticated;
revoke all on function public.haus_combo_void_use(uuid,text) from PUBLIC,anon,authenticated;
grant execute on function public.haus_combo_cancel(uuid,text) to authenticated;
grant execute on function public.haus_combo_restore(uuid,text) to authenticated;
grant execute on function public.haus_combo_admin_status_history(uuid) to authenticated;
grant execute on function public.haus_combo_void_use(uuid,text) to authenticated;

-- Intentionally leaves cash_entries, cash_sessions, membership price, and validity unchanged.
