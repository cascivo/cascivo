# WheelPicker

iOS-style drum picker — a column of options that scrolls and snaps to a selection

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add wheel-picker
```

Or use it from the prebuilt package without copying:

```tsx
import { WheelPicker } from '@cascivo/react'
```

## Category

`inputs`

## States

- `idle`
- `focused`
- `scrolling`

## Props

| Prop            | Type                      | Required | Default | Description                                                                                                 |
| --------------- | ------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `options`       | `WheelPickerOption[]`     | yes      | —       | The rows of the wheel, in order                                                                             |
| `value`         | `string`                  | yes      | —       | The selected option value; the component is controlled                                                      |
| `onValueChange` | `(value: string) => void` | yes      | —       | Called with the new value when the wheel settles or a key moves the selection                               |
| `visibleCount`  | `number`                  | no       | `5`     | How many rows are visible. Odd numbers keep the selection centred.                                          |
| `itemHeight`    | `number`                  | no       | `36`    | Row height in px.                                                                                           |
| `ariaLabel`     | `string`                  | no       | —       | Accessible label for the wheel — required when it has no visible label. Not rendered — screen readers only. |
| `className`     | `string`                  | no       | —       | Additional CSS class names merged onto the root element.                                                    |

## Object types

### `WheelPickerOption`

| Field   | Type     | Required | Description              |
| ------- | -------- | -------- | ------------------------ |
| `value` | `string` | yes      | Value reported on change |
| `label` | `string` | yes      | Visible row text         |

## Examples

### Basic

Controlled — the caller owns the value.

```tsx
<WheelPicker
  ariaLabel="Hour"
  value={hour}
  onValueChange={setHour}
  options={[
    { value: '09', label: '09' },
    { value: '10', label: '10' },
    { value: '11', label: '11' },
  ]}
/>
```

### Taller wheel

Shows more rows around the selection.

```tsx
<WheelPicker
  ariaLabel="Minute"
  value={minute}
  onValueChange={setMinute}
  options={minutes}
  visibleCount={7}
/>
```

### Several columns

Compose one wheel per field; each column is independently operable.

```tsx
<Flex gap="0">
  <WheelPicker ariaLabel="Hour" value={hour} onValueChange={setHour} options={hours} />
  <WheelPicker ariaLabel="Minute" value={minute} onValueChange={setMinute} options={minutes} />
</Flex>
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-foreground`
- `--cascivo-color-text-muted`
- `--cascivo-border-subtle`
- `--cascivo-text-ui`
- `--cascivo-font-semibold`
- `--cascivo-radius-md`
- `--cascivo-ring-width`
- `--cascivo-ring-color`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `listbox`
- **Keyboard:** ArrowUp, ArrowDown, Home, End, PageUp, PageDown, Tab

## Dependencies

- `@cascivo/core`

## Tags

inputs, picker, wheel, drum, scroll-snap, mobile, ios

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
