# AI PPT Maker Database Design

This database design targets Supabase Postgres and keeps the first version small while still being production-friendly.

## Core Relationships

- `users` is the app profile table and mirrors `auth.users` through database triggers.
- `presentations.user_id` points to `users.id`.
- `presentations.template_id` points to `templates.id`.
- `usage_logs.user_id` points to `users.id`.
- `subscriptions.user_id` points to `users.id`.

## Table Intent

### `users`

- Stores the app-level profile record for each authenticated user.
- Keeps the current `plan_type` close to the user for fast authorization and feature checks.
- Uses `created_at` and `updated_at` for lifecycle tracking.

### `templates`

- Stores reusable PPT themes and generation presets.
- `config` is `jsonb` so template settings can evolve without frequent migrations.
- `is_pro_only` supports plan-based gating in the app.

### `presentations`

- Stores generated deck metadata plus the generated `content` JSON.
- `mode` distinguishes topic, notes, and PDF generation flows.
- `file_url` points to the exported file in storage.
- `watermark_applied` stores whether the exported deck included the free-plan footer watermark.

### `usage_logs`

- Designed as a daily aggregate table instead of a pure event stream.
- One row represents one user, one action, and one UTC day.
- `request_count` and `free_limit` make free-tier limit checks simple with an upsert-based write path.

### `subscriptions`

- Stores billing plan history and payment state.
- Keeps both `plan_type` and payment/subscription lifecycle fields for auditing.
- A trigger updates `users.plan_type` when an active subscription changes.

## Index Strategy

- `users(plan_type)` supports plan-gated queries and admin reporting.
- `templates(is_active, is_pro_only)` supports template browsing.
- `presentations(user_id, created_at desc)` supports dashboard listing.
- `presentations(mode, status)` supports operational queries.
- `usage_logs(user_id, action, usage_date)` is unique for daily limit upserts.
- `subscriptions(user_id, subscription_status, payment_status)` supports account and billing views.

## Supabase Notes

- The SQL migration includes RLS policies for user-owned tables.
- `templates` is readable by both `anon` and `authenticated` clients when active.
- `users` is synced from `auth.users` with triggers so backend code can rely on `public.users`.
