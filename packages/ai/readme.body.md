AI-native components for cascivo — the presentation layer for AI features: streaming text, generation status, animated terminals, and a full chat surface. Signal-driven like the rest of the design system (no `useState`, no `useEffect`), typed, and localized via `@cascivo/i18n` built-in catalogs.

> Newly published — first release on npm as of `0.1.0`.

**Peer dependencies:** `react >=18` and `@preact/signals-react >=2` (the components are signal-driven). Styles ship as CSS modules bundled with the components — no stylesheet import needed. Pair with `@cascivo/themes` for tokens.

```sh
pnpm add @cascivo/ai @preact/signals-react
```

## `StreamingText`

Types text out character-by-character with a blinking cursor, driven by `requestAnimationFrame`. Feed it a growing string (e.g. an accumulating LLM response) or a static one:

```tsx
import { StreamingText } from '@cascivo/ai'
;<StreamingText
  text={response} // target text; typing catches up as it grows
  speed={2} // characters per frame (default 2)
  onComplete={() => setDone(true)}
/>
```

The cursor renders only while the displayed text lags the target, and the animation resets when `text` is replaced with a shorter string.

## `AiLabel`

A `role="status"` badge for AI-generated content with three variants — `generating` (default), `done`, `error`. Labels come from the `@cascivo/i18n` built-in catalog, so they localize automatically:

```tsx
import { AiLabel } from '@cascivo/ai'

<AiLabel variant="generating" />
<AiLabel variant="done" />
<AiLabel variant="error" />
```

It extends `HTMLAttributes<HTMLSpanElement>`, so `className`, `title`, etc. pass through.

## `Terminal`

An animated terminal window (`role="log"`, `aria-live="polite"`) that types out a script of lines. Each line has a `type` (`command` | `output` | `error` | `comment`) for per-line styling and an optional `prefix` (e.g. `$`):

```tsx
import { Terminal } from '@cascivo/ai'
;<Terminal
  lines={[
    { text: 'npx cascivo add button', prefix: '$', type: 'command' },
    { text: 'Added button to src/components.', type: 'output' },
    { text: '# done in 1.2s', type: 'comment' },
  ]}
  speed={3} // characters per frame (default 3)
  loop // restart from the top after the last line
  onComplete={() => {}}
/>
```

## `AiChat`

A complete chat surface: message list (`role="log"`), streaming assistant bubble, and a textarea composer with Enter-to-send (Shift+Enter for a newline). It is fully controlled — you own the message array and the send handler:

```tsx
import { AiChat, type ChatMessage } from '@cascivo/ai'

const messages: ChatMessage[] = [
  { id: '1', role: 'user', content: 'What is cascivo?' },
  { id: '2', role: 'assistant', content: 'A CSS-native design system.' },
]

<AiChat
  messages={messages} // system messages are accepted but not rendered
  onSend={(text) => append({ role: 'user', content: text })}
  isStreaming={streaming} // disables the send button
  streamingText={partial} // rendered as a live assistant bubble via StreamingText
/>
```

Role labels ("You" / "Assistant"), the input placeholder, and the send button label all default from the `@cascivo/i18n` built-in catalog.
