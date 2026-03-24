# Web App

This is the Next.js app-router frontend for AI PPT Maker.

## Included

- Supabase auth provider and session-aware navigation
- Plan-aware create flow for Topic, Notes, and PDF generation
- Saved presentation history with preview summaries and download links
- Pricing page wired to backend Razorpay order creation and verification
- Tailwind-based dark design system and reusable layout/UI components

## Environment Variables

Copy `web/.env.example` to `web/.env.local` and set:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Run

```bash
corepack pnpm install
corepack pnpm --dir web dev
```

## Verification

```bash
corepack pnpm --dir web lint
corepack pnpm --dir web typecheck
corepack pnpm --dir web build
```

## Notes

- The production build succeeds today, but Next.js still prints optional `ws` warnings from Supabase's realtime dependency chain.
- Web payments are handled here; the mobile app currently routes upgrades to the web pricing flow.
