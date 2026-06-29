# Using cascivo with Tailwind v4

**Short version: they coexist.** cascivo ships real stylesheets and themes via CSS
`@layer` + a `data-theme` attribute; Tailwind v4 ships utilities + its own tokens.
The only friction is that, left alone, the two use **different dark-mode
mechanisms** (`data-theme="dark"` vs a `.dark` class) and **two unrelated token
namespaces** (`--cascivo-*` vs Tailwind's `--color-*`). This page — and the opt-in
`@cascivo/themes/tailwind.css` bridge — removes both, without changing either
token system.

This is the page the dashboard-integration feedback asked for: a clear answer to
"do I abandon Tailwind's tokens, override them, or keep both?"

---

## TL;DR

```css
/* app.css — processed by Tailwind v4 */
@import 'tailwindcss';
@import '@cascivo/tokens';            /* primitive tokens */
@import '@cascivo/themes/light.css';  /* @imports tokens + light semantics */
@import '@cascivo/themes/dark.css';   /* dark semantics, keyed [data-theme='dark'] */
@import '@cascivo/themes/tailwind.css'; /* the bridge — LAST */
```

```html
<!-- One attribute drives BOTH cascivo and Tailwind dark: utilities -->
<html data-theme="dark">
```

That's it. cascivo components are themed by `data-theme`; Tailwind's `dark:`
utilities now respond to the **same** attribute; and utilities like `bg-accent` /
`text-foreground` resolve to cascivo's semantic tokens.

---

## 1. The `@layer` order

CSS `@layer` decides precedence regardless of selector specificity. Import order
sets layer order, so put Tailwind first and the cascivo layers after, with the
bridge last:

```
tailwind (base, components, utilities)   ← Tailwind's own layers
cascivo.tokens  <  cascivo.base  <  cascivo.theme  <  cascivo.component
```

Two practical consequences:

- **Unlayered author CSS still beats every layered rule** — yours and cascivo's
  and Tailwind's utilities-in-a-layer. That's normal CSS cascade; see
  [`CSS-LAYERS-PITFALL.md`](./CSS-LAYERS-PITFALL.md).
- If a Tailwind utility and a cascivo component rule collide on the same element,
  add the utility you want to win as an **unlayered** class, or scope it — don't
  fight specificity.

## 2. Dark mode — pick the attribute, bridge the class

cascivo keys dark mode on `[data-theme='dark']`; Tailwind v4 defaults its `dark:`
variant to a `.dark` class. Importing both naively means two toggles. The bridge
(`@cascivo/themes/tailwind.css`) re-points Tailwind's `dark:` variant at cascivo's
attribute:

```css
/* what the bridge does, via a Tailwind v4 @custom-variant */
@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));
```

Now a single `data-theme="dark"` on `<html>` (or any subtree — cascivo themes are
scopable) drives **both** cascivo components and your `dark:` utilities. No `.dark`
class, no JS that toggles two things, no duplicated token values.

> **Prefer Tailwind's `.dark` class instead?** Keep it, and set `data-theme` from
> the same toggle so cascivo follows:
> `el.classList.toggle('dark', isDark); el.dataset.theme = isDark ? 'dark' : 'light'`.
> Don't run two independent dark-mode states.

## 3. Tokens — keep both, override, or pick one?

**Recommendation: keep cascivo's semantic tokens as the source of truth, and
bridge them into Tailwind's `--color-*` namespace.** The bridge does this with
`@theme inline`:

```css
@theme inline {
  --color-background: var(--cascivo-color-background);
  --color-foreground: var(--cascivo-color-foreground);
  --color-accent: var(--cascivo-color-accent);
  --color-border: var(--cascivo-color-border);
  /* …destructive, success, warning, info, surface, muted */
}
```

After this, `bg-background`, `text-foreground`, `border-border`, `bg-accent`,
etc. resolve to cascivo values and re-theme automatically when `data-theme`
changes (that's what `inline` buys you — the var is read at use-site). You get
Tailwind's utility ergonomics with cascivo's palette, and there is exactly **one**
place to change a color: the cascivo semantic token.

To re-brand, override the cascivo semantic token at `:root` (see
[`THEMING.md`](./THEMING.md)) — both cascivo components and the bridged Tailwind
utilities pick it up:

```css
:root {
  --cascivo-color-accent: oklch(0.62 0.19 150); /* emerald brand */
}
```

**Don't** maintain two divergent palettes (a Tailwind `@theme` block *and*
cascivo tokens with different values) — that is the "two parallel token layers"
pain the feedback hit. Bridge one into the other instead.

## 4. Gotchas

- **`@function` + minifiers.** Tailwind v4's lightningcss minifier silently drops
  CSS `@function` rules. cascivo never auto-imports `@cascivo/tokens/functions.css`
  for exactly this reason, and every `@function` call has a static fallback — so
  you're safe by default. Only opt into `functions.css` if your pipeline supports
  it. See [`COMPATIBILITY.md`](./COMPATIBILITY.md).
- **Specificity of `:root:not([data-theme])`.** The light theme's pre-hydration
  fallback selector is `(0,2,0)` — higher than a plain `:root`. If a brand
  override at `:root` "loses" before hydration, mirror the theme's selector or set
  `data-theme` early. See the footgun section in [`THEMING.md`](./THEMING.md).
- **Outside Tailwind, the bridge is inert.** `@custom-variant` and `@theme` are
  Tailwind v4 directives; in a non-Tailwind build they're unknown at-rules and are
  ignored, so importing `@cascivo/themes/tailwind.css` elsewhere does nothing
  harmful (but also nothing useful — only import it in a Tailwind pipeline).

---

## Do I even need Tailwind?

If you're starting fresh, you don't — cascivo's layout primitives (`Stack`,
`Grid`, `AutoGrid`, …) and the `--cascivo-space-*` scale cover layout without a
utility framework (see [`cookbooks/layout-and-spacing.md`](./cookbooks/layout-and-spacing.md)).
But if Tailwind is already in your project, this bridge lets the two live together
cleanly instead of forcing a migration.
