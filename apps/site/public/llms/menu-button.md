# MenuButton

A button that opens an anchored action menu of one-shot commands

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add menu-button
```

Or use it from the prebuilt package without copying:

```tsx
import { MenuButton } from '@cascivo/react'
```

## Category

`navigation`

## Variants

- `primary`
- `secondary`
- `ghost`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `open`
- `closed`

## Props

| Prop       | Type                                  | Required | Default       | Description                                             |
| ---------- | ------------------------------------- | -------- | ------------- | ------------------------------------------------------- |
| `label`    | `ReactNode`                           | yes      | —             | Trigger button content                                  |
| `items`    | `MenuButtonItem[]`                    | yes      | —             | Action items: { id, label, onSelect?, disabled? }       |
| `variant`  | `'primary' \| 'secondary' \| 'ghost'` | no       | `'secondary'` | Trigger visual variant                                  |
| `size`     | `'sm' \| 'md' \| 'lg'`                | no       | `'md'`        | Trigger size                                            |
| `disabled` | `boolean`                             | no       | `false`       | Disables the trigger                                    |
| `align`    | `'start' \| 'end'`                    | no       | `'start'`     | Aligns the menu to the start or end edge of the trigger |
| `labels`   | `{ open?: string }`                   | no       | —             | Override the trigger accessible name                    |

## Examples

### Basic action menu

A secondary button that opens a list of actions

```tsx
<MenuButton
  label="Actions"
  items={[
    { id: 'edit', label: 'Edit', onSelect: () => edit() },
    { id: 'duplicate', label: 'Duplicate', onSelect: () => duplicate() },
    { id: 'delete', label: 'Delete', onSelect: () => remove(), disabled: !canDelete },
  ]}
/>
```

### End-aligned, primary

Aligns the menu to the trigger end edge

```tsx
<MenuButton
  label="Create"
  variant="primary"
  align="end"
  items={[
    { id: 'doc', label: 'New document', onSelect: createDoc },
    { id: 'folder', label: 'New folder', onSelect: createFolder },
  ]}
/>
```

## Design tokens

- `--cascivo-color-primary`
- `--cascivo-color-primary-fg`
- `--cascivo-color-primary-hover`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-control`
- `--cascivo-radius-overlay`
- `--cascivo-radius-item`
- `--cascivo-shadow-md`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-z-dropdown`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `menu`
- **Keyboard:** ArrowDown, ArrowUp, Enter, Space, Escape, Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

navigation, menu, actions, dropdown, floating

---

_Generated from registry v0.10.1 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
