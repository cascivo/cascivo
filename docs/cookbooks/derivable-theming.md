# Derivable theming — relative color, contrast-color, @property

cascivo themes don't hand-author every shade. A theme sets a few **base** colors
and *derives* the rest in CSS: hover/active ladders come from the base via
relative color syntax, on-color text comes from `contrast-color()`, and the
themeable properties are `@property`-registered so they interpolate. Every
progressive feature ships behind a **static fallback** so non-supporting
browsers render the designed value.

For the token tiers and brand-override recipe see [`THEMING.md`](../THEMING.md);
for the full token list see [`TOKENS.md`](../TOKENS.md).

> **The fallback contract is non-negotiable.** Every `oklch(from …)` /
> `contrast-color()` declaration is preceded by a static declaration of the
> **same property** in the same rule block. `pnpm fallback:check` enforces it for
> `contrast-color()` (and `@function`/`if()`); relative color syntax is
> baseline-supported, so it is allowed without a fallback — but the first-party
> themes pair it with one anyway so the value is pinned exactly.

---

## 1. Derive state variants with relative color syntax

Instead of restating `accent-hover`/`accent-active` as literals, derive them from
the base token. Relative color syntax lets a new color reuse channels of an
existing one (`l`, `c`, `h`), so the ramp re-tints when the base does:

```css
[data-theme='light'] {
  --cascivo-color-accent: oklch(0.52 0.2 250);

  /* hover = the accent, one lightness step darker */
  --cascivo-color-accent-hover: oklch(0.45 0.2 250); /* static fallback */
  --cascivo-color-accent-hover: oklch(from var(--cascivo-color-accent) 0.45 0.2 h);
}
```

The fallback is the exact literal; the derived form inherits the base **hue**
(`h`) so re-hueing the accent re-hues its hover. Hold the channels you want
shared, set the ones that differ — *"hold the hue and lightness, step the
chroma"* (and vice-versa). Use `calc()` to step a channel relative to the base:

```css
--cascivo-color-accent-hover: oklch(from var(--cascivo-color-accent) calc(l - 0.07) c h);
```

**When not to derive.** If a variant deliberately shifts hue (a stylized theme)
or points at a primitive (`var(--cascivo-blue-800)`), leave it literal — forcing
it through a formula would change the look. Derive the *mechanical* ladders only.

## 2. Auto-contrast on-color text with `contrast-color()`

Text on a colored surface should pick its own legible color. `contrast-color()`
returns a WCAG-passing black/white for a given background — so a re-tinted accent
can't silently drop its label below AA:

```css
--cascivo-color-text-on-accent: oklch(1 0 0); /* static fallback */
--cascivo-color-text-on-accent: contrast-color(var(--cascivo-color-accent));
```

The fallback is what non-supporting browsers render (and what the CI contrast
math is checked against), so keep it AA-passing on its own. Supporting browsers
get the guaranteed-contrast result on top.

## 3. Register themeable properties with `@property`

`@cascivo/tokens/properties.css` (loaded by `@cascivo/themes/all.css`) registers
the themeable color tokens as typed custom properties:

```css
@property --cascivo-color-accent {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(0.52 0.2 250);
}
```

This buys smooth **interpolation** when `[data-theme]` changes under a
`transition`, and a typed substrate for future `@container style()` work. Adding
a new themeable color prop? Register it here too.

## 4. Type by purpose, not by scale

Typography has one correct token per purpose (the same idea as the color semantic
tier). Use the **role** tokens, not the raw scale:

| Role token                  | Use for                              |
| --------------------------- | ------------------------------------ |
| `--cascivo-text-display`    | hero / marketing display             |
| `--cascivo-text-heading-lg` | page title (h1)                      |
| `--cascivo-text-heading-md` | section heading (h2)                 |
| `--cascivo-text-heading-sm` | subsection heading (h3)              |
| `--cascivo-text-body`       | default body copy                    |
| `--cascivo-text-body-sm`    | secondary / dense body copy          |
| `--cascivo-text-ui`         | **control & button labels**          |
| `--cascivo-text-label`      | form field labels                    |
| `--cascivo-text-caption`    | captions, helper text, metadata      |
| `--cascivo-text-code`       | inline code / mono                   |

The size tokens are scalar (one token = one `font-size`). Pair them with a
weight + line-height per role — e.g. a heading with
`var(--cascivo-font-semibold)` + `var(--cascivo-leading-tight)`, body with
`var(--cascivo-font-normal)` + `var(--cascivo-leading-normal)`. An agent can ask
the MCP `get_variant_matrix` for the `typography` family to resolve the right
token deterministically.
