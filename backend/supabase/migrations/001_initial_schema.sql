create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_type') then
    create type public.plan_type as enum ('free', 'pro', 'team');
  end if;

  if not exists (select 1 from pg_type where typname = 'presentation_mode') then
    create type public.presentation_mode as enum ('topic', 'notes', 'pdf');
  end if;

  if not exists (select 1 from pg_type where typname = 'presentation_status') then
    create type public.presentation_status as enum ('queued', 'processing', 'completed', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum (
      'trialing',
      'active',
      'past_due',
      'cancelled',
      'expired'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum (
      'pending',
      'paid',
      'failed',
      'refunded',
      'cancelled'
    );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  plan_type public.plan_type not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  config jsonb not null default '{}'::jsonb,
  is_pro_only boolean not null default false,
  is_active boolean not null default true,
  preview_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_name_not_blank check (char_length(trim(name)) > 0),
  constraint templates_config_is_json_object check (jsonb_typeof(config) = 'object')
);

create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  mode public.presentation_mode not null,
  status public.presentation_status not null default 'queued',
  topic text,
  content jsonb not null default '{}'::jsonb,
  file_url text,
  has_watermark boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presentations_content_is_valid_json check (
    jsonb_typeof(content) = 'object' or jsonb_typeof(content) = 'array'
  ),
  constraint presentations_topic_required_for_topic_mode check (
    mode <> 'topic' or topic is not null
  )
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  usage_date date not null default ((now() at time zone 'utc')::date),
  request_count integer not null default 0,
  free_limit integer not null default 3,
  metadata jsonb not null default '{}'::jsonb,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usage_logs_action_not_blank check (char_length(trim(action)) > 0),
  constraint usage_logs_request_count_non_negative check (request_count >= 0),
  constraint usage_logs_free_limit_non_negative check (free_limit >= 0),
  constraint usage_logs_metadata_is_json_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_type public.plan_type not null,
  provider text not null default 'razorpay',
  provider_customer_id text,
  provider_subscription_id text,
  provider_order_id text,
  payment_status public.payment_status not null default 'pending',
  subscription_status public.subscription_status not null default 'trialing',
  amount integer not null default 0,
  currency text not null default 'INR',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_amount_non_negative check (amount >= 0),
  constraint subscriptions_currency_is_iso_code check (char_length(trim(currency)) = 3)
);

create index if not exists idx_users_plan_type
  on public.users (plan_type);

create index if not exists idx_users_created_at
  on public.users (created_at desc);

create index if not exists idx_templates_active_pro
  on public.templates (is_active, is_pro_only);

create index if not exists idx_templates_config_gin
  on public.templates using gin (config jsonb_path_ops);

create index if not exists idx_presentations_user_created_at
  on public.presentations (user_id, created_at desc);

create index if not exists idx_presentations_template_id
  on public.presentations (template_id);

create index if not exists idx_presentations_mode_status
  on public.presentations (mode, status);

create index if not exists idx_presentations_content_gin
  on public.presentations using gin (content jsonb_path_ops);

create unique index if not exists idx_usage_logs_user_action_day
  on public.usage_logs (user_id, action, usage_date);

create index if not exists idx_usage_logs_usage_date
  on public.usage_logs (usage_date desc);

create index if not exists idx_subscriptions_user_status
  on public.subscriptions (user_id, subscription_status, payment_status);

create unique index if not exists idx_subscriptions_provider_subscription
  on public.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;

create unique index if not exists idx_subscriptions_single_active_plan
  on public.subscriptions (user_id)
  where subscription_status in ('trialing', 'active');

create or replace function public.sync_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, plan_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    'free'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, users.full_name),
        updated_at = now();

  return new;
end;
$$;

create or replace function public.sync_user_plan_type()
returns trigger
language plpgsql
as $$
begin
  if new.subscription_status in ('trialing', 'active')
     and new.payment_status in ('pending', 'paid') then
    update public.users
       set plan_type = new.plan_type,
           updated_at = now()
     where id = new.user_id;
  elsif new.subscription_status in ('cancelled', 'expired') then
    update public.users
       set plan_type = 'free',
           updated_at = now()
     where id = new.user_id
       and not exists (
         select 1
           from public.subscriptions s
          where s.user_id = new.user_id
            and s.id <> new.id
            and s.subscription_status in ('trialing', 'active')
            and s.payment_status in ('pending', 'paid')
       );
  end if;

  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists set_templates_updated_at on public.templates;
create trigger set_templates_updated_at
before update on public.templates
for each row
execute function public.set_updated_at();

drop trigger if exists set_presentations_updated_at on public.presentations;
create trigger set_presentations_updated_at
before update on public.presentations
for each row
execute function public.set_updated_at();

drop trigger if exists set_usage_logs_updated_at on public.usage_logs;
create trigger set_usage_logs_updated_at
before update on public.usage_logs
for each row
execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.sync_auth_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update on auth.users
for each row
execute function public.sync_auth_user();

drop trigger if exists on_subscription_changed on public.subscriptions;
create trigger on_subscription_changed
after insert or update of plan_type, payment_status, subscription_status
on public.subscriptions
for each row
execute function public.sync_user_plan_type();

alter table public.users enable row level security;
alter table public.templates enable row level security;
alter table public.presentations enable row level security;
alter table public.usage_logs enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Templates are visible to clients" on public.templates;
create policy "Templates are visible to clients"
on public.templates
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Users can read their own presentations" on public.presentations;
create policy "Users can read their own presentations"
on public.presentations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own presentations" on public.presentations;
create policy "Users can create their own presentations"
on public.presentations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own presentations" on public.presentations;
create policy "Users can update their own presentations"
on public.presentations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own presentations" on public.presentations;
create policy "Users can delete their own presentations"
on public.presentations
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their own usage logs" on public.usage_logs;
create policy "Users can read their own usage logs"
on public.usage_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their own subscriptions" on public.subscriptions;
create policy "Users can read their own subscriptions"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);
