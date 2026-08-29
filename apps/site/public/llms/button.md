# Button

Triggers an action or event

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add button
```

Or use it from the prebuilt package without copying:

```tsx
import { Button } from '@cascivo/react'
```

## Category

`inputs`

## Variants

- `primary`
- `secondary`
- `ghost`
- `destructive`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `idle`
- `loading`

## Props

| Prop       | Type                                                   | Required | Default   | Description                                                                                                                                            |
| ---------- | ------------------------------------------------------ | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `variant`  | `'primary' \| 'secondary' \| 'ghost' \| 'destructive'` | no       | `primary` | `primary` for the main action, `secondary` for a supporting one, `ghost` for a borderless action in dense UI, `destructive` for anything that deletes. |
| `size`     | `'sm' \| 'md' \| 'lg'`                                 | no       | `md`      | Visual size of the component (e.g. 'sm', 'md', 'lg').                                                                                                  |
| `loading`  | `boolean`                                              | no       | `false`   | When true, shows a loading state.                                                                                                                      |
| `disabled` | `boolean`                                              | no       | `false`   | When true, disables the control and removes it from the tab order.                                                                                     |
| `asChild`  | `boolean`                                              | no       | `false`   | When true, renders the child element as the root via Slot, merging props (polymorphic rendering).                                                      |
| `onClick`  | `React.MouseEventHandler<HTMLButtonElement>`           | no       | —         | Called when the element is clicked.                                                                                                                    |

## Examples

### Primary

```tsx
<Button>Click me</Button>
```

### Loading

```tsx
<Button loading>Saving…</Button>
```

### Destructive

```tsx
<Button variant="destructive">Delete</Button>
```

### As link

Render button styling on a real anchor (keeps middle-click / open-in-new-tab).

```tsx
<Button asChild>
  <a href="/pricing">View pricing</a>
</Button>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-hover`
- `--cascivo-color-accent-active`
- `--cascivo-color-text-on-accent`
- `--cascivo-color-destructive`
- `--cascivo-radius-button`
- `--cascivo-focus-ring`
- `--cascivo-disabled-opacity`
- `--cascivo-text-ui`
- `--cascivo-text-body`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

action, form, interactive

---

_Generated from registry v1.0.0 on 2026-08-29. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
