# Taskly Frontend Architecture

This frontend follows a feature-first architecture on top of Next.js App Router.

## Folder Structure

```txt
app/
  layout.tsx
  page.tsx
  login/page.tsx
  signup/page.tsx
  tasks/page.tsx

components/
  ui/         reusable presentational primitives
  layout/     shared app shells/background wrappers
  common/     cross-feature generic components

features/
  landing/
  auth/
    components/
    hooks/
    services/
    login/
    signup/
  tasks/
    components/
    hooks/
    services/

hooks/        global reusable hooks
lib/
  api/        typed API client + response parsing
  auth/       session storage helpers
  utils/      pure utility helpers
  validators/ validation layer placeholder

config/       env + app metadata/constants
types/        shared domain types
styles/       global styles
tests/        test docs/placeholders
```

## Architectural Decisions

- `app/` contains route entry files only. Business/UI logic lives in `features/`.
- API calls are centralized in `lib/api`; components never call `fetch` directly.
- Session management is isolated in `lib/auth`.
- Each feature owns its components, hooks, services, and constants.
- Shared primitives are promoted to `components/` only when reused.

## Conventions

- Use alias imports (`@/…`) to avoid deep relative paths.
- Keep route pages thin: they only import feature entry components.
- Keep business logic in hooks/services, not inline in JSX.
- Keep naming explicit (no `utils2`, `temp`, `helpersNew`).
- Prefer feature-local types/constants first; promote to global `types/` only when cross-feature.

## How to Extend

1. Add new product area under `features/<name>/`.
2. Expose feature entry through `features/<name>/index.ts`.
3. Create/adjust route file in `app/` that imports the feature entry.
4. Add API methods in `lib/api` and consume them via feature services.
