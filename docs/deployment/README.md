# Deployment Guide

This guide covers the production environment variables and deployment flow for the AI PPT Maker stack.

## Production Environment Variables

### Backend

Required:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `DOCS_ENABLED=false` or `true` depending on how public you want docs to be
- `CORS_ALLOWED_ORIGINS=["https://your-web-app.vercel.app"]`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PRESENTATIONS_BUCKET=presentations`
- `SUPABASE_TEMPLATES_BUCKET=templates`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `FREE_TOPIC_DAILY_LIMIT=3`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_CURRENCY=INR`
- `RAZORPAY_PRO_MONTHLY_AMOUNT=99900`

Optional:

- `SUPABASE_ANON_KEY`
- `SUPABASE_SCHEMA=public`
- `PPT_TEMPLATE_DIR`
- `TEMPLATE_CATALOG_PATH`
- `GENERATED_PPT_DIR`

### Web

- `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain/api/v1`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Mobile

- `EXPO_PUBLIC_API_BASE_URL=https://your-backend-domain/api/v1`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_APP_URL=https://your-web-app.vercel.app/pricing`

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL migrations in order from `backend/supabase/migrations/`.
3. Create the `presentations` and `templates` storage buckets.
4. Configure Supabase Auth redirect URLs for your web domain.
5. Copy the project URL, anon key, and service role key into the backend and client environments.

## Backend Deployment: Render or Railway

1. Create a new service pointing at the repo and set the root directory to `backend`.
2. Build command:

   ```bash
   pip install -e .
   ```

3. Start command:

   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

4. Add the backend environment variables listed above.
5. Set `CORS_ALLOWED_ORIGINS` to the final web domain in JSON or comma-separated format.
6. Deploy and verify `GET /api/v1/health`.

## Web Deployment: Vercel

1. Import the repo into Vercel.
2. Set the project root to `web`.
3. Add the web environment variables.
4. Deploy and verify:
   - login/signup
   - `/create` generation flows
   - `/history` saved downloads
   - `/pricing` checkout flow

## Mobile Release Notes

The Expo app is ready for local development and typechecked configuration. For production mobile delivery, add your preferred EAS build and release workflow after finalizing app icons, splash assets, and native payment decisions.

## Audit Notes

Known remaining gaps:

- Mobile pricing currently opens the web checkout flow instead of using a native Razorpay SDK.
- The web production build succeeds, but Next.js still prints optional `ws` warnings from Supabase realtime dependencies.
- Payment upgrades are implemented as app-side verify calls; if you need renewal handling or webhook-grade reconciliation, add Razorpay webhooks next.
- End-to-end tests for auth and payment flows are still missing across web and mobile.
