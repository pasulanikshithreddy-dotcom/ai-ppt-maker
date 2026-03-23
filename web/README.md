# Web App

This is the Next.js web app for AI PPT Maker, built with the app router and Tailwind CSS.

## Included

- App router setup with `app/layout.tsx` and `app/page.tsx`
- Tailwind CSS with a dark, student-friendly design system
- Reusable `components/layout`, `components/marketing`, and `components/ui` folders
- Environment variable helpers in `lib/env.ts`
- Supabase auth placeholders in `lib/supabase/client.ts`
- Backend API placeholders in `lib/api/backend.ts`

## Environment Variables

Copy `web/.env.example` to `web/.env.local` and fill in:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Run

```bash
corepack pnpm install
corepack pnpm --dir web dev
```

## Next Steps

- Add real auth pages and session-aware navigation
- Connect dashboard and generation flows to the FastAPI backend
- Build template gallery, editor, and export screens on top of the shared UI structure
