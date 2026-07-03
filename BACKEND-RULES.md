# Backend Agent Rules — Esusu

## API Client (`src/lib/api.ts`)
- Centralized request function handles JWT injection, 401 auto-refresh, and mock mode
- All API methods go through the `api` object — do not inline fetch/axios in components
- Mock data is preserved for development; toggle with `setMockMode(true)`
- New mock handlers go in the `mockRequest` switch, new real endpoints go in the `api` object

## Replacing Stubs with Live API Data
- **Never modify the HTML structure, CSS classes, CSS IDs, or styling** when swapping a static stub for live data — the frontend dev's markup is final
- Only replace the data source (e.g., `useState` → `useQuery`, `fetch` → `api.*` call)
- If the stub used a static array, map `api.*` response fields to match the same shape the component expects
- If the stub response shape differs from the API response, transform in the component or query, not in the page template

## Route Handlers (`src/app/api/v1/`)
- Each route file owns one endpoint — no monolithic handlers
- Use `src/lib/api-response.ts` for consistent response formatting (`success`, `error`, `paginated`)
- Auth middleware from `src/lib/middleware.ts` for protected routes
- Database queries go through Drizzle (`src/db/index.ts`) — no raw SQL
- Schema is in `src/db/schema.ts` — do not hardcode table/column names

## Validation
- All user input validated with Zod schemas before reaching the database
- Validation errors return consistent `ApiResponse` shape, not raw Zod errors
- `src/lib/validations/` for shared schemas

## Error Handling
- Every handler returns a proper `ApiResponse` — never throw uncaught errors
- Use `try/catch` around DB operations, return error response for failures
- 401 for auth, 403 for forbidden, 404 for not found, 422 for validation, 500 for server errors

## External Services
- Nomba client in `src/lib/nomba.ts` — all Nomba API calls through this
- OTP service in `src/lib/otp.ts` — never inline OTP logic
- Payout service in `src/lib/payout.ts`
- Reconciliation engine in `src/lib/reconciliation.ts`

## DB & Migrations
- This project uses **Drizzle ORM** with **Neon serverless Postgres**
- Schema: `src/db/schema.ts` — run `npm run db:push` to sync, `npm run db:generate` for migration files
- Never modify the database directly — always through Drizzle
- Connection string in `.env` as `DATABASE_URL`

## Security
- BVN and PIN fields are never logged or returned in responses after verification
- JWT secrets from environment variables, not hardcoded
- Rate limiting on OTP and auth endpoints
- No sensitive data in URL params
