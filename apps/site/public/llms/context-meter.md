# ContextMeter

How much of a model’s context window a conversation has used — "12K / 200K" with a bar that warns as it fills

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add context-meter
```

Or use it from the prebuilt package without copying:

```tsx
import { ContextMeter } from '@cascivo/react'
```

## Category

`feedback`

## States

- `normal`
- `high`
- `full`

## Props

| Prop     | Type                 | Required | Default   | Description                                                                                                                               |
| -------- | -------------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `value`  | `number`             | yes      | —         | Tokens used so far.                                                                                                                       |
| `max`    | `number`             | yes      | —         | The context window size, in tokens.                                                                                                       |
| `label`  | `string`             | no       | `Context` | The meter’s name, shown above the bar. Rendered on screen.                                                                                |
| `labels` | `{ usage?: string }` | no       | —         | Overrides for the component’s user-visible strings (i18n). `usage` is the spoken value and may contain `{used}`, `{max}` and `{percent}`. |

## Examples

### Plenty left

```tsx
<ContextMeter value={12400} max={200000} />
```

### Nearly full

```tsx
<ContextMeter value={192000} max={200000} />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-ai`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `meter`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

ai, context, tokens, usage, meter, quota

---

_Generated from registry v1.8.0 on 2026-10-07. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
