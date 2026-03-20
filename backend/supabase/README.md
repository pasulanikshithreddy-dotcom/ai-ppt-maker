# Supabase Schema

This folder stores Supabase-ready SQL migrations for AI PPT Maker.

## Apply The Schema

Use the Supabase SQL editor or Supabase CLI to apply the migration in `migrations/`.

## Notes

- `public.users` mirrors `auth.users` and stores app-level profile and plan data.
- `usage_logs` is designed for fast daily free-limit checks with one row per user, action, and day.
- Row Level Security policies are included for the main user-owned tables.
