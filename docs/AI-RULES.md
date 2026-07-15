# AI rules for building with cascivo

Drop this into your AI agent's system prompt, Cursor rules (`.cursor/rules`), or
`AGENTS.md` / `CLAUDE.md` so it generates CSS that keeps cascivo's cascade intact.
`cascivo create` scaffolds an `AGENTS.md` with the same contract automatically; this
page is for **existing** projects.

## The CSS layer contract (copy-paste)

```md
## cascivo CSS layer contract

cascivo styles live in CSS cascade layers. Layer order beats selector specificity, so
follow these rules whenever you generate or edit CSS:

1. Every declaration goes inside an `@layer` block. Unlayered CSS beats all layers
   regardless of specificity — never emit it.
2. Never invent layer names. Write only: the app's own slot (e.g. `cascivo.example`,
   declared in the order statement) for page/app styles, and
   `@layer cascivo.override { … }` for hotfixes / one-off overrides — it beats
   everything cascivo ships.
3. Never nest layers deeper than the shipped `cascivo.blocks.<name>` pattern. For
   sub-elements (a badge in a card, a dot in a badge) use native CSS nesting inside one
   layer block, not new sublayers.
4. Third-party CSS: `@import url('lib/styles.css') layer(vendor);` with `vendor`
   declared before the cascivo layers. Don't import vendor CSS from JavaScript — route
   it through a CSS file, or use `@cascivo/vite-plugin` (`cascivoLayers`) to layer it.
5. Style with `--cascivo-*` tokens, not raw values.

Canonical layer order (lowest → highest priority):
`@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.theme, cascivo.blocks, cascivo.override;`

The full machine-readable guide is at https://cascivo.com/llms.txt.
```

## Overriding styles the sanctioned way

Every cascivo component spreads `{...props}` onto its root element, so `style` and
`className` **already pass through on every component** — you do not need (and there is
no) `sx`/`css` styling prop. When a component's props and tokens don't cover a one-off,
climb this ladder in order and stop at the first rung that works:

1. **Component props + tokens** — the intended path. `variant`, `size`, and setting a
   `--cascivo-*` component token cover almost everything.
2. **`className` + a rule in `cascivo.override`** — for a reusable override. The
   `cascivo.override` layer beats everything cascivo ships.
3. **Inline `style` with `var(--cascivo-*)` values** — for a fast one-off. This stays
   `cascivo audit --ai`-clean because the values are tokens.
4. **`/* cascivo-audit: allow <rule> */`** — the rare remainder. A comment on the same
   line as, or the line above, a flagged line downgrades that finding so the audit no
   longer fails on it (e.g. `allow unknown-prop`, `allow hardcoded-value`, or `allow all`).
   Suppressed findings still print, so nothing is hidden.

`cascivo audit --ai` treats an inline `style` value that happens to equal a token as a
gentle **warning**, not an error — it never blocks a build on a fast-prototyping override.
Genuinely invented props (`sx`, `elevation`, …) remain errors; use rung 4 only when you
mean it.

## Layout primitives — structure with these before writing CSS

Page structure (dashboard shells, toolbars, card grids, multi-column sections) has
first-class primitives, all exported from `@cascivo/react` — reach for them before
hand-writing grid/flex CSS or inline `style` layout:

- **`Flex`** — the gap-based flex container (`direction`, `gap`, `align`, `justify`, `wrap`).
- **`Grid`** / **`GridItem`** — CSS grid with responsive object props:
  `<Grid cols={{ base: 1, md: 2, lg: 3 }} gap={4}>`, `<GridItem span={{ base: 1, lg: 2 }}>`.
- **`AutoGrid`** — responsive card grid that fills columns by available width, no media queries.
- **`Columns`**, **`Center`**, **`Spacer`** — equal columns, centered max-width column, fixed gap.

The published `Stack` is a visual card-pile (overlaps children by an `offset`) — for
gap-based layout use `Flex`, not `Stack`.

## Coming from utility-first (Tailwind)?

cascivo has no utility classes. You express the same intent with plain CSS properties
reading `--cascivo-*` tokens, inside a layer. The mapping is mechanical:

| Tailwind utility | cascivo CSS (inside `@layer …`) |
| ---------------- | ------------------------------- |
| `p-4` | `padding: var(--cascivo-space-4);` |
| `px-2` | `padding-inline: var(--cascivo-space-2);` |
| `gap-2` | `gap: var(--cascivo-space-2);` |
| `flex items-center` | `display: flex; align-items: center;` |
| `flex items-center gap-2` | `display: flex; align-items: center; gap: var(--cascivo-space-2);` |
| `text-sm` | `font-size: var(--cascivo-text-sm);` |
| `text-muted-foreground` | `color: var(--cascivo-color-text-subtle);` |
| `font-semibold` | `font-weight: var(--cascivo-font-semibold);` |
| `rounded-md` | `border-radius: var(--cascivo-radius-md);` |
| `bg-card` | `background: var(--cascivo-color-surface);` |

Two habit changes:

- **Structure vs. style split.** Markup stays semantic; all styling lives in a CSS
  module inside a layer. You are not decorating JSX with class strings.
- **Tokens, not values.** Reach for a `--cascivo-*` token instead of a raw `16px` /
  `#111`. The closed token set is at
  [`https://cascivo.com/tokens.catalog.json`](https://cascivo.com/tokens.catalog.json)
  and documented in [TOKENS.md](./TOKENS.md).

## See also

- [CSS-LAYERS-PITFALL.md](./CSS-LAYERS-PITFALL.md) — the canonical order and the
  `cascivo.override` escape hatch.
- [THIRD-PARTY-CSS.md](./THIRD-PARTY-CSS.md) — the `layer(vendor)` recipe.
- [USING-WITH-TAILWIND.md](./USING-WITH-TAILWIND.md) — running cascivo alongside an
  existing Tailwind v4 setup.
- [TOKENS.md](./TOKENS.md) — the full token catalog.
