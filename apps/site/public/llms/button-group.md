# ButtonGroup

Visually joins a set of related buttons into a single segmented control

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add button-group
```

Or use it from the prebuilt package without copying:

```tsx
import { ButtonGroup } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `idle`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | no | `horizontal` | Layout orientation of the component. |
| `size` | `'sm' \| 'md' \| 'lg'` | no | `md` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `roving` | `boolean` | no | `false` | When true, uses roving tabindex so arrow keys move focus between buttons. |
| `loop` | `boolean` | no | `false` | When true, navigation wraps around from end to start. |
| `aria-label` | `string` | no | — | Accessible label used when no visible label is present. |
| `aria-labelledby` | `string` | no | — | Id of the element that labels this component. |

## Examples

### Joined actions

```tsx
<ButtonGroup aria-label="Text alignment"><Button>Left</Button><Button>Center</Button><Button>Right</Button></ButtonGroup>
```

### Vertical with roving focus

```tsx
<ButtonGroup orientation="vertical" roving aria-label="View"><Button>List</Button><Button>Grid</Button></ButtonGroup>
```

## Design tokens

- `--cascivo-button-radius`
- `--cascivo-radius-control`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`
- **Keyboard:** ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Home, End

## Dependencies

- `@cascivo/core`

## Tags

action, segmented, toolbar, layout

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
