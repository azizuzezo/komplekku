# Komplekku brand assets

## Files (current, owner override 2026-08-17)

- `komplekku-lockup.png` — byte-for-byte copy of the owner-supplied 1254 × 1254 raster. This is the canonical identity reference and must not be overwritten by a generated variant.
- `komplekku-mark.png` — compact transparent application mark: the icon block (K + house silhouettes + sun) cropped out of the lockup above the wordmark, then locally chroma-keyed against its white background. Use only on a light surface because the source mark uses background-shaped negative space.
- `komplekku-mark-light.png` — the same mark silhouette recolored to solid white (alpha preserved, generated locally from `komplekku-mark.png` by flattening RGB to white and keeping the original alpha channel). Use only on the primary-purple identity panels (`BrandMark tone="light"`) so the mark and wordmark read directly on `--color-primary` without a boxed light-surface card behind them.

## Source and naming

- Owner source: `C:\Users\aziz\Downloads\komplekku.png` (supplied 2026-08-17, superseding the 2026-08-11 forest-green mark below).
- The raster visually typesets the wordmark as `KomplekKu`; official product copy remains `Komplekku` per `PRD.md`.
- Palette shown in this mark (purple/cyan/yellow) is an explicit owner override of `PRD.md` section 11's color system — see `design.md` for the current locked token values.

Do not create another logo, re-typeset the supplied wordmark, or place either asset on a public CDN without owner approval.

## Prior version (superseded 2026-08-17)

- Owner source: `C:\Users\aziz\Downloads\ChatGPT Image Aug 11, 2026, 10_28_52 AM.png` (SHA-256 `3CD66DB1A500BE80054D3EC7DE37844DF71476902D432398D227CE67544856AA`) — forest-green K + house mark, 1448 × 1086. Replaced in full by the files above.
