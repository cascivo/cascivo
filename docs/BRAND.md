# cascivo — Brand Reference

## The name

**cascivo** (`/kas-ˈsee-vo/`) is the CSS-native, signal-driven, AI-first React design system.

### Decision

- Name: **cascivo**
- Domain: **cascivo.com** (owned)
- npm namespace: **@cascivo/\*** (scoped only)
- CLI: **`cascivo`** (unscoped npm package, invoked `npx cascivo init`)

### Derivation: cascade-ui → cascivo

1. Drop `-ui` — generic, collided with an existing library, no clean `.com` domain.
2. Keep `casc-` — the lineage: the CSS cascade, the design-token cascade (primitive → semantic → component), and the waterfall image.
3. Add `-ivo` — a Romance agentive/adjectival suffix (cf. _attivo_, _motivo_) connoting "active, alive, flowing."
4. Result: one coined, pronounceable word, free `.com`, still reads as "cascade."

### Voice & positioning

cascivo is calm, modern, and technical. It ships beautiful-by-default components that developers own and extend. The tone is confident and direct — not playful, not corporate. Mirror the tagline: "the CSS-native, signal-driven, AI-first React design system."

---

## Brand colors

| Token                      | Value                   | Usage                                |
| -------------------------- | ----------------------- | ------------------------------------ |
| `--cascivo-brand-primary`  | `oklch(0.55 0.15 240)`  | Hero, CTA, logo gradient start       |
| `--cascivo-brand-accent`   | `oklch(0.72 0.13 195)`  | Gradient end, accents, highlights    |
| `--cascivo-brand-ink`      | `oklch(0.22 0.03 250)`  | Wordmark, body text on brand surface |
| `--cascivo-brand-paper`    | `oklch(0.99 0.005 250)` | Brand background                     |
| `--cascivo-brand-gradient` | primary → accent        | Hero fill, OG, logo                  |

All contrast-checked. Full spec: [docs/specs/brand-color.md](specs/brand-color.md)

---

## Logo

**Version 1.0 · 28 Aug 2026 · mark: Notch**

### Mark concept

A filled square with a rectangular bite taken out of the right edge, leaving a chunky "C". One closed path, drawn on a 32-unit grid:

```
viewBox="0 0 32 32"
d="M0 0H32V11H11V21H32V32H0Z"
```

Stem 11 units. Top and bottom bars 11 units. Notch 21 x 10 units, flush to the right edge. No curves, no strokes, no type, no gradients, no optical corrections — the shape is arithmetic, so anyone can rebuild it from the numbers above.

The brand argument is *own your stylesheet*: a loud, hard-edged, unmistakably non-generic library. Three properties earned the mark its pick:

1. **One path in one colour.** Nothing breaks in mono, on the accent field, or punched out of a solid block. The accent is optional decoration, not structure.
2. **Strongest at small sizes.** The notch is 10 of 32 units — 5px at 16px.
3. **Most mass at nav size**, which is where the mark is seen ninety-nine times out of a hundred.

The one thing it gives up: on dark grounds it sits as a heavy slab where a lighter mark would breathe. Accepted deliberately.

### Colour

Ink is `currentColor`. Accent is `var(--cascivo-color-accent)`. The mark therefore inherits any theme it is placed in — drop it inside a `data-theme` subtree and it repaints with the surface, with no logo variants to maintain.

| Variant     | Ink                     | Accent                  | Use                                            |
| ----------- | ----------------------- | ----------------------- | ---------------------------------------------- |
| Two colour  | `oklch(0.1 0 0)`        | `oklch(0.88 0.19 105)`  | Default. Site header, CTA field, docs, README. |
| One colour  | ink                     | none                    | Single-ink print, engraving, mono favicons.    |
| Reversed    | `oklch(0.97 0.02 95)`   | acid                    | Dark surfaces, terminal, GitHub dark.          |
| On accent   | ink                     | none                    | CTA band and stickers. Never accent on accent. |
| Knockout    | surface colour          | none                    | Punched out of a solid block.                  |

Never introduce a colour that is not a theme token. Where a raster pipeline cannot read `oklch()` (ImageMagick, see `apps/site/scripts/gen-icons.mjs`), the committed hex equivalents are `#030303` ink, `#ebdd00` accent, `#f9f5e6` reversed.

### Wordmark

Lowercase `cascivo` in `--cascivo-font-display` ('Arial Black'), `letter-spacing: -0.045em` to `-0.055em`.

**Convert the wordmark to outlines in any exported asset.** 'Arial Black' substitutes badly on Linux and Android, which silently changes the lockup in CI screenshots and on user machines. `apps/site/public/logo.svg` and `apps/storybook/public/brand.svg` still carry live `<text>` and need re-exporting with outlines before they are used as press assets.

### Clear space and minimum size

- **Clear space:** 8 units on all four sides — one quarter of the mark. Nothing enters it: no type, no rule, no other logo.
- **Minimum size:** 16px on screen, 6mm in print. Below 16px the notch closes optically — use the wordmark alone.
- Always 1:1. The mark is square and never scales on one axis.

### Lockups

| Lockup     | Spec                                                                       | Use                              |
| ---------- | -------------------------------------------------------------------------- | -------------------------------- |
| Horizontal | Gap = 1/3 of mark height; mark optically centred on the wordmark's x-height | Primary. Header, docs, README.   |
| Stacked    | Gap = 1/4 of mark height; left aligned, never centred                      | Merch, avatars, square crops.    |
| Nav        | 18px mark, 16px wordmark, gap 10px                                         | Only lockup permitted below 24px |

### Misuse

Never stretch or squash. Never rotate. Never round the corners. Never recolour the ink off-token. Never add a shadow, glow or outline — the mark is flat even though the brand uses hard shadows elsewhere. Never fill the notch with anything but the accent token.

### Favicon and app icons

The mark sits at **62.5% of the icon box**, optically centred: the notch pulls visual mass to the left, so the mark shifts **1 unit right** of true centre. The one-colour variant is used at 16 and 32; the accent is legible from 48 up. `shape-rendering="crispEdges"` on the small rasterisations keeps the notch edge hard.

### Asset locations

- `apps/site/public/logo-mark.svg` — one-colour mark, ink is `currentColor`
- `apps/site/public/logo-mark-accent.svg` — two-colour mark, accent reads `--cascivo-color-accent`
- `apps/site/public/logo.svg` — horizontal lockup (mark + wordmark)
- `apps/site/public/favicon.svg` — 32x32, one colour, follows the browser's dark mode
- `apps/site/public/icon.svg` — 512x512 raster source for the 180/192/512 PNGs (two colour)
- `apps/site/public/icon-mono.svg` — 512x512 raster source for `favicon.ico` (one colour)
- `apps/storybook/public/brand.svg`, `apps/storybook/public/favicon.svg` — Storybook manager chrome
- `apps/site/src/marketing/Logo.tsx` — the inline React lockup (`mark`, `mark-accent`, `horizontal`, `stacked`, `nav`)

### Usage

Ship the mark **inline, not as an `<img>`** — `currentColor` and the accent token only resolve when the SVG is part of the document. The SVG carries `role="img"` and a `<title>`; in a lockup where the wordmark is already present the mark is `aria-hidden` instead, so screen readers do not announce the name twice.

---

## How we got here (history)

`cascade-ui` collided with an existing UI library and no usable domain was available — `cascade.com`, `.io`, `.dev`, and every `get/use/try` prefix variant were taken. A search of ~130 domains across coinages and dictionary words found only longer invented words available. `cascivo.com` was purchased as the only candidate staying in the cascade family with a free `.com` and clean pronunciation.
