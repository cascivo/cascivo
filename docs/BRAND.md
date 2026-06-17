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

### Mark concept

Three descending, offset rounded bars — a cascade/waterfall whose outer contour reads as a "C" (for cascivo). Echoes both the CSS cascade and the token cascade (primitive → semantic → component).

### Wordmark

Lowercase `cascivo` in a geometric sans (system font stack, no external font dependency).

### Lockups

- **Primary:** mark + wordmark (horizontal)
- **Mark-only:** for favicon, app icon, and small contexts

### Asset locations

- `apps/landing/public/logo.svg` — full logo (mark + wordmark), theme-aware
- `apps/landing/public/logo-mark.svg` — mark only (favicon source)
- `apps/landing/public/favicon.svg` — 32×32 viewport

### Usage

The logo uses `currentColor` for its monochrome variant and `--cascivo-brand-*` CSS variables for its gradient/color variant. It adapts to `data-theme` automatically.

---

## How we got here (history)

`cascade-ui` collided with an existing UI library and no usable domain was available — `cascade.com`, `.io`, `.dev`, and every `get/use/try` prefix variant were taken. A search of ~130 domains across coinages and dictionary words found only longer invented words available. `cascivo.com` was purchased as the only candidate staying in the cascade family with a free `.com` and clean pronunciation.
