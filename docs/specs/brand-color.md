# cascivo Brand Color Spec

## Tokens (--cascivo-brand-\*)

| Token                      | oklch value             | Approx hex | Usage                                                                                                                            |
| -------------------------- | ----------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--cascivo-brand-primary`  | `oklch(0.55 0.15 240)`  | `#0079bf`  | Hero bg, CTA button, logo gradient start                                                                                         |
| `--cascivo-brand-accent`   | `oklch(0.72 0.13 195)`  | `#00bdbe`  | Gradient end, accent UI, flow highlights                                                                                         |
| `--cascivo-brand-ink`      | `oklch(0.22 0.03 250)`  | `#101c28`  | Wordmark on light, body text on brand surfaces                                                                                   |
| `--cascivo-brand-paper`    | `oklch(0.99 0.005 250)` | `#f9fcff`  | Brand surface (hero, OG card background)                                                                                         |
| `--cascivo-brand-gradient` | —                       | —          | `linear-gradient(135deg, var(--cascivo-brand-primary), var(--cascivo-brand-accent))` — hero fill, logo gradient variant, OG card |

Hex values are gamma-corrected sRGB computed from the oklch values via the
project's own oklch→oklab→linear-sRGB conversion (see
`scripts/checks/color/cvd.ts`). They are reference-only; CSS should always use
the `oklch()` form.

## Contrast results

Ratios computed with WCAG 2.x relative luminance (linearised sRGB, IEC 61966-2-1).
WCAG AA requires ≥4.5:1 for normal text, ≥3:1 for large text and UI components.

| Pairing                         | Ratio   | WCAG AA (4.5:1 text / 3:1 UI)   |
| ------------------------------- | ------- | ------------------------------- |
| Ink on Paper (body text)        | 16.81:1 | ✅ passes both thresholds       |
| White on Primary (button label) | 4.78:1  | ✅ passes normal text           |
| Primary on Paper (links, large) | 4.64:1  | ✅ passes normal text           |
| Accent on Ink (accent on dark)  | 7.37:1  | ✅ passes both thresholds       |
| White on Accent                 | 2.35:1  | ❌ decorative/gradient use only |

## Notes

- **Brand tokens are for apps/logo/OG surfaces only** — never referenced in
  component CSS. Component tokens are `--cascivo-*` (later `--cascivo-*`) and
  are defined in `packages/tokens/`.
- **White on Accent** fails 3:1. Accent is a teal at L=0.72 — too light for
  white text. Use Ink (`#101c28`) for any text placed on an accent background.
- **Primary on Paper at 4.64:1** clears the 4.5:1 normal-text threshold. No
  lightness adjustment needed. If future brand updates shift Primary lighter,
  run the contrast script again before publishing.
- All five pairings were verified using the exact oklch conversion math in
  `scripts/checks/color/contrast.ts` and `scripts/checks/color/cvd.ts`.
