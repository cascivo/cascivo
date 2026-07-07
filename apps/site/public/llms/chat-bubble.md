# ChatBubble

Message bubble for chat and messaging UIs with avatar, name, and timestamp support

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add chat-bubble
```

Or use it from the prebuilt package without copying:

```tsx
import { ChatBubble } from '@cascivo/react'
```

## Category

`display`

## Variants

- `start`
- `end`

## Props

| Prop        | Type               | Required | Default | Description                                              |
| ----------- | ------------------ | -------- | ------- | -------------------------------------------------------- |
| `children`  | `React.ReactNode`  | yes      | —       | Content rendered inside the component.                   |
| `side`      | `'start' \| 'end'` | no       | `start` | Edge the component is anchored to.                       |
| `avatar`    | `React.ReactNode`  | no       | —       | Avatar element shown beside the message.                 |
| `name`      | `string`           | no       | —       | Display name of the message sender.                      |
| `time`      | `string`           | no       | —       | Timestamp text shown with the message.                   |
| `className` | `string`           | no       | —       | Additional CSS class names merged onto the root element. |

## Examples

### Incoming message

Message from another user, aligned to the start

```tsx
<ChatBubble side="start" name="Alice" time="10:42 AM">
  Hey, how are you?
</ChatBubble>
```

### Outgoing message

Current user message, aligned to the end with accent background

```tsx
<ChatBubble side="end" time="10:43 AM">
  Doing great, thanks!
</ChatBubble>
```

### With avatar

Message with an avatar beside the bubble

```tsx
<ChatBubble side="start" avatar={<Avatar src="/alice.png" size="sm" />} name="Alice">
  See you tomorrow!
</ChatBubble>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-text-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-accent-content`
- `--cascivo-radius-overlay`
- `--cascivo-radius-indicator`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Tags

chat, message, conversation, messaging
