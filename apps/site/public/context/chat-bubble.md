# ChatBubble

**Category:** display  
**Description:** Message bubble for chat and messaging UIs with avatar, name, and timestamp support

## When to use

- Chat UIs and messaging features showing conversation history
- Comment threads with a bubble-style layout
- Customer support widgets displaying agent and user messages

## When NOT to use

- General content cards without a conversational context — use Card
- Inline comments that do not need a bubble visual treatment

## Anti-patterns

### ChatBubble implies a back-and-forth conversation; use Card for standalone content pieces

**Bad:** `Using ChatBubble for notification cards or feed items`  
**Good:** `<Card> or <Alert> for non-conversational content`  
**Why:** ChatBubble implies a back-and-forth conversation; use Card for standalone content pieces

## Related components

- **Card** (alternative): Use for general content display that is not part of a conversation
- **Avatar** (pairs-with): Pass an Avatar as the avatar prop to identify the message sender

## Accessibility rationale

Pure layout component with role="none". Wrap a list of ChatBubble elements in an element with role="log" and aria-live="polite" to announce new messages to screen readers.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | — | Content rendered inside the component. |
| `side` | `'start' \| 'end'` | No | start | Edge the component is anchored to. |
| `avatar` | `React.ReactNode` | No | — | Avatar element shown beside the message. |
| `name` | `string` | No | — | Display name of the message sender. |
| `time` | `string` | No | — | Timestamp text shown with the message. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-text-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-accent-content`
- `--cascivo-radius-overlay`
- `--cascivo-radius-indicator`

## Examples

### Incoming message

Message from another user, aligned to the start

```jsx
<ChatBubble side="start" name="Alice" time="10:42 AM">Hey, how are you?</ChatBubble>
```

### Outgoing message

Current user message, aligned to the end with accent background

```jsx
<ChatBubble side="end" time="10:43 AM">Doing great, thanks!</ChatBubble>
```

### With avatar

Message with an avatar beside the bubble

```jsx
<ChatBubble side="start" avatar={<Avatar src="/alice.png" size="sm" />} name="Alice">See you tomorrow!</ChatBubble>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| avatar slot | flexible | Accepts any ReactNode — Avatar, initials, icon, or nothing |
| body content | flexible | children accepts rich content including images, links, and formatted text |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ChatBubble component (display). Message bubble for chat and messaging UIs with avatar, name, and timestamp support

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ChatBubble is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-text-subtle, --cascivo-color-accent, --cascivo-color-accent-content, --cascivo-radius-overlay, --cascivo-radius-indicator

Accessibility: role "none", WCAG 2.2-AA. Keep it AA.
Flexible: avatar slot, body content.

Do not invent props, tokens, or global viewport media queries.
```
