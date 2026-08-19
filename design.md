# Design — Komplekku

A locked product design system for Komplekku. Every web and Flutter surface must read this file before changing visual structure. Extend this system deliberately; do not invent a separate theme per route.

## Product character

- Audience: residents, household members, neighborhood administrators, and security staff.
- Primary job: show what matters in the neighborhood and make the next action obvious.
- Tone: quiet premium civic — mature, warm, safe, exact, and practical.
- Genre: modern-minimal product UI with residential character, not SaaS marketing.
- Product language: natural Bahasa Indonesia.

## Brand assets

- Canonical owner-supplied lockup: `assets/brand/komplekku-lockup.png`.
- Derived compact mark: `assets/brand/komplekku-mark.png`.
- The source raster is visually typeset as `KomplekKu`; product copy remains `Komplekku`. Never re-typeset or alter the pixels inside the supplied lockup without owner approval.
- Use the complete lockup on sign-in, onboarding, and other identity-first moments.
- Use the compact mark in constrained application chrome. Its negative space assumes a light surface; do not place it directly on the brand purple or dark imagery — use `komplekku-mark-light.png` there instead.
- Do not return to a placeholder letter `K`, generate a replacement logo, or put the detailed mark inside a generic rounded-square tile.

## Structural families

- Resident home and indexes: **Ecosystem Index**, adapted as a civic noticeboard. One primary live item, then smaller real-data rails. No decorative statistics or equal card grid.
- Authentication and onboarding: **Split Studio**. Identity/context on one side and the single current task on the other; it collapses to a compact brand band plus form on mobile.
- Announcement and document detail: **Long Document**. Reading measure, restrained metadata, negative space instead of nested containers.
- Account: resident credential, not social profile. Show only real community, house, household, contact, and status data.

## Navigation

- Mobile (320–767 px): a bottom dock with at most the currently implemented destinations. Current state uses weight plus a small geometric indicator, not a large rounded tile.
- Tablet (768–1199 px): compact navigation rail.
- Desktop (1200 px+): full residential side column with the real logo, route index, and real resident context.
- Never expose unfinished destinations. Navigation follows backend permissions.
- Product routes do not need a marketing footer.

## Theme

The five owner-supplied mobile prototypes are the current visual source of truth (owner direction, 2026-08-19). Web and Flutter use the same crisp green/white civic system: saturated green marks the current action, deep green carries hierarchy, pale green indicates emphasis, and neutral white cards preserve dense readability. This explicitly supersedes the purple/cyan override from 2026-08-17.

- `--color-paper`: `#FFFFFF`
- `--color-paper-2`: `#F7FAF8`
- `--color-paper-3`: `#EFF5F1`
- `--color-ink`: `#101119`
- `--color-ink-2`: `#353842`
- `--color-rule`: `#E0E4E2`
- `--color-rule-2`: `#C9D2CD`
- `--color-muted`: `#666A73`
- `--color-neutral`: `#73777F`
- `--color-brand`: `#008A52`
- `--color-brand-deep`: `#006B3F`
- `--color-brand-wash`: `#EEF8F2`
- `--color-accent`: `#0AA6A6`
- `--color-focus`: `#008A52`
- Status colors: `--color-danger` `oklch(62.6% 0.1933 23)` (`#E5484D`), `--color-success` `oklch(63.6% 0.1453 155.9)` (`#20A464`), `--color-warning` unchanged from the prior system (`oklch(62.64% 0.1248 70.45)`, no replacement given).
- `#FFEB22` (logo yellow) is not a UI token — it appears only inside the logo raster, per the owner's palette table ("logo/accent" role), not as a text/fill/background color in the product UI.

### Prior themes (superseded 2026-08-19)

The purple/cyan/yellow system (`#4B2DA1`, `#32178F`, `#EEE9FF`, `#32BCE3`) was the owner override from 2026-08-17 until the five green prototypes were approved as the exact cross-platform target on 2026-08-19.

The forest green system below was the locked theme from 2026-08-11 until the owner supplied the purple/cyan/yellow palette above. Kept here for history only — do not use these values.

- `--color-brand`: `oklch(42.5% 0.0593 170.96)` (forest green `#28594A`)
- `--color-brand-deep`: `oklch(35.46% 0.0487 170.49)` (`#1E4438`)
- `--color-accent`: `oklch(63.48% 0.1234 42.27)` (terracotta `#C86F4B`)
- `--color-ink`: `oklch(22.5% 0.021 163)`, `--color-rule`: `oklch(84.5% 0.018 150)`, `--color-muted`: `oklch(46% 0.022 160)`, `--color-focus`: `oklch(55% 0.14 171)`

## Typography

- Product UI and display: Plus Jakarta Sans, variable weights 400–800, normal style.
- Fallback: system sans only after the bundled Plus Jakarta Sans asset.
- One-family discipline is intentional for this product: it keeps dense civic UI coherent and follows the PRD. Brand differentiation comes from the supplied mark, proportion, weight contrast, and layout.
- Body: 400–500. Headings: 700–800. Avoid weak 400/600 contrast.
- Data, house codes, dates, time, and money use tabular numerals.
- Headings are roman; no italic emphasis words, gradient text, or oversized dashboard hero.

## Spacing and shape

- Use the root 4-point named spacing scale. Never introduce arbitrary per-route spacing values.
- Buttons: 8 px radius. Inputs: 10 px. Cards: 12 px. Modal: 14 px. These are caps, not a reason to box every section.
- Prefer separators, negative space, and one strong surface over card-in-card containment.
- Home uses a deliberate 8/4 desktop split and one-column mobile stack.

## Motion and interaction

- Button press: scale or translate equivalent of 0.98 for 90 ms; release 120 ms.
- State changes: 150–220 ms opacity/transform only.
- Focus rings appear immediately and never animate.
- Successful visible actions are silent. Failed async actions explain what happened and how to retry.
- Every control covers default, hover, focus, active, disabled, loading, error, and success where applicable.
- `prefers-reduced-motion` collapses spatial motion to an opacity change of at most 150 ms.

## Content rules

- Home is a resident desk, not a dashboard: community/date context, latest notice, upcoming agenda when real, and household identity.
- Priority color is reserved for IMPORTANT/URGENT notices and operational status.
- No fake counts, fake filters, placeholder charts, decorative badges, dead controls, or hidden authorization assumptions.
- Empty, offline, unauthorized, forbidden, loading, error, and success states use the same visual system.

## Exports

### tokens.css

The executable source is root `tokens.css`. Core portable roles:

```css
:root {
  --color-paper: oklch(100% 0 0);
  --color-paper-2: oklch(97.4% 0.003 286);
  --color-paper-3: oklch(93% 0.003 286);
  --color-ink: oklch(26.2% 0.015 297);
  --color-ink-2: oklch(38% 0.014 297);
  --color-rule: oklch(89% 0.006 296);
  --color-rule-2: oklch(80% 0.01 296);
  --color-muted: oklch(56.6% 0.019 297);
  --color-neutral: oklch(46% 0.016 297);
  --color-brand: oklch(40.9% 0.1753 287.9);
  --color-brand-deep: oklch(34.1% 0.1783 281.6);
  --color-brand-wash: oklch(94.4% 0.03 296.2);
  --color-accent: oklch(74.1% 0.1249 221.9);
  --color-accent-ink: oklch(26.2% 0.015 297);
  --color-focus: oklch(48% 0.19 288);
  --font-display: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", system-ui, sans-serif;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2.5rem;
  --text-base: 1rem;
  --text-md: 1.125rem;
  --text-lg: 1.25rem;
  --radius-card: 0.75rem;
  --radius-input: 0.625rem;
  --radius-button: 0.5rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}
```

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(100% 0 0);
  --color-paper-2: oklch(97.4% 0.003 286);
  --color-paper-3: oklch(93% 0.003 286);
  --color-ink: oklch(26.2% 0.015 297);
  --color-ink-2: oklch(38% 0.014 297);
  --color-rule: oklch(89% 0.006 296);
  --color-muted: oklch(56.6% 0.019 297);
  --color-brand: oklch(40.9% 0.1753 287.9);
  --color-accent: oklch(74.1% 0.1249 221.9);
  --color-focus: oklch(48% 0.19 288);
  --font-display: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", system-ui, sans-serif;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2.5rem;
  --text-base: 1rem;
  --text-md: 1.125rem;
  --text-lg: 1.25rem;
  --radius-card: 0.75rem;
  --radius-input: 0.625rem;
  --radius-button: 0.5rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "paper": { "$value": "oklch(100% 0 0)", "$type": "color" },
    "ink": { "$value": "oklch(26.2% 0.015 297)", "$type": "color" },
    "brand": { "$value": "oklch(40.9% 0.1753 287.9)", "$type": "color" },
    "accent": { "$value": "oklch(74.1% 0.1249 221.9)", "$type": "color" },
    "focus": { "$value": "oklch(48% 0.19 288)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Plus Jakarta Sans, system-ui, sans-serif", "$type": "fontFamily" },
    "body": { "$value": "Plus Jakarta Sans, system-ui, sans-serif", "$type": "fontFamily" }
  },
  "space": {
    "md": { "$value": "1rem", "$type": "dimension" },
    "lg": { "$value": "1.5rem", "$type": "dimension" },
    "xl": { "$value": "2.5rem", "$type": "dimension" }
  },
  "duration": {
    "micro": { "$value": "120ms", "$type": "duration" },
    "short": { "$value": "220ms", "$type": "duration" }
  }
}
```

### shadcn/ui CSS variables

The project does not use shadcn/ui; this mapping is provided only for portability.

```css
:root {
  --background: 100% 0 0;
  --foreground: 26.2% 0.015 297;
  --card: 100% 0 0;
  --card-foreground: 26.2% 0.015 297;
  --primary: 40.9% 0.1753 287.9;
  --primary-foreground: 100% 0 0;
  --secondary: 97.4% 0.003 286;
  --secondary-foreground: 38% 0.014 297;
  --muted: 89% 0.006 296;
  --muted-foreground: 56.6% 0.019 297;
  --accent: 74.1% 0.1249 221.9;
  --accent-foreground: 26.2% 0.015 297;
  --destructive: 62.6% 0.1933 23;
  --destructive-foreground: 100% 0 0;
  --border: 89% 0.006 296;
  --input: 89% 0.006 296;
  --ring: 48% 0.19 288;
  --radius: 0.75rem;
}
```
