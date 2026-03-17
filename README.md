# AI PPT Maker Monorepo

This repository is organized as a lightweight monorepo for a solo developer building AI PPT Maker across web, mobile, backend, and documentation.

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

- A clean folder layout for each product surface
- Root workspace files ready for the JavaScript apps (`web` and `mobile`)
- README files throughout the repo so each area has a clear purpose
- Git ignore rules for common web, mobile, Python, and editor artifacts

## Setup Plan

1. Bootstrap the web app inside `web/` with Next.js.
2. Bootstrap the mobile app inside `mobile/` with Expo.
3. Create the FastAPI service inside `backend/`.
4. Add shared conventions for API contracts, environment variables, and deployment.
5. Expand `docs/` with product notes, architecture decisions, and launch checklists.

## Scaffolding Note

The folders in this repo are intentionally pre-created and documented. When you scaffold the actual apps, add the framework files directly into these folders or generate into a temporary location and merge the results back in.

## Solo Developer Conventions

- Keep app-specific code inside its own folder and avoid cross-project leakage.
- Document decisions in `docs/architecture/` as the product evolves.
- Treat the backend as the source of truth for AI orchestration and export jobs.
- Add shared packages only when duplication becomes real, not preemptively.
