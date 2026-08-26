# ContainedList

Labelled list of rows inside a bordered container

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add contained-list
```

Or use it from the prebuilt package without copying:

```tsx
import { ContainedList } from '@cascivo/react'
```

## Category

`display`

## Variants

- `on-page`
- `disclosed`

## Props

| Prop     | Type                       | Required | Default   | Description                                     |
| -------- | -------------------------- | -------- | --------- | ----------------------------------------------- |
| `label`  | `ReactNode`                | yes      | —         | Text label for the control. Rendered on screen. |
| `kind`   | `'on-page' \| 'disclosed'` | no       | `on-page` | Visual treatment — 'on-page' or 'disclosed'.    |
| `action` | `ReactNode`                | no       | —         | Primary action shown in the component.          |

## Examples

### Basic contained list

```tsx
<ContainedList label="Members">
  <ContainedListItem>Ada Lovelace</ContainedListItem>
  <ContainedListItem>Alan Turing</ContainedListItem>
</ContainedList>
```

### Interactive rows

```tsx
<ContainedList label="Settings" kind="disclosed">
  <ContainedListItem asChild>
    <button type="button" onClick={open}>
      Profile
    </button>
  </ContainedListItem>
</ContainedList>
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-surface`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`
- **Keyboard:** Tab, Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

list, container, rows, group

---

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
