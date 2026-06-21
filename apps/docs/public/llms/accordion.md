# Accordion

Vertically stacked, collapsible content sections

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add accordion
```

Or use it from the prebuilt package without copying:

```tsx
import { Accordion } from '@cascivo/react'
```

## Category

`navigation`

## States

- `open`
- `closed`

## Props

| Prop            | Type            | Required           | Default | Description |
| --------------- | --------------- | ------------------ | ------- | ----------- | --- |
| `type`          | `'single'       | 'multiple'`        | no      | `single`    | —   |
| `defaultValue`  | `string         | string[]`          | no      | —           | —   |
| `value`         | `string         | string[]`          | no      | —           | —   |
| `onValueChange` | `(value: string | string[]) => void` | no      | —           | —   |

## Examples

### Single

```tsx
<Accordion type="single" defaultValue="a">
  <AccordionItem value="a">
    <AccordionTrigger>Section</AccordionTrigger>
    <AccordionContent>…</AccordionContent>
  </AccordionItem>
</Accordion>
```

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-radius-md`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

navigation, collapse, disclosure
