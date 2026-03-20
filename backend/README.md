# AI PPT Maker Backend

This backend is set up as a production-oriented FastAPI service for AI PPT Maker.

## Included Structure

- `app/api/routes/`: HTTP routes such as the health endpoint
- `app/config/`: typed environment-driven settings
- `app/core/`: app factory and logging setup
- `app/integrations/`: reusable third-party client helpers
- `app/models/`: internal domain models
- `app/repositories/`: data access helpers and query logic
- `app/schemas/`: API request and response schemas
- `app/services/`: integration-facing business logic
- `app/utils/`: shared helper functions
- `assets/templates/`: PowerPoint template files for `python-pptx`
- `storage/presentations/`: generated output location
- `supabase/migrations/`: SQL schema and future database migrations
- `tests/`: backend tests

## Integrations Prepared

- Supabase configuration and client bootstrap
- OpenAI configuration and client bootstrap
- `python-pptx` setup for generating presentation files

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you need.

Supabase integration uses `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SCHEMA`,
and the storage bucket names defined in `.env.example`.

## Local Run

From `backend/`:

```bash
py -m venv .venv
.venv\Scripts\python -m pip install -e .[dev]
.venv\Scripts\python -m uvicorn app.main:app --reload
```

The health check will be available at `GET /api/v1/health`.
