# TypingIndicator

Three bouncing dots that hold a chat message slot while an assistant (or a person) is composing a reply

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add typing-indicator
```

Or use it from the prebuilt package without copying:

```tsx
import { TypingIndicator } from '@cascivo/react'
```

## Category

`feedback`

## Props

| Prop        | Type     | Required | Default               | Description                                                                                                           |
| ----------- | -------- | -------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | `string` | no       | `Assistant is typing` | Accessible name announced by the status region. Not rendered — screen readers only.                                   |
| `label`     | `string` | no       | —                     | Alias of `ariaLabel` — the same invisible accessible name. Neither is deprecated. Not rendered — screen readers only. |

## Examples

### Default

```tsx
<TypingIndicator />
```

### In a chat bubble

```tsx
<ChatBubble name="Assistant">
  <TypingIndicator />
</ChatBubble>
```

### A person typing

```tsx
<TypingIndicator ariaLabel="Ada is typing" />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-typing-indicator-color`
- `--cascivo-color-text-muted`
- `--cascivo-radius-full`
- `--cascivo-space-1`
- `--cascivo-space-2`
- `--cascivo-duration-loop-fast`
- `--cascivo-ease-in-out`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `status`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

ai, chat, typing, loading, dots, thinking

---

_Generated from registry v1.9.0 on 2026-10-09. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
