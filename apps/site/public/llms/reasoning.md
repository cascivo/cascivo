# Reasoning

Collapsible panel for a model’s reasoning — opens and shimmers "Thinking…" while it streams, then settles to "Thought for N seconds"

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add reasoning
```

Or use it from the prebuilt package without copying:

```tsx
import { Reasoning } from '@cascivo/react'
```

## Category

`display`

## States

- `streaming`
- `settled`

## Props

| Prop        | Type                                                         | Required | Default | Description                                                                                                                                              |
| ----------- | ------------------------------------------------------------ | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode`                                                  | yes      | —       | The reasoning text or steps.                                                                                                                             |
| `streaming` | `boolean`                                                    | no       | `false` | True while reasoning is still arriving: the panel opens, the trigger shimmers "Thinking…" and the content is aria-busy. Turning it off closes the panel. |
| `duration`  | `number`                                                     | no       | —       | Seconds spent reasoning. Once streaming ends the trigger reads "Thought for {duration} seconds"; without it, "Reasoning". The caller owns the clock.     |
| `label`     | `ReactNode`                                                  | no       | —       | Replaces the trigger text in every state. Rendered on screen.                                                                                            |
| `labels`    | `{ thinking?: string; thoughtFor?: string; label?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n). `thoughtFor` may contain `{count}`.                                                           |

## Examples

### Streaming

```tsx
<Reasoning streaming>The user wants a summary, so I will start with the totals…</Reasoning>
```

### Settled

```tsx
<Reasoning duration={12}>
  The user wants a summary, so I started with the totals and then compared regions.
</Reasoning>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-ai`
- `--cascivo-color-ai-border`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-focus-ring`
- `--cascivo-duration-200`
- `--cascivo-duration-loop-slow`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

ai, reasoning, thinking, chain-of-thought, disclosure, collapsible

---

_Generated from registry v1.8.0 on 2026-10-07. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
