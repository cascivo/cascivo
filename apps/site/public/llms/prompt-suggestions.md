# PromptSuggestions

Starter prompts as a wrap of pill buttons — the "Try asking…" row of an empty AI chat

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add prompt-suggestions
```

Or use it from the prebuilt package without copying:

```tsx
import { PromptSuggestions } from '@cascivo/react'
```

## Category

`inputs`

## Props

| Prop       | Type                      | Required | Default | Description                                                                                             |
| ---------- | ------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `items`    | `string[]`                | yes      | —       | The prompts, as the exact text each one sends.                                                          |
| `onSelect` | `(value: string) => void` | yes      | —       | Called with the chosen prompt — send it, or put it in the composer.                                     |
| `labels`   | `{ group?: string }`      | no       | —       | Overrides for the component’s user-visible strings (i18n) — `group` names the group for screen readers. |

## Examples

### Starter prompts

```tsx
<PromptSuggestions
  items={['Summarise this week’s tickets', 'Draft a release note', 'What changed in v2?']}
  onSelect={() => {}}
/>
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-color-ai-border`
- `--cascivo-color-ai-subtle`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`
- **Keyboard:** Tab, Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

ai, chat, prompts, suggestions, starters, chips

---

_Generated from registry v1.9.0 on 2026-10-09. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
