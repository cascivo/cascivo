# Kbd

Displays a keyboard key or shortcut

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add kbd
```

Or use it from the prebuilt package without copying:

```tsx
import { Kbd } from '@cascivo/react'
```

## Category

`display`

## Sizes

- `sm`
- `md`

## Props

| Prop   | Type  | Required | Default | Description |
| ------ | ----- | -------- | ------- | ----------- | --- |
| `size` | `'sm' | 'md'`    | no      | `md`        | —   |

## Examples

### Single key

```tsx
<Kbd>⌘</Kbd>
```

### Shortcut

Compose multiple keys to show a shortcut

```tsx
<span>
  <Kbd>⌘</Kbd> + <Kbd>K</Kbd>
</span>
```

### Small

```tsx
<Kbd size="sm">Esc</Kbd>
```

## Design tokens

- `--cascivo-color-text-subtle`
- `--cascivo-color-surface-raised`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-sm`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `kbd`

## Dependencies

- `@cascivo/core`

## Tags

keyboard, shortcut, hotkey
