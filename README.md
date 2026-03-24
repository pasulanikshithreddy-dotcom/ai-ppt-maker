# AI PPT Maker Monorepo

AI PPT Maker is organized as a solo-developer monorepo with a FastAPI backend, a Next.js web app, an Expo mobile app, and project docs.

## Structure

```text
.
|-- backend/
|-- docs/
|-- mobile/
|-- web/
|-- .gitignore
|-- package.json
`-- pnpm-workspace.yaml
```

## What Is Included

- FastAPI backend with Supabase, OpenAI, `python-pptx`, usage limits, history, and Razorpay upgrade flow
- Next.js web app with Supabase auth, plan-aware create flow, history, pricing, and template gating
- Expo mobile app with Supabase auth, Topic and Notes generation, history, pricing, and profile screens
- Deployment and architecture docs in `docs/`

## Local Setup

1. Install JavaScript workspace dependencies:

   ```bash
   corepack pnpm install
   ```

2. Backend setup:

   ```bash
   cd backend
   py -m venv .venv
   .venv\Scripts\python -m pip install -e .[dev]
   .venv\Scripts\python -m uvicorn app.main:app --reload
   ```

3. Web setup:

   ```bash
   copy web\.env.example web\.env.local
   corepack pnpm --dir web dev
   ```

4. Mobile setup:

   ```bash
   copy mobile\.env.example mobile\.env
   corepack pnpm --dir mobile dev
   ```

## Useful Commands

- `corepack pnpm --dir web lint`
- `corepack pnpm --dir web typecheck`
- `corepack pnpm --dir mobile typecheck`
- `backend\.venv\Scripts\python.exe -m ruff check app tests`
- `backend\.venv\Scripts\python.exe -m pytest`

## Deployment

Deployment steps and production env docs live in `docs/deployment/README.md`.

## Solo Developer Notes

- Keep the backend as the source of truth for plans, limits, template access, and generation history.
- Keep web and mobile thin: auth, forms, preview, and download links should call the backend rather than duplicate logic.
- Capture architecture and deployment decisions in `docs/` as the product evolves.
