# AI PPT Maker Backend

This backend is set up as a production-oriented FastAPI service for AI PPT Maker.

## Included Structure

- `app/api/routes/`: HTTP routes such as the health endpoint
- `app/config/`: typed environment-driven settings
- `app/core/`: app factory and logging setup
- `app/models/`: internal domain models
- `app/schemas/`: API request and response schemas
- `app/services/`: integration-facing business logic
- `app/utils/`: shared helper functions
- `assets/templates/`: PowerPoint template files for `python-pptx`
- `storage/presentations/`: generated output location
- `tests/`: backend tests

## Integrations Prepared

- Supabase configuration and client bootstrap
- OpenAI configuration and client bootstrap
- `python-pptx` setup for generating presentation files

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you need.

## Local Run

From `backend/`:

```bash
py -m venv .venv
.venv\Scripts\python -m pip install -e .[dev]
.venv\Scripts\python -m uvicorn app.main:app --reload
```

The health check will be available at `GET /api/v1/health`.
