# AI PPT Maker Backend

This backend is the source of truth for auth-aware plan checks, AI content generation, PPT export, saved history, and payment upgrades.

## Included Structure

- `app/api/routes/`: FastAPI route handlers
- `app/config/`: typed environment-driven settings
- `app/core/`: app factory and startup wiring
- `app/integrations/`: reusable third-party client helpers
- `app/models/`: internal domain models
- `app/repositories/`: Supabase read/write helpers
- `app/schemas/`: request, response, and database row schemas
- `app/services/`: business logic for auth, plans, generation, export, and payments
- `assets/templates/`: PPT template catalog
- `storage/presentations/`: locally generated PPT files
- `supabase/migrations/`: SQL schema and follow-up migrations
- `tests/`: backend test suite

## Main Integrations

- Supabase Auth, database, and storage
- OpenAI structured content generation
- `python-pptx` export pipeline
- Razorpay order creation and payment verification

## Environment Variables

Copy `.env.example` to `.env` and set the required values for:

- app mode and docs
- CORS origins
- Supabase URL, service role key, and bucket names
- OpenAI API key and model
- Razorpay key ID, secret, currency, and monthly amount

## Local Run

```bash
py -m venv .venv
.venv\Scripts\python -m pip install -e .[dev]
.venv\Scripts\python -m uvicorn app.main:app --reload
```

The API health check is available at `GET /api/v1/health`.

## Verification

```bash
.venv\Scripts\python -m ruff check app tests
.venv\Scripts\python -m pytest
```
