# ButtonGroup

Visually joins a set of related buttons into a single segmented control

## Install

```bash
npx cascivo add button-group
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
| `orientation` | `'horizontal' | 'vertical'` | no | `horizontal` | — |
| `size` | `'sm' | 'md' | 'lg'` | no | `md` | — |
| `roving` | `boolean` | no | `false` | — |
| `loop` | `boolean` | no | `false` | — |
| `aria-label` | `string` | no | — | — |
| `aria-labelledby` | `string` | no | — | — |

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
