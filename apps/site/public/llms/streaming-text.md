# StreamingText

Reveals text character by character with a blinking cursor, catching up as a streamed reply grows

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add streaming-text
```

Or use it from the prebuilt package without copying:

```tsx
import { StreamingText } from '@cascivo/react'
```

## Category

`display`

## Props

| Prop         | Type         | Required | Default | Description                                                                                                                                    |
| ------------ | ------------ | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`       | `string`     | yes      | —       | The target text. Pass the accumulating reply as it streams; typing catches up as it grows, and restarts if it is replaced by a shorter string. |
| `speed`      | `number`     | no       | `2`     | Characters revealed per animation frame.                                                                                                       |
| `onComplete` | `() => void` | no       | —       | Called when the displayed text has caught up with `text`.                                                                                      |

## Examples

### Typing

```tsx
<StreamingText text="Hello, I am cascivo." speed={3} />
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-duration-loop-fast`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

ai, streaming, typewriter, text, chat

---

_Generated from registry v1.8.0 on 2026-10-07. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
