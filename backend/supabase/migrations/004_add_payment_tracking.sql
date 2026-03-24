alter table public.subscriptions
  add column if not exists provider_payment_id text;

create index if not exists idx_subscriptions_provider_order
  on public.subscriptions (provider, provider_order_id)
  where provider_order_id is not null;

create unique index if not exists idx_subscriptions_provider_payment
  on public.subscriptions (provider, provider_payment_id)
  where provider_payment_id is not null;

create or replace function public.sync_user_plan_type()
returns trigger
language plpgsql
as $$
declare
  effective_plan public.plan_type;
begin
  select s.plan_type
    into effective_plan
    from public.subscriptions s
   where s.user_id = new.user_id
     and s.subscription_status in ('trialing', 'active')
     and s.payment_status = 'paid'
   order by
     case s.plan_type
       when 'team' then 2
       when 'pro' then 1
       else 0
     end desc,
     s.updated_at desc
   limit 1;

  update public.users
     set plan_type = coalesce(effective_plan, 'free'),
         updated_at = now()
   where id = new.user_id;

  return new;
end;
$$;
