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
- Use the compact mark in constrained application chrome. Its negative space assumes a light warm surface; do not place it directly on forest green or dark imagery.
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

The forest green is the identity plane, not a faint afterthought. The page and card surface are true white by owner direction (2026-08-11, overriding the PRD's original warm-paper anchor); terracotta is a small signal, never a large fill.

- `--color-paper`: `oklch(100% 0 0)`
- `--color-paper-2`: `oklch(96% 0.002 0)`
- `--color-paper-3`: `oklch(91% 0.002 0)`
- `--color-ink`: `oklch(22.5% 0.021 163)`
- `--color-ink-2`: `oklch(35% 0.021 163)`
- `--color-rule`: `oklch(84.5% 0.018 150)`
- `--color-rule-2`: `oklch(76% 0.02 153)`
- `--color-muted`: `oklch(46% 0.022 160)`
- `--color-neutral`: `oklch(38% 0.021 162)`
- `--color-brand`: `oklch(42.5% 0.0593 170.96)`
- `--color-brand-deep`: `oklch(35.46% 0.0487 170.49)`
- `--color-accent`: `oklch(63.48% 0.1234 42.27)`
- `--color-focus`: `oklch(55% 0.14 171)`

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
  --color-paper-2: oklch(96% 0.002 0);
  --color-paper-3: oklch(91% 0.002 0);
  --color-ink: oklch(22.5% 0.021 163);
  --color-ink-2: oklch(35% 0.021 163);
  --color-rule: oklch(84.5% 0.018 150);
  --color-rule-2: oklch(76% 0.02 153);
  --color-muted: oklch(46% 0.022 160);
  --color-neutral: oklch(38% 0.021 162);
  --color-brand: oklch(42.5% 0.0593 170.96);
  --color-brand-deep: oklch(35.46% 0.0487 170.49);
  --color-accent: oklch(63.48% 0.1234 42.27);
  --color-accent-ink: oklch(22.5% 0.021 163);
  --color-focus: oklch(55% 0.14 171);
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
  --color-paper-2: oklch(96% 0.002 0);
  --color-paper-3: oklch(91% 0.002 0);
  --color-ink: oklch(22.5% 0.021 163);
  --color-ink-2: oklch(35% 0.021 163);
  --color-rule: oklch(84.5% 0.018 150);
  --color-muted: oklch(46% 0.022 160);
  --color-brand: oklch(42.5% 0.0593 170.96);
  --color-accent: oklch(63.48% 0.1234 42.27);
  --color-focus: oklch(55% 0.14 171);
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
    "ink": { "$value": "oklch(22.5% 0.021 163)", "$type": "color" },
    "brand": { "$value": "oklch(42.5% 0.0593 170.96)", "$type": "color" },
    "accent": { "$value": "oklch(63.48% 0.1234 42.27)", "$type": "color" },
    "focus": { "$value": "oklch(55% 0.14 171)", "$type": "color" }
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
  --foreground: 22.5% 0.021 163;
  --card: 100% 0 0;
  --card-foreground: 22.5% 0.021 163;
  --primary: 42.5% 0.0593 170.96;
  --primary-foreground: 100% 0 0;
  --secondary: 96% 0.002 0;
  --secondary-foreground: 35% 0.021 163;
  --muted: 84.5% 0.018 150;
  --muted-foreground: 46% 0.022 160;
  --accent: 63.48% 0.1234 42.27;
  --accent-foreground: 22.5% 0.021 163;
  --destructive: 54.01% 0.1486 23.49;
  --destructive-foreground: 100% 0 0;
  --border: 84.5% 0.018 150;
  --input: 84.5% 0.018 150;
  --ring: 55% 0.14 171;
  --radius: 0.75rem;
}
```
