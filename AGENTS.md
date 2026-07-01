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
- Colors: gold (#FFCC00) / black / white only — use CSS variables, no hardcoded Tailwind colors
- No shadows, no glow, no zoom on hover, minimal animation
- shadcn components first, hugeicons only
- Flat design, clean borders, generous spacing
- PWA: serwist configured, manifest at `/manifest.json`
<!-- END:project-rules -->
