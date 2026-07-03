<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-rules -->

# Esusu Project Rules

## Task Assignments
- `TASKS-FRONTEND.md` — frontend work split: user handles auth/dashboard/circles/wallet, coderheem handles static pages
- `TASKS-BACKEND.md` — backend work split: El handles more tasks, Richard handles fewer

## UI Rules
Read `UI-RULES.md` before writing any frontend code. Key constraints:
- Colors: gold (#FCC800) / black / white only — use CSS variables, no hardcoded Tailwind colors
- No shadows, no glow, no zoom on hover, minimal animation
- shadcn components first, hugeicons only
- Flat design, clean borders, generous spacing
- PWA: serwist configured, manifest at `/manifest.json`

## Backend Rules
Read `BACKEND-RULES.md` before writing any backend code. Key constraints:
- When replacing static stubs with live API data, **never modify the HTML structure, CSS classes, CSS IDs, or styling** — the frontend dev's markup is final
- Only swap the data source — leave the template untouched
- All API calls go through `src/lib/api.ts` — no inline fetch/axios in components
- Drizzle ORM for all database work; proper Zod validation on all inputs
- Consistent `ApiResponse` format for every endpoint

## Naming Convention
- **Use camelCase everywhere** — types, API route responses, api.ts types, Zod fields, frontend components, everything
- No snake_case in JS/TS code (DB column names in `schema.ts` use snake_case SQL conventions, but Drizzle property access is camelCase)
- Before building, run `rg '[a-z]+_[a-z]+' src/ --include='*.ts' --include='*.tsx' --glob='!src/db/**'` to catch leftover snake_case
<!-- END:project-rules -->
