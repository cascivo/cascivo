# Layout & spacing without inline styles

If you reached for `style={{ display: 'flex', gap: 16 }}` while building with
cascivo, this page is for you. cascivo **does** ship layout primitives and a
documented spacing scale — they just live under the `layout/` namespace. `Flex`
is the gap-based flex container. This recipe maps the names you expect to the
ones that exist, and replaces inline-style drift with primitives + tokens.

> **Why no utility classes?** cascivo is deliberately modern-CSS-only — no
> Tailwind, no `gap-4`/`p-2` utility layer (see CLAUDE.md, Core Principle 3). The
> sanctioned answer to layout is **primitives + `var(--cascivo-space-N)`**, both
> documented below. If you're already on Tailwind and want utilities too, see
> [`USING-WITH-TAILWIND.md`](../USING-WITH-TAILWIND.md).

---

## The name map

| You might look for      | Use in cascivo                       | Install                          |
| ----------------------- | ------------------------------------ | -------------------------------- |
| `Flex`, `HStack`/`VStack` | `Flex` (with `direction`)          | `cascivo add flex`               |
| `Box`, container/wrapper  | `Flex` or `Section`                | `cascivo add flex` / `section`   |
| CSS Grid                  | `Grid`, `AutoGrid`, `Columns`      | `cascivo add grid` / `auto-grid` |
| Vertical rhythm / `Gap`   | `Spacer`                           | `cascivo add spacer`             |
| Centered page column      | `Center`                           | `cascivo add center`             |

`cascivo add flex` resolves to `layout/flex` automatically (bare names match
their namespaced entry). The aliases above also resolve: `cascivo add box`
installs `layout/flex`.

---

## Before / after

### A toolbar row

```tsx
// ❌ inline-style drift
<div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
  <h2>Deployments</h2>
  <Button>New</Button>
</div>
```

```tsx
// ✅ Flex — gap is a spacing-scale step, not a magic number
import { Flex } from '@cascivo/react' // or copy in: cascivo add flex
;<Flex direction="horizontal" gap={4} align="center" justify="between">
  <h2>Deployments</h2>
  <Button>New</Button>
</Flex>
```

`gap={4}` resolves to `var(--cascivo-space-4)` (1rem). `Flex` props:
`direction` (`'vertical'` default | `'horizontal'`), `gap` (a space step),
`align` (`start|center|end|stretch`), `justify` (`start|center|end|between`),
`wrap`.

### A responsive card grid (no media queries)

```tsx
// ❌
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))', gap: 16 }}>
  {projects.map((p) => <ProjectCard key={p.id} {...p} />)}
</div>
```

```tsx
// ✅ AutoGrid fills columns by available width — no @media needed
import { AutoGrid } from './components/layout/auto-grid' // cascivo add auto-grid
;<AutoGrid min="16rem" gap={4}>
  {projects.map((p) => <ProjectCard key={p.id} {...p} />)}
</AutoGrid>
```

For a fixed column count that collapses on narrow screens, use `Columns`
(`count={2|3|4}`); for a 12-column grid with spans, use `Grid` + `GridItem`.

### A centered page column

```tsx
// ❌  <div style={{ maxWidth: '48rem', marginInline: 'auto' }}>…</div>
// ✅
import { Center } from './components/layout/center' // cascivo add center
;<Center maxWidth="48rem">…</Center>
```

---

## When you still need custom CSS

Reach for a CSS module and the **spacing scale**, not inline styles with magic
numbers:

```css
/* my-panel.module.css */
.panel {
  display: grid;
  gap: var(--cascivo-space-3); /* 0.75rem */
  padding: var(--cascivo-space-5); /* 1.25rem */
}
```

The full scale is `--cascivo-space-0` through `--cascivo-space-24` — see
[`../TOKENS.md`](../TOKENS.md) for every step and its rem value. Using the tokens
(instead of `16px`) keeps your custom layout consistent with the primitives and
re-scales with the system.

**Don't** hand-roll utility classes (`.gap-4 { gap: 1rem }`) — that re-introduces
the parallel system cascivo deliberately avoids. The primitives + tokens are the
supported surface.
