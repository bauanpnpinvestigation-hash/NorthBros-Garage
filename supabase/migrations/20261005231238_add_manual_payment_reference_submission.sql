create or replace function public.submit_manual_payment_reference(
  p_payment_id uuid,
  p_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_customer_id uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_reference text := nullif(trim(p_reference), '');
begin
  if v_customer_id is null then
    raise exception using errcode='42501', message='Authentication required.';
  end if;

  if p_payment_id is null or v_reference is null then
    raise exception using errcode='22023', message='Payment and payment reference are required.';
  end if;

  if length(v_reference) > 120 then
    raise exception using errcode='22023', message='Payment reference is too long.';
  end if;

  select p.*
    into v_payment
  from public.payments p
  join public.orders o on o.id = p.order_id
  where p.id = p_payment_id
    and o.customer_id = v_customer_id
  for update;

  if not found then
    raise exception using errcode='42501', message='Payment not found or not owned by the signed-in customer.';
  end if;

  if v_payment.status <> 'pending' then
    raise exception using errcode='22023', message='This payment is no longer awaiting manual verification.';
  end if;

  update public.payments
  set provider_reference = v_reference,
      metadata = coalesce(metadata, '{}'::jsonb)
        || jsonb_build_object(
          'customer_submitted_reference', v_reference,
          'customer_submitted_at', now()
        ),
      updated_at = now()
  where id = p_payment_id;

  return jsonb_build_object(
    'ok', true,
    'payment_id', p_payment_id,
    'status', 'pending',
    'reference_submitted', true
  );
end;
$function$;

revoke all on function public.submit_manual_payment_reference(uuid,text) from public;
grant execute on function public.submit_manual_payment_reference(uuid,text) to authenticated;
