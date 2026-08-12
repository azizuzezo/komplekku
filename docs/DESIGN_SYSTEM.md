# Design system

Komplekku should feel residential, civic, safe, warm, and practical. It must not resemble a
generic AI/SaaS dashboard.

## Hallmark memory

- Genre: `modern-minimal`
- Resident home and indexes: `Ecosystem Index`
- Authentication and onboarding: `Split Studio`
- Announcement detail: `Long Document`
- Theme route: `custom`
- Navigation: mobile bottom dock, tablet rail, desktop residential side column
- Footer: none on product routes
- Enrichment: owner-supplied Komplekku identity

The complete locked direction and route-level composition rules live in root `design.md`.
These choices do not authorize fake search, navigation, CTA, counts, or screenshots.

## Brand assets

- `assets/brand/komplekku-lockup.png` is the untouched owner-supplied source and the
  canonical identity reference.
- `assets/brand/komplekku-mark.png` is the transparent compact application mark derived for
  constrained chrome. It is used only on light surfaces (`BrandMark` default tone).
- `assets/brand/komplekku-mark-light.png` is the same mark recolored to solid white for the
  forest-green identity panels (`BrandMark tone="light"`, used on `/masuk` and onboarding).
  The wordmark next to it there is set in Plus Jakarta Sans, not a second raster.
- The full lockup appears on sign-in and onboarding, on the light form side. The compact
  mark appears in the authenticated shell, app metadata, and resident credential. The white
  mark + text lockup appears only on the dark green identity panel.
- Do not replace either asset with a letter tile, re-typeset the supplied wordmark, or place
  the detailed (non-light) mark directly on forest green.

## Tokens

`tokens.css` is the canonical web token file. `packages/design-tokens/src/index.ts` exposes
the same values to TypeScript. Product color anchors are the PRD colors converted to OKLCH,
with one owner-directed override recorded in `Engineering.md` (ENG-011, 2026-08-11): the page
background and card surface are true white rather than the PRD's original warm-paper anchor.

- forest green primary and primary-dark;
- white application background and card surface;
- near-white neutral secondary surface (sidebar rail) and green-tinted sage wash;
- dark green-tinted primary and secondary text;
- terracotta accent;
- warning, danger, and success states.

The forest green is the identity plane; white is the environment. Use terracotta as a
small operational signal, not as a large background field.

## Typography and spacing

Plus Jakarta Sans is both display and body by explicit product decision. The variable font
is bundled locally for web and Flutter under `assets/fonts`, with platform fallbacks only if
the asset cannot load. Use tabular figures for money, time, house numbers, statistics, and
camera data. Spacing follows a 4 pt rhythm with a single 2 px optical-adjustment token.

## Components and states

- Web icons: Lucide only. Flutter icons: Material Symbols/Icons only.
- Button radius: 8 px; input: 10 px; card: 12 px; modal: 14 px; sheet top: 18 px.
- Touch targets are at least 44 × 44 CSS pixels.
- Every interaction covers default, hover, focus, active, disabled, loading, error, and
  success states where applicable.
- Focus rings appear immediately and use a contrast guard on filled controls.
- Loading, empty, error, offline, unauthorized, and forbidden product states are mandatory.

## Motion

Animate transform and opacity only. Preserve the PRD timings for press, release, card hover,
page transition, modal, and sheet. Reduced motion removes spatial movement and limits any
necessary crossfade to 150 ms.

No gradients as the primary treatment, neon glow, decorative blobs, glassmorphism, emoji
icons, nested cards, invented metrics, fake controls, or ornamental animation.
