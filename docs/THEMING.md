# Theming & branding cascivo

cascivo is a token-driven design system: every component reads CSS custom
properties (`--cascivo-*`), and a **theme** is just a set of those properties
scoped to a `data-theme` value. You match a brand by overriding tokens — never by
forking components. This page is the end-to-end recipe.

For the underlying cascade-layer rules see
[`CSS-LAYERS-PITFALL.md`](./CSS-LAYERS-PITFALL.md); for the full token list see
[`TOKENS.md`](./TOKENS.md).

---

## The three token tiers

```
Primitive  --cascivo-blue-500: oklch(…)            raw scale (rarely override)
    ↓
Semantic   --cascivo-color-accent: var(--…-blue-500)  intent — themes remap THIS tier
    ↓
Component  --cascivo-button-bg: var(--…-accent)      per-component usage (brand exceptions)
```

**Override the semantic tier for a brand.** Drop to the component tier only for
one-off exceptions (e.g. a pill-shaped badge in an otherwise sharp theme).

---

## How `data-theme` selection works

First-party themes scope their tokens to two selectors:

```css
@layer cascivo.theme {
  [data-theme='light'],
  :root:not([data-theme]) {
    --cascivo-color-accent: …;
  }
}
```

- `[data-theme='light']` activates when you set `data-theme="light"` on any
  element — themes are **scopable to any subtree**, not just `:root`.
- `:root:not([data-theme])` is the **pre-hydration / no-attribute default** so an
  app with no `data-theme` still renders themed.

Apply a theme by setting the attribute on any container:

```tsx
<main data-theme="dark">…</main>
```

---

> **Using Tailwind v4?** See [`USING-WITH-TAILWIND.md`](./USING-WITH-TAILWIND.md)
> for coexisting token layers, a one-attribute dark-mode bridge, and mapping
> cascivo semantics onto Tailwind's `--color-*` utilities.

## The specificity footgun (read this before writing a brand theme)

`:root:not([data-theme])` has specificity **(0,2,0)** — higher than a plain
`:root` **(0,1,0)**. So this **silently loses** in the no-`data-theme` state:

```css
/* ❌ loses to the default theme before data-theme is set */
:root {
  --cascivo-color-accent: var(--brand-emerald);
}
```

Two ways to win, in order of preference:

**1. Mirror the theme's selectors and import your brand file last.** Same layer,
same selector list — source order inside `@layer cascivo.theme` then decides, and
last wins:

```css
/* my-theme.css — imported AFTER the cascivo themes */
@layer cascivo.theme {
  [data-theme='light'],
  :root:not([data-theme]) {
    --cascivo-color-accent: var(--brand-emerald);
    --cascivo-color-accent-hover: var(--brand-emerald-600);
  }
}
```

**2. Override from an unlayered stylesheet or a layer ordered after
`cascivo.component`.** Unlayered author CSS beats every cascivo layer regardless
of specificity (see `CSS-LAYERS-PITFALL.md`), so a plain unlayered `:root { … }`
also works — but only if it is genuinely unlayered everywhere it loads.

### Recommended: a brand indirection variable

To override **one** knob at `:root` without fighting specificity or mirroring
selectors, point a semantic token at your own brand variable with a fallback,
then set only the brand variable:

```css
/* once, in your brand layer */
@layer cascivo.theme {
  [data-theme='light'],
  :root:not([data-theme]) {
    --cascivo-color-accent: var(--brand-accent, oklch(0.623 0.214 250));
  }
}

/* anywhere, plain :root — no specificity fight */
:root {
  --brand-accent: oklch(0.7 0.17 155); /* emerald */
}
```

---

## The real override surface

A brand almost always touches more than the accent color. These are the token
groups most teams retune — set them in the same `@layer cascivo.theme` block.

### Semantic colors (canonical names)

Override these, not the primitives. Each has `-hover`/`-active`/`-subtle`/
`-content` companions where relevant — see [`TOKENS.md`](./TOKENS.md) for the
full table and which aliases are kept for back-compat.

| Role        | Canonical token                  |
| ----------- | -------------------------------- |
| Page bg     | `--cascivo-color-background`     |
| Surface     | `--cascivo-color-surface`        |
| Body text   | `--cascivo-color-foreground`     |
| Muted text  | `--cascivo-color-text-muted`     |
| Border      | `--cascivo-color-border`         |
| Accent      | `--cascivo-color-accent`         |
| On-accent   | `--cascivo-color-text-on-accent` |
| Destructive | `--cascivo-color-destructive`    |
| Success     | `--cascivo-color-success`        |

> Some roles ship synonyms (`-foreground`/`-text`, `-content`/`-foreground`,
> `danger`/`destructive`/`error`). The table above lists the canonical name;
> aliases resolve to it for back-compat. Prefer the canonical name in new code.

### Radius — per role, not just one knob

`--cascivo-radius-base` derives a whole family by multiplier, which is convenient
but rarely matches a real brand (e.g. control=10px, card=14px, modal=20px,
badge=full). Set the **per-role** tokens directly when one knob isn't enough:

```css
--cascivo-radius-control: 0.625rem; /* 10px — buttons, inputs */
--cascivo-radius-field: 0.625rem;
--cascivo-radius-surface: 0.875rem; /* 14px — cards */
--cascivo-radius-overlay: 1.25rem; /* 20px — modals, popovers */
--cascivo-radius-item: 0.25rem; /* menu/list rows */
```

### Control heights

Defaults are **32 / 40 / 48px** (sm/md/lg). Many systems run taller — override
all three as first-class brand tokens:

```css
--cascivo-control-height-sm: 2.25rem; /* 36px */
--cascivo-control-height-md: 3rem; /* 48px */
--cascivo-control-height-lg: 3.5rem; /* 56px */
```

### Typography

Set the font stacks once (they cascade to all components and, via
`@cascivo/themes/base`, to plain markup):

```css
--cascivo-font-sans: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
--cascivo-font-mono: 'DM Mono', ui-monospace, monospace;
--cascivo-font-display: var(--cascivo-font-sans); /* headline/brand face */
```

The type scale runs `--cascivo-text-xs … --cascivo-text-4xl` (plus `-fluid`
variants). Override individual steps if your brand's scale differs.

---

## Putting it together — a starter brand theme

```css
/* my-theme.css — import LAST, after @cascivo/themes/light + dark */
@layer cascivo.theme {
  [data-theme='light'],
  :root:not([data-theme]) {
    --cascivo-color-accent: oklch(0.7 0.17 155);
    --cascivo-color-accent-hover: oklch(0.66 0.17 155);
    --cascivo-color-text-on-accent: oklch(1 0 0);

    --cascivo-radius-control: 0.625rem;
    --cascivo-radius-surface: 0.875rem;
    --cascivo-radius-overlay: 1.25rem;

    --cascivo-control-height-md: 3rem;

    --cascivo-font-sans: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  }

  [data-theme='dark'] {
    --cascivo-color-accent: oklch(0.74 0.16 155);
  }
}
```

Import order (see also the [`@cascivo/react` README](../packages/react/README.md)):

```ts
import '@cascivo/react/styles.css' // components
import '@cascivo/themes/all' // tokens (once) + base typography + light & dark
import './my-theme.css' // brand overrides — MUST be last
```

---

## Authoring a brand-new named theme

To ship a fully custom theme value (e.g. `data-theme="brand"`), copy the shape of
a first-party theme: scope every semantic token under `[data-theme='brand']`
inside `@layer cascivo.theme`, declare the **full** token set (so nothing falls
back to another theme), and import it after the tokens. Use an existing theme
file in `packages/themes/src/` as the canonical checklist of tokens to define.

---

## Deriving instead of hand-authoring

Themes derive their hover/active ladders and on-color text rather than restating
every shade: relative color syntax (`oklch(from var(--base) …)`),
`contrast-color()`, and `@property`-registered tokens, all behind static
fallbacks. See the [Derivable theming cookbook](./cookbooks/derivable-theming.md).

---

## Why `[data-theme]`, not `light-dark()`

The CSS `light-dark()` function resolves a **two-way** light/dark pair off the
computed `color-scheme`. cascivo ships **twelve** themes
(`light, dark, warm, flat, minimal, midnight, pastel, brutalist, corporate,
terminal, cyberpunk, arcade`) and scopes them to **any container** via the
`[data-theme]` attribute. `light-dark()` cannot express `warm` vs `brutalist`,
and keying on `color-scheme` would collapse container-scoped multi-theming to a
binary — so cascivo keeps `[data-theme]`. `light-dark()` *could* be used narrowly
inside the light/dark pair, but it buys little over the attribute system already
in place, so the first-party themes do not use it.

## `@container style()` palette branching — deferred

A component's text palette can branch by the surface it sits on, via a registered
`--contrast-color` custom property + `@container style()` queries. It is powerful
micro-theming, but advanced and orthogonal to cascivo's current derive-and-
disambiguate model, and gated on broader `@container style()` support. It is a
**future-roadmap candidate**, not shipped today; the `@property` registrations in
`@cascivo/tokens/properties.css` are the substrate a future implementation would
build on.

## OKLCH is the floor

Every cascivo color — primitive and semantic — is already OKLCH (see
`packages/tokens/src/index.css`). The common "use OKLCH so machines can derive
in-system shades" advice is therefore already satisfied; the *derivation* layer
(relative color, `contrast-color()`) is built on top of it.
