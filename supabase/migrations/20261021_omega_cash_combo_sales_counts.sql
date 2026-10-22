-- HAUS | Count paid service bookings and combo contracts once, even when payment is split.
-- Monetary totals and historical cash entries are not modified.
CREATE OR REPLACE FUNCTION public.get_cash_dashboard()
 RETURNS TABLE(business_date date, cash_status text, today_received_cents bigint, today_received_count bigint, today_expected_cents bigint, today_expected_count bigint, month_total_cents bigint, month_received_count bigint, year_total_cents bigint, year_received_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_today date;
  v_cash_status text;
begin
  if not public.is_admin() then
    raise exception
      'Acesso não autorizado.';
  end if;

  v_today :=
    timezone(
      'America/Sao_Paulo',
      now()
    )::date;

  select
    cs.status
  into
    v_cash_status
  from
    public.cash_sessions cs
  where
    cs.business_date = v_today
  limit 1;

  return query
  select
    v_today as business_date,

    coalesce(
      v_cash_status,
      'not_opened'
    )::text as cash_status,

    coalesce(
      (
        select
          sum(
            case
              when ce.entry_type in (
                'sale',
                'adjustment_in'
              )
                then ce.amount_cents

              when ce.entry_type in (
                'refund',
                'adjustment_out'
              )
                then -ce.amount_cents

              else 0
            end
          )
        from
          public.cash_entries ce

        join
          public.cash_sessions cs
            on cs.id = ce.session_id

        where
          cs.business_date = v_today
      ),
      0
    )::bigint
      as today_received_cents,

    coalesce(
      (
        select
          count(distinct coalesce(ce.booking_id::text,ce.haus_combo_membership_id::text))

        from
          public.cash_entries ce

        join
          public.cash_sessions cs
            on cs.id = ce.session_id

        where
          cs.business_date = v_today

          and ce.entry_type = 'sale'
      ),
      0
    )::bigint
      as today_received_count,

    coalesce(
      (
        select
          sum(
            b.service_amount_cents
          )

        from
          public.bookings b

        where
          b.booking_date = v_today

          and b.status = 'confirmed'

          and b.payment_status = 'unpaid'
      ),
      0
    )::bigint
      as today_expected_cents,

    coalesce(
      (
        select
          count(*)

        from
          public.bookings b

        where
          b.booking_date = v_today

          and b.status = 'confirmed'

          and b.payment_status = 'unpaid'
      ),
      0
    )::bigint
      as today_expected_count,

    coalesce(
      (
        select
          sum(
            case
              when ce.entry_type in (
                'sale',
                'adjustment_in'
              )
                then ce.amount_cents

              when ce.entry_type in (
                'refund',
                'adjustment_out'
              )
                then -ce.amount_cents

              else 0
            end
          )

        from
          public.cash_entries ce

        join
          public.cash_sessions cs
            on cs.id = ce.session_id

        where
          extract(
            year
            from cs.business_date
          ) =
          extract(
            year
            from v_today
          )

          and extract(
            month
            from cs.business_date
          ) =
          extract(
            month
            from v_today
          )
      ),
      0
    )::bigint
      as month_total_cents,

    coalesce(
      (
        select
          count(distinct coalesce(ce.booking_id::text,ce.haus_combo_membership_id::text))

        from
          public.cash_entries ce

        join
          public.cash_sessions cs
            on cs.id = ce.session_id

        where
          ce.entry_type = 'sale'

          and extract(
            year
            from cs.business_date
          ) =
          extract(
            year
            from v_today
          )

          and extract(
            month
            from cs.business_date
          ) =
          extract(
            month
            from v_today
          )
      ),
      0
    )::bigint
      as month_received_count,

    coalesce(
      (
        select
          sum(
            case
              when ce.entry_type in (
                'sale',
                'adjustment_in'
              )
                then ce.amount_cents

              when ce.entry_type in (
                'refund',
                'adjustment_out'
              )
                then -ce.amount_cents

              else 0
            end
          )

        from
          public.cash_entries ce

        join
          public.cash_sessions cs
            on cs.id = ce.session_id

        where
          extract(
            year
            from cs.business_date
          ) =
          extract(
            year
            from v_today
          )
      ),
      0
    )::bigint
      as year_total_cents,

    coalesce(
      (
        select
          count(distinct coalesce(ce.booking_id::text,ce.haus_combo_membership_id::text))

        from
          public.cash_entries ce

        join
          public.cash_sessions cs
            on cs.id = ce.session_id

        where
          ce.entry_type = 'sale'

          and extract(
            year
            from cs.business_date
          ) =
          extract(
            year
            from v_today
          )
      ),
      0
    )::bigint
      as year_received_count;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_cash_month_daily(p_year integer, p_month integer)
 RETURNS TABLE(business_date date, cash_status text, opened_at timestamp with time zone, closed_at timestamp with time zone, sales_count bigint, gross_cents bigint, refunds_cents bigint, net_cents bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception
      'Acesso não autorizado.';
  end if;

  if p_month < 1
     or p_month > 12 then
    raise exception
      'Mês inválido.';
  end if;

  return query
  select
    cs.business_date,

    cs.status,

    cs.opened_at,

    cs.closed_at,

    count(distinct coalesce(ce.booking_id::text,ce.haus_combo_membership_id::text)) filter (
      where ce.entry_type =
        'sale'
    )::bigint,

    coalesce(
      sum(
        ce.amount_cents
      ) filter (
        where ce.entry_type in (
          'sale',
          'adjustment_in'
        )
      ),
      0
    )::bigint,

    coalesce(
      sum(
        ce.amount_cents
      ) filter (
        where ce.entry_type in (
          'refund',
          'adjustment_out'
        )
      ),
      0
    )::bigint,

    coalesce(
      sum(
        case
          when ce.entry_type in (
            'sale',
            'adjustment_in'
          )
            then ce.amount_cents
          when ce.entry_type in (
            'refund',
            'adjustment_out'
          )
            then -ce.amount_cents
          else 0
        end
      ),
      0
    )::bigint

  from public.cash_sessions cs

  left join public.cash_entries ce
    on ce.session_id =
       cs.id

  where
    extract(
      year
      from cs.business_date
    )::integer =
      p_year

    and extract(
      month
      from cs.business_date
    )::integer =
      p_month

  group by
    cs.id,
    cs.business_date,
    cs.status,
    cs.opened_at,
    cs.closed_at

  order by
    cs.business_date;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_cash_year_monthly(p_year integer)
 RETURNS TABLE(month_number integer, sales_count bigint, gross_cents bigint, refunds_cents bigint, net_cents bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception
      'Acesso não autorizado.';
  end if;

  return query
  with months as (
    select
      generate_series(
        1,
        12
      )::integer
        as month_number
  ),

  totals as (
    select
      extract(
        month
        from cs.business_date
      )::integer
        as month_number,

      count(distinct coalesce(ce.booking_id::text,ce.haus_combo_membership_id::text)) filter (
        where ce.entry_type =
          'sale'
      )::bigint
        as sales_count,

      coalesce(
        sum(
          ce.amount_cents
        ) filter (
          where ce.entry_type in (
            'sale',
            'adjustment_in'
          )
        ),
        0
      )::bigint
        as gross_cents,

      coalesce(
        sum(
          ce.amount_cents
        ) filter (
          where ce.entry_type in (
            'refund',
            'adjustment_out'
          )
        ),
        0
      )::bigint
        as refunds_cents,

      coalesce(
        sum(
          case
            when ce.entry_type in (
              'sale',
              'adjustment_in'
            )
              then ce.amount_cents

            when ce.entry_type in (
              'refund',
              'adjustment_out'
            )
              then -ce.amount_cents

            else 0
          end
        ),
        0
      )::bigint
        as net_cents

    from public.cash_sessions cs

    left join public.cash_entries ce
      on ce.session_id =
         cs.id

    where
      extract(
        year
        from cs.business_date
      )::integer =
        p_year

    group by
      extract(
        month
        from cs.business_date
      )
  )

  select
    m.month_number,

    coalesce(
      t.sales_count,
      0
    )::bigint,

    coalesce(
      t.gross_cents,
      0
    )::bigint,

    coalesce(
      t.refunds_cents,
      0
    )::bigint,

    coalesce(
      t.net_cents,
      0
    )::bigint

  from months m

  left join totals t
    on t.month_number =
       m.month_number

  order by
    m.month_number;
end;
$function$
;