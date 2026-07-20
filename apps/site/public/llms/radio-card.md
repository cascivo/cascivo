# RadioCard

Selectable card backed by a native radio input. Use RadioCardGroup for single-select groups.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add radio-card
```

Or use it from the prebuilt package without copying:

```tsx
import { RadioCard } from '@cascivo/react'
```

## Category

`inputs`

## States

- `default`
- `checked`
- `disabled`

## Props

| Prop            | Type        | Required | Default | Description                                                    |
| --------------- | ----------- | -------- | ------- | -------------------------------------------------------------- |
| `hideIndicator` | `boolean`   | no       | —       | Hide the radio indicator glyph, showing only the card content. |
| `value`         | `string`    | yes      | —       | Radio value                                                    |
| `title`         | `ReactNode` | yes      | —       | Card title                                                     |
| `description`   | `ReactNode` | no       | —       | Optional description                                           |
| `disabled`      | `boolean`   | no       | —       | Disables the card                                              |

## Examples

### Plan selector

Single-select plan picker

```tsx
<RadioCardGroup name="plan" defaultValue="pro" label="Plan">
  <RadioCard value="free" title="Free" description="For hobbyists" />
  <RadioCard value="pro" title="Pro" description="For professionals" />
  <RadioCard value="team" title="Team" description="For teams" />
</RadioCardGroup>
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-border`
- `--cascivo-radius-surface`
- `--cascivo-color-active-bg`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `radiogroup`
- **Keyboard:** ArrowDown, ArrowUp, Space

## Dependencies

- `@cascivo/core`

## Tags

radio, card, selectable, form

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
