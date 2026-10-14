# ChainOfThought

The steps an AI agent takes — searching, reading, calling tools — each with its status, and optional collapsible detail

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add chain-of-thought
```

Or use it from the prebuilt package without copying:

```tsx
import { ChainOfThought } from '@cascivo/react'
```

## Category

`display`

## States

- `pending`
- `active`
- `complete`
- `error`

## Props

| Prop     | Type                                                                       | Required | Default | Description                                                                                                                                                                                                                                                        |
| -------- | -------------------------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `items`  | `ChainOfThoughtItem[]`                                                     | yes      | —       | The steps, in order. Each has `id`, `title`, optional `description`, `status` (`pending \| active \| complete \| error`, plus the `current` / `upcoming` aliases), optional `detail` (collapsible content that turns the title into a toggle) and optional `icon`. |
| `labels` | `{ pending?: string; active?: string; complete?: string; error?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n) — the status text a screen reader hears after each step title.                                                                                                                                           |

## Object types

### `ChainOfThoughtItem`

One step in the chain.

| Field         | Type            | Required | Description                                                                                    |
| ------------- | --------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `id`          | `string`        | yes      | Stable key for the step.                                                                       |
| `title`       | `ReactNode`     | yes      | What the step does.                                                                            |
| `description` | `ReactNode`     | no       | A secondary line under the title.                                                              |
| `status`      | `ProgressInput` | no       | `pending \| active \| complete \| error` (plus `current` / `upcoming`). Defaults to `pending`. |
| `detail`      | `ReactNode`     | no       | Collapsible content; makes the title a disclosure toggle.                                      |
| `icon`        | `ReactNode`     | no       | Replaces the status glyph in the marker.                                                       |

## Examples

### Agent steps

```tsx
<ChainOfThought
  items={[
    { id: 'search', title: 'Searched the docs for "refund policy"', status: 'complete' },
    { id: 'read', title: 'Reading 3 pages', status: 'active' },
    { id: 'answer', title: 'Write the answer', status: 'pending' },
  ]}
/>
```

### With collapsible detail

```tsx
<ChainOfThought
  items={[
    {
      id: 'search',
      title: 'Searched the web',
      status: 'complete',
      detail: 'cascivo.com/docs · github.com/cascivo/cascivo · npmjs.com/package/@cascivo/react',
    },
    {
      id: 'fail',
      title: 'Fetch pricing page',
      description: 'The page returned 404.',
      status: 'error',
    },
  ]}
/>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-ai`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-border`
- `--cascivo-color-success`
- `--cascivo-color-destructive`
- `--cascivo-focus-ring`
- `--cascivo-duration-loop-slow`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`
- **Keyboard:** Tab, Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

ai, agent, steps, chain-of-thought, reasoning, progress, tools

---

_Generated from registry v1.9.0 on 2026-10-09. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
