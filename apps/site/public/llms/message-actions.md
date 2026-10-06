# MessageActions

The action row under an AI reply — copy, good / bad feedback as toggle buttons, and regenerate

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add message-actions
```

Or use it from the prebuilt package without copying:

```tsx
import { MessageActions } from '@cascivo/react'
```

## Category

`inputs`

## Props

| Prop               | Type                                                                                      | Required | Default | Description                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `copyValue`        | `string`                                                                                  | no       | —       | The text the Copy button copies. Omit to hide Copy.                                                                                                                |
| `feedback`         | `'good' \| 'bad' \| null`                                                                 | no       | —       | Controlled rating: `good`, `bad` or `null`. Pressing the active rating again clears it.                                                                            |
| `defaultFeedback`  | `'good' \| 'bad' \| null`                                                                 | no       | `null`  | Initial rating when uncontrolled.                                                                                                                                  |
| `onFeedbackChange` | `(feedback: 'good' \| 'bad' \| null) => void`                                             | no       | —       | Called with the new rating (or `null` when cleared). The rating buttons render when this or `feedback` is set; a rating also announces "Thanks for your feedback". |
| `onRegenerate`     | `() => void`                                                                              | no       | —       | Called by the Regenerate button. Omit to hide it.                                                                                                                  |
| `labels`           | `{ group?: string; good?: string; bad?: string; regenerate?: string; recorded?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n).                                                                                                         |

## Examples

### Copy, rate and regenerate

```tsx
<MessageActions
  copyValue="Refunds are available for 30 days."
  onFeedbackChange={() => {}}
  onRegenerate={() => {}}
/>
```

### Copy only

```tsx
<MessageActions copyValue="Hello" />
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-text-muted`
- `--cascivo-color-ai`
- `--cascivo-color-ai-subtle`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`
- **Keyboard:** Tab, Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

ai, chat, feedback, copy, regenerate, thumbs, actions

---

_Generated from registry v1.6.0 on 2026-10-02. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
