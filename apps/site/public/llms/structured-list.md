# StructuredList

Tabular row list for scannable data, optionally single-selectable

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add structured-list
```

Or use it from the prebuilt package without copying:

```tsx
import { StructuredList } from '@cascivo/react'
```

## Category

`display`

## Variants

- `static`
- `selectable`

## States

- `default`
- `selected`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | no | — | Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Neither is deprecated. Not rendered — screen readers only. |
| `ariaLabel` | `string` | no | — | Invisible accessible name. The catalog convention; the DOM spelling `aria-label` is accepted as an alias so either guess compiles. Not rendered — screen readers only. |
| `aria-label` | `string` | no | — | Accessible label for the list table. |
| `items` | `{ id: string; cells: ReactNode[]; selected?: boolean }[]` | yes | — | The items to render. |
| `headers` | `ReactNode[]` | no | — | The column header cells. |
| `selectable` | `boolean` | no | `false` | When true, rows can be selected. |
| `value` | `string` | no | — | The controlled value. |
| `defaultValue` | `string` | no | — | The initial value when uncontrolled. |
| `onSelect` | `(id: string) => void` | no | — | Called with the selected value. |

## Examples

### Static

```tsx
<StructuredList headers={["Name", "Role"]} items={[{ id: "a", cells: ["Ada", "Engineer"] }]} />
```

### Selectable

```tsx
<StructuredList selectable defaultValue="a" items={[{ id: "a", cells: ["Ada"] }, { id: "b", cells: ["Grace"] }]} onSelect={(id) => set(id)} />
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-primary`
- `--cascivo-color-surface`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `table`
- **Keyboard:** ArrowDown, ArrowUp, Home, End, Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

display, list, table, data

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
