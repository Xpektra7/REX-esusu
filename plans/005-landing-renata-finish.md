# Plan 005: Finish the Renata-inspired landing page refactor — dark hero, gold curve, CTA mock

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 279fc5d..HEAD -- src/components/landing/hero.tsx src/components/landing/circle-diagram.tsx src/components/landing/cta.tsx src/app/page.tsx src/app/globals.css`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (touches only marketing page files, no overlap with other plans)
- **Category**: design
- **Planned at**: commit `279fc5d`, 2026-07-09

## Why this matters

The landing page is the public face of the product. The previous session rebuilt it following a "Renata" design reference, but 3 of the 6 planned items were never completed (hero left light, SVG curve missing, CTA mock missing). Without this pass the page has a flat light hero that doesn't match the bold dark-band rhythm the rest of the page uses (security, CTA), and lacks the visual punch of the reference design.

## Current state

The Renata adapt plan had 6 items. Verified on disk:

| # | Renata item | Disk state | Status |
|---|---|---|---|
| 1 | Hero → **dark** full-bleed, big headline, single CTA, flat gold SVG curve (static, no glow) | `hero.tsx` is `bg-grid-dots` (**light**), has 2 CTAs, no SVG curve | **NOT DONE** |
| 2 | Right side: restyle mock bigger/darker | `CircleDiagram` (animated coin, **user-approved** per thread) — not `HeroPotCard` | **DIVERGED** — keep `CircleDiagram`, recolor for dark |
| 3 | New Compare table | `compare.tsx` built, in `page.tsx` | **DONE ✓** |
| 4 | Security → 2×2 icon grid, dark, 3+1 points | `security.tsx` IS `bg-foreground`, 2×2, 4 points | **DONE ✓** |
| 5 | CTA → dark + small mock beside, gold button | `cta.tsx` IS `bg-foreground` + gold button, no side mock | **PARTIAL** |
| 6 | Skip fake logos / APY / FAQ accordion | never added | **DONE ✓** |

### Key files

**`src/components/landing/hero.tsx` (lines 51–116)** — current hero:
```tsx
<section className="relative overflow-hidden border-b border-border bg-grid-dots">
  <div className="landing-container grid gap-10 py-14 ... lg:grid-cols-[1.1fr_1fr]">
    <div>   // left: eyebrow, h1, p, 2 CTA buttons   </div>
    <div className="mx-auto w-full max-w-sm">
      <CircleDiagram activeIndex={activeIndex} />
    </div>
  </div>
</section>
```

**`src/components/landing/circle-diagram.tsx`** — ring uses `stroke="var(--border)"`, center text uses `text-muted-foreground` (too dark to read on `bg-foreground`).

**`src/components/landing/cta.tsx`** — centered flex-col layout inside `bg-foreground`, no mock to the right.

**`src/app/globals.css`** — `bg-grid-dots` uses `var(--border)` on a light background. `landing-container`, `landing-section`, `eyebrow` classes all exist.

### Repo conventions

- All colors via CSS variables — no hardcoded Tailwind tokens.
- `buttonVariants({ variant: "default" })` = `bg-primary text-primary-foreground` (gold).
- `landing-container`: `mx-auto w-full max-w-5xl px-6`.
- `landing-section`: `border-b border-border py-16 md:py-20`.
- `eyebrow`: `text-[10px] font-semibold uppercase tracking-[0.15em]`.
- No glow (`box-shadow`/`drop-shadow`/`blur`), no `hover:scale-*`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0, no errors |
| Lint | `npx biome check src/components/landing/` | no errors |
| Dev build | `npm run dev` | starts without errors |

## Scope

**In scope**:
- `src/components/landing/hero.tsx` — dark bg, single CTA, add gold SVG curve
- `src/components/landing/circle-diagram.tsx` — recolor muted text for dark bg
- `src/components/landing/cta.tsx` — add side mock, switch to 2-col grid

**Out of scope**:
- Changing the compare table, security, who-its-for, how-it-works, features, testimonial, footer, nav — only touch the 3 files above.
- Adding new npm dependencies.
- Changing `globals.css` unless a custom class must be added for the SVG curve.
- Animating the SVG curve — must remain static.

## Steps

### Step 1: Dark hero + single CTA (`hero.tsx`)

Change the `<section>` className:
```
bg-grid-dots  →  bg-foreground text-background
```

Update the subhead paragraph (line 63):
```
text-muted-foreground  →  text-background/70
```

CTAs (lines 69–102): Keep ONE primary CTA (`Start Your Circle` / `Go to Dashboard`). Demote the secondary `About Esusu` outline button to a ghost text link:
```tsx
<Link href="/about" className="text-sm text-background/60 hover:text-background underline-offset-4 hover:underline">
  About Esusu
</Link>
```
Place it directly under the primary button, not as a separate button.

The eyebrow (line 54, `bg-primary/10 text-primary`) stays — gold reads fine on dark.

Remove the `cn` and `buttonVariants` import if they become unused (check: `buttonVariants` is still needed for the primary CTA; `cn` is needed for the conditional class).

**Verify**: `grep "bg-grid-dots" src/components/landing/hero.tsx` → no match. `grep "text-background/70"` → found on the subhead. Hero renders dark background at `/`.

### Step 2: Add static gold SVG curve (`hero.tsx`)

Add an absolutely-positioned decorative SVG behind the copy. Place it as a sibling of the `landing-container` grid, inside the `<section>`:

```tsx
<svg
  aria-hidden="true"
  className="pointer-events-none absolute -right-20 bottom-0 w-[120%] max-w-3xl text-primary opacity-20"
  viewBox="0 0 300 100"
  preserveAspectRatio="none"
  fill="none"
>
  <path
    d="M0 80 Q 75 20, 150 60 T 300 40"
    stroke="currentColor"
    strokeWidth="2"
    vectorEffect="non-scaling-stroke"
  />
</svg>
```

- `text-primary` inherits gold from CSS variable.
- `opacity-20` keeps it subtle — a flat gold trace, no glow.
- No `filter`, no `box-shadow`, no `animation`, no `hover:scale-*`.
- Position bottom-right behind the text column.

**Verify**: Inspect the rendered hero at `/` — a faint gold curve is visible bottom-right, no drop-shadow/blur. `grep -n "blur\|drop-shadow\|shadow-" src/components/landing/hero.tsx` → no matches.

### Step 3: Recolor CircleDiagram for dark (`circle-diagram.tsx`)

Change text that would be invisible on `bg-foreground`:

- Line 47: `text-muted-foreground` → `text-background/70`
- Line 49: `text-muted-foreground` → `text-background/70`
- Line 82 (inactive members): `text-muted-foreground` → `text-background/70`
- The dashed ring `stroke="var(--border)"` (line 31) — `var(--border)` on dark is a light color (reads as faint dots). This is acceptable. Optionally change to `stroke="var(--background)"` with `opacity="0.15"` for a cleaner look.
- The active coin `fill="var(--primary)"` + `stroke="var(--background)"` (gold with white border) — reads fine on dark, leave unchanged.
- The center ₦450k `text-primary` (line 48) — gold on dark, leave.
- Line 82: `text-foreground` for active member name — leave (reads fine on dark).
- Line 70: `ring-offset-background` — leave (white offset ring on dark bg).

**Verify**: `grep "text-muted-foreground" src/components/landing/circle-diagram.tsx` → no matches. `grep "text-background/70" src/components/landing/circle-diagram.tsx` → at least 3 matches.

### Step 4: CTA side mock (`cta.tsx`)

Change the centered layout to a side-by-side grid on `lg:`:

```tsx
<section className="border-t border-background/10 bg-foreground py-16 text-background md:py-20">
  <div className="landing-container lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
    <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
      <h2 className="max-w-xl text-3xl font-bold md:text-4xl">
        Start saving with people you trust
      </h2>
      <p className="max-w-md text-sm text-background/70 md:text-base">
        Your first circle takes less than five minutes to set up.
      </p>
      <Link
        href={isAuthenticated ? "/dashboard" : "/signup"}
        className={cn(buttonVariants({ size: "lg" }), "gap-2")}
      >
        {isAuthenticated ? "Go to Dashboard" : "Create Your Circle"}
        <ArrowRight01Icon className="size-4" />
      </Link>
    </div>

    <div className="hidden lg:block">
      <CircleDiagram activeIndex={0} />
    </div>
  </div>
</section>
```

The `CircleDiagram` is rendered statically (`activeIndex={0}`, no ticking interval) — it just shows the ring with Ada highlighted as the first recipient. Import it at the top.

**Verify**: `grep -n "CircleDiagram\|lg:grid-cols-2" src/components/landing/cta.tsx` → both found. At `/`, CTA section has the diagram on the right at `lg:`+ breakpoints, hidden on mobile. No new imports from outside `@/components/landing/` needed — `CircleDiagram` is already in the same directory.

## Test plan

- **Visual QA**: Load `/` at 360px (mobile) and 1440px (desktop). Verify:
  - Hero is dark (`bg-foreground`) with the gold curve visible bottom-right.
  - No glow, blur, or shadow on the curve.
  - Single primary CTA button + ghost "About Esusu" text link.
  - CircleDiagram ring and text read clearly on the dark hero and CTA.
  - Compare table has Esusu column highlighted in gold.
  - Security is 2×2 dark grid.
  - CTA has the diagram on the right at desktop, hidden on mobile.
- **UI-RULES compliance**: Check `src/components/landing/` for any `shadow`, `drop-shadow`, `blur`, `scale-*`, hardcoded Tailwind colors.
- **Accessibility**: The SVG curve is `aria-hidden="true"` and `pointer-events-none`.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/components/landing/` — no errors
- [ ] `grep "bg-grid-dots" src/components/landing/hero.tsx` — no matches
- [ ] `grep "text-muted-foreground" src/components/landing/circle-diagram.tsx` — no matches
- [ ] `grep "text-background/70" src/components/landing/circle-diagram.tsx` — ≥3 matches
- [ ] `grep -n "lg:grid-cols-2" src/components/landing/cta.tsx` — found
- [ ] `grep -n "CircleDiagram" src/components/landing/cta.tsx` — found (import + render)
- [ ] `grep -n "blur\|drop-shadow\|shadow-" src/components/landing/hero.tsx` — no matches
- [ ] No files outside `hero.tsx`, `circle-diagram.tsx`, `cta.tsx` are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `<svg>` curve with `opacity-20` on `bg-foreground` is invisible — increase to `opacity-35` or use a solid `h-0.5` stroke with `opacity-10`.
- `CircleDiagram` text (`text-background/70`) doesn't have enough contrast on `bg-foreground` — adjust to `text-background/90`.
- A verification command fails twice after a reasonable fix attempt.

## Maintenance notes

- The gold SVG curve is a static decoration. If the page's visual rhythm shifts (different section colors), the `opacity` may need tweaking or the curve removed.
- The `CircleDiagram` is reused in two contexts: hero (animated with `activeIndex` state) and CTA (static `activeIndex={0}`). The static usage uses zero JS state — it's just a single render.
- If the Renata reference is ever completed with the skipped items (FAQ accordion, etc.), evaluate whether an accordion component should be installed or built from scratch — the existing `shadcn accordion` is not installed.
