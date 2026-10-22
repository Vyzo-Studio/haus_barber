-- HAUS-007 | Read-only, paginated combo management beyond 700 records.
-- New RPCs only. The original summary remains available for older clients.

create index if not exists haus_combo_memberships_listing_idx
  on public.haus_combo_memberships(created_at desc,id desc);
create index if not exists haus_combo_customers_phone_idx
  on public.haus_combo_customers(whatsapp_digits);

create or replace function public.haus_combo_admin_catalog()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not coalesce(public.is_admin(),false) then
   raise exception 'Acesso administrativo obrigatório.';
 end if;
 return jsonb_build_object(
   'plans',coalesce((select jsonb_agg(to_jsonb(p) order by p.sort_order)
     from public.haus_combo_plans p where p.active),'[]'::jsonb),
   'barbers',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name) order by b.name)
     from public.haus_barbers b where b.active),'[]'::jsonb)
 );
end $$;

create or replace function public.haus_combo_admin_list(
 p_page integer default 1,
 p_page_size integer default 30,
 p_search text default '',
 p_filter text default 'all'
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_result jsonb;
 v_search text:=left(btrim(coalesce(p_search,'')),100);
 v_digits text:=regexp_replace(left(btrim(coalesce(p_search,'')),100),'[^0-9]','','g');
 v_today date:=timezone('America/Sao_Paulo',now())::date;
begin
 if not coalesce(public.is_admin(),false) then
   raise exception 'Acesso administrativo obrigatório.';
 end if;
 if p_page is null or p_page < 1 or p_page>100000
   or p_page_size is null or p_page_size not between 1 and 100 then
   raise exception 'Paginação fora dos limites permitidos.';
 end if;
 if p_filter is null or p_filter not in
   ('all','active','expiring','complete','expired','canceled')
 then raise exception 'Filtro inválido.'; end if;

 with all_rows as materialized (
   select m.id,m.customer_id,m.plan_id,m.plan_name,m.price_cents,
     m.cuts_total,m.beards_total,m.brows_total,
     m.start_date,m.expires_on,m.status,m.notes,m.created_at,
     c.full_name,c.whatsapp_digits,
     coalesce(u.cuts_used,0) cuts_used,
     coalesce(u.beards_used,0) beards_used,
     coalesce(u.brows_used,0) brows_used,
     greatest(0,m.expires_on-v_today) days_left,
     case
       when m.status='canceled' then 'canceled'
       when m.start_date>v_today then 'upcoming'
       when v_today>=m.expires_on then 'expired'
       when coalesce(u.cuts_used,0)>=m.cuts_total
        and coalesce(u.beards_used,0)>=m.beards_total
        and coalesce(u.brows_used,0)>=m.brows_total then 'complete'
       when m.expires_on-v_today<=7 then 'expiring'
       else 'active'
     end as status_key
   from public.haus_combo_memberships m
   join public.haus_combo_customers c on c.id=m.customer_id
   left join lateral (
     select count(*) filter(where x.kind='cut')::integer cuts_used,
            count(*) filter(where x.kind='beard')::integer beards_used,
            count(*) filter(where x.kind='brows')::integer brows_used
     from public.haus_combo_uses x
     where x.membership_id=m.id and x.voided_at is null
   ) u on true
 ),
 filtered as (
   select * from all_rows r
   where (
    (p_filter='all' and r.status_key<>'canceled')
    or (p_filter='active' and r.status_key in ('active','upcoming','expiring'))
    or (p_filter not in ('all','active') and r.status_key=p_filter)
   )
   and (
     v_search=''
     or r.full_name ilike '%'||v_search||'%'
     or r.plan_name ilike '%'||v_search||'%'
     or (char_length(v_digits)>=3 and r.whatsapp_digits like '%'||v_digits||'%')
   )
 ),
 page_rows as (
   select * from filtered
   order by created_at desc,id desc
   limit p_page_size offset (p_page-1)*p_page_size
 )
 select jsonb_build_object(
   'page',p_page,
   'page_size',p_page_size,
   'total', (select count(*) from filtered),
   'memberships',coalesce((
     select jsonb_agg(to_jsonb(r) order by r.created_at desc,r.id desc) from page_rows r
   ),'[]'::jsonb),
   'stats',(
     select jsonb_build_object(
       'active',count(*) filter(where r.status_key in ('active','upcoming','expiring')),
       'expiring',count(*) filter(where r.status_key='expiring'),
       'complete',count(*) filter(where r.status_key='complete'),
       'expired',count(*) filter(where r.status_key='expired'),
       'canceled',count(*) filter(where r.status_key='canceled')
     ) from all_rows r
   )
 ) into v_result;
 return v_result;
end $$;

revoke all on function public.haus_combo_admin_catalog() from public,anon,authenticated;
revoke all on function public.haus_combo_admin_list(integer,integer,text,text) from public,anon,authenticated;
grant execute on function public.haus_combo_admin_catalog() to authenticated;
grant execute on function public.haus_combo_admin_list(integer,integer,text,text) to authenticated;
