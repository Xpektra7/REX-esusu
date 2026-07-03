# UI Agent Rules — Esusu

## Brand Colors (Strict)
- **Primary:** #FFCC00 (gold/yellow)
- **Neutral:** #000000 (black), #FFFFFF (white), gray-50 to gray-900 scale
- All colors must use CSS variables from `globals.css` — no hardcoded Tailwind colors like `text-red-400`, `bg-blue-500`, `text-green-600`, etc.
- If a needed color isn't in the CSS variables, stop and ask.

## shadcn First
- Use shadcn components wherever they exist (button, card, input, form, dialog, sheet, table, badge, avatar, separator, toast, dropdown-menu, tabs, skeleton, etc.).
- Only create custom components when there's no shadcn equivalent.

## Styling Rules
- **No glow effects** — no box-shadow, drop-shadow, or blur
- **No zoom on hover** — no `hover:scale-*` or transform animations on interaction
- **No unnecessary animation** — zero or minimal. Only use transitions where essential (e.g., hover state color change).
- **Minimal design** — plenty of whitespace, clean borders, flat surfaces
- **Custom classes**: OK to create, but must only compose from existing CSS variables/Tailwind tokens. e.g., if `mx-auto h-screen p-8` repeats, extract to a custom class. But the custom class should only use tokens already defined.

## Icons
- Use **hugeicons** only — never lucide-react or any other icon set. Import from `hugeicons-react`.

## Spacing & Layout
- Generous padding: `p-6`, `p-8` for cards and sections
- Content width on static pages: `max-w-3xl` or `max-w-4xl`
- Responsive: stack on mobile, row on `md:` breakpoint
- Use `gap-*` for flex/grid spacing, not margin on individual children

## Responsive & Mobile-First
- Every page must work on 360px viewport width
- Use `sm:`, `md:`, `lg:` breakpoints — never `max-*` unless absolutely necessary
- Forms: full-width inputs on mobile, 2-column on desktop where appropriate
- Tables: use card layout on mobile (`grid grid-cols-1 md:table`)
- Touch targets: minimum 44x44px for interactive elements

## States (Every Interactive Component Must Handle)
- **Loading:** Skeleton (`<Skeleton />` from shadcn) for content areas, spinner for buttons
- **Empty:** Illustration + message + CTA (e.g., "No circles yet — create one")
- **Error:** Inline error message with retry button, not just toast
- **Success:** Toast/sonner for actions, redirect for page-level operations

## Forms
- Use shadcn `<Form />` component with Zod validation schemas from `@/lib/validations`
- Show validation errors inline below each field
- Disable submit button while submitting
- Show loading spinner on submit button during submission
- Handle network errors gracefully (not just "Something went wrong")

## Casing Convention (Strict)
- **camelCase** for all code identifiers: variables (`balanceKobo`), functions (`formatNaira`), object properties (`memberPosition`), URL query params (`?mode=set`), Zod fields, Zustand store fields
- **kebab-case** for file names: `circle-card.tsx`, `page-breadcrumbs.tsx`, `auth-store.ts`
- **PascalCase** for component names (`CircleCard`) and TypeScript types/interfaces (`CircleListItem`)
- URL route segments: kebab-case (`/wallet/withdraw`, `/circles/[id]/join`)
- **Never snake_case** in identifiers, types, API responses, or URL params — except DB column names (database convention)

## File & Folder Conventions
- One component per file, named `kebab-case.tsx`
- Page files: `page.tsx` inside route group folders
- Shared components go in `@/components/shared/`, feature-specific in `@/components/<feature>/`
- API client calls in `@/lib/api.ts` — do not inline fetch/axios in components
- State mutations go through Zustand stores or React Query mutations — no direct setState for server data

## Data Fetching
- Use `@tanstack/react-query` for all server data — `useQuery` and `useMutation`
- No `useEffect` for data fetching
- Cache keys should be strings, not arrays: `["circles"]`, `["circle", id]`
- Mutations: invalidate related queries on success via `queryClient.invalidateQueries`

## Auth
- Access auth state via `useAuthStore` from `@/stores/auth-store`
- Protected pages redirect to `/auth` if not authenticated
- Public pages redirect to `/dashboard` if already authenticated
- API client auto-applies JWT from store and refreshes on 401

## Accessibility
- All images need `alt` text
- Buttons need visible text or `aria-label`
- Form inputs need associated `<label>` elements
- Interactive elements need `role` where semantic HTML isn't enough
- Color is never the only indicator of state (add text or icon)

## Performance
- No `useEffect` for derived state — use `useMemo` or computed values
- Lists: pass stable `key` props (database IDs, not indices)
- Dynamic imports for heavy components: `next/dynamic` with loading fallback
- Images: use `next/image` with explicit width/height

## Security
- No secrets in client code (API keys, private URLs, HMAC secrets)
- No sensitive data in URL params (pass IDs, not BVN/passwords)
- No `dangerouslySetInnerHTML` unless sanitized
- User input always goes through Zod validation before reaching API

## Comments
- Comments are allowed where they clarify non-obvious logic
- Prefer self-documenting code over comments where possible
- No commented-out code — delete it
