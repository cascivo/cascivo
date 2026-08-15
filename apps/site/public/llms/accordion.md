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

| Prop            | Type                                  | Required | Default  | Description                                                                    |
| --------------- | ------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------ |
| `type`          | `'single' \| 'multiple'`              | no       | `single` | Whether one or multiple sections can be open at once ('single' \| 'multiple'). |
| `defaultValue`  | `string \| string[]`                  | no       | —        | The initial value when uncontrolled.                                           |
| `value`         | `string \| string[]`                  | no       | —        | The controlled value.                                                          |
| `onValueChange` | `(value: string \| string[]) => void` | no       | —        | Called with the new value when it changes.                                     |

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

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

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

---

_Generated from registry v0.17.1 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
