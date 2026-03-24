# Mobile App

This is the Expo Router mobile app for AI PPT Maker.

## Included

- Expo Router navigation with authenticated tabs
- Supabase auth integration for login, signup, and logout
- Topic to PPT and Notes to PPT generation wired to the FastAPI backend
- Saved history, pricing, and profile screens
- Reusable native UI building blocks in `src/components/ui`

## Environment Variables

Copy `mobile/.env.example` to `mobile/.env` and set:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_APP_URL`

## Run

```bash
corepack pnpm install
corepack pnpm --dir mobile dev
```

## Verification

```bash
corepack pnpm --dir mobile typecheck
```

## Notes

- Mobile currently supports Topic and Notes generation first, plus saved history and plan-aware UI.
- Pricing on mobile opens the web checkout flow instead of using a native Razorpay SDK.
