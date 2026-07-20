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

| Prop     | Type                       | Required | Default   | Description                                  |
| -------- | -------------------------- | -------- | --------- | -------------------------------------------- |
| `label`  | `ReactNode`                | yes      | —         | Text label for the control.                  |
| `kind`   | `'on-page' \| 'disclosed'` | no       | `on-page` | Visual treatment — 'on-page' or 'disclosed'. |
| `action` | `ReactNode`                | no       | —         | Primary action shown in the component.       |

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

_Generated from registry v0.7.1 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
