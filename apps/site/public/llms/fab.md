# Fab

Floating action button anchored to a screen corner, with an optional speed-dial of secondary actions

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add fab
```

Or use it from the prebuilt package without copying:

```tsx
import { Fab } from '@cascivo/react'
```

## Category

`inputs`

## States

- `default`
- `open`
- `closed`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | yes | — | The main icon |
| `label` | `string` | yes | — | Accessible name for the button |
| `onClick` | `() => void` | no | — | Called when the element is clicked. |
| `actions` | `FabAction[]` | no | — | Speed-dial actions; each has a label, icon, onSelect, and optional disabled |
| `position` | `'bottom-end' \| 'bottom-start'` | no | `bottom-end` | Position of the component. |
| `open` | `boolean` | no | — | Whether the component is open (controlled). |
| `defaultOpen` | `boolean` | no | — | Whether the component is open on first render (uncontrolled). |
| `onOpenChange` | `(open: boolean) => void` | no | — | Called with the next open state when it changes. |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |

## Examples

### Single action

```tsx
<Fab label="Compose" onClick={compose}><PlusIcon /></Fab>
```

### Speed dial

The main button toggles a menu of secondary actions.

```tsx
<Fab
  label="Create"
  actions={[
    { label: 'New note', icon: <NoteIcon />, onSelect: newNote },
    { label: 'New folder', icon: <FolderIcon />, onSelect: newFolder },
  ]}
>
  <PlusIcon />
</Fab>
```

### Start corner

```tsx
<Fab label="Help" position="bottom-start" onClick={openHelp}><HelpIcon /></Fab>
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-content`
- `--cascivo-color-accent-hover`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-full`
- `--cascivo-shadow-overlay`
- `--cascivo-target-min-coarse`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-z-dropdown`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space, ArrowUp, ArrowDown, Home, End, Escape

## Dependencies

- `@cascivo/core`

## Tags

inputs, fab, floating-action-button, mobile, speed-dial
