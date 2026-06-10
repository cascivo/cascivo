# Accordion

Vertically stacked, collapsible content sections

## Install

```bash
npx cascade add accordion
```

## Category

`navigation`

## States

- `open`
- `closed`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `type` | `'single' | 'multiple'` | no | `single` | — |
| `defaultValue` | `string | string[]` | no | — | — |
| `value` | `string | string[]` | no | — | — |
| `onValueChange` | `(value: string | string[]) => void` | no | — | — |

## Examples

### Single

```tsx
<Accordion type="single" defaultValue="a"><AccordionItem value="a"><AccordionTrigger>Section</AccordionTrigger><AccordionContent>…</AccordionContent></AccordionItem></Accordion>
```

## Design tokens

- `--cascade-color-border`
- `--cascade-color-bg-subtle`
- `--cascade-color-text`
- `--cascade-radius-md`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascade-ui/core`

## Tags

navigation, collapse, disclosure
