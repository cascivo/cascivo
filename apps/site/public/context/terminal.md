# Terminal

**Category:** display  
**Description:** An animated terminal that types out a script of commands and output — for demos, onboarding and agent transcripts

## When to use

- Demonstrating a CLI or agent run on a marketing or onboarding page
- Replaying a short agent transcript as it happened

## When NOT to use

- Real, long-running logs — use LogViewer
- Copyable code — use CodeSnippet

## Anti-patterns

### A live region on per-character typing announces fragments on every frame

**Bad:** `Putting aria-live on the typing lines`  
**Good:** `Keep the animation aria-hidden and the full script as text, as Terminal does`  
**Why:** A live region on per-character typing announces fragments on every frame

## Related components

- **LogViewer** (alternative): LogViewer is for real, streaming logs with search and follow
- **CodeSnippet** (alternative): CodeSnippet is for static, copyable commands

## Accessibility rationale

A named group whose full script is present as visually hidden text from the first render, read once in order; the typing animation is aria-hidden, so a screen reader is never fed per-character fragments. The cursor blinks only under prefers-reduced-motion: no-preference; colours come from the editor tokens and fall back to CanvasText in forced colours

## Props

| Name         | Type                 | Required | Default | Description                                                                                                                                 |
| ------------ | -------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `lines`      | `TerminalLine[]`     | Yes      | —       | The script. Each line has `text`, an optional `prefix` (e.g. `$`) and a `type` (`command \| output \| error \| comment`, default `output`). |
| `speed`      | `number`             | No       | 3       | Characters typed per animation frame.                                                                                                       |
| `loop`       | `boolean`            | No       | false   | Restart from the first line after the last one.                                                                                             |
| `onComplete` | `() => void`         | No       | —       | Called each time the last line finishes typing.                                                                                             |
| `labels`     | `{ label?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n) — `label` names the terminal for screen readers.                                  |

## Object types

### `TerminalLine`

One line of the script.

| Field    | Type                                            | Required | Description                                             |
| -------- | ----------------------------------------------- | -------- | ------------------------------------------------------- |
| `text`   | `string`                                        | Yes      | What the line says.                                     |
| `prefix` | `string`                                        | No       | A prompt marker such as `$`, styled and not selectable. |
| `type`   | `'command' \| 'output' \| 'error' \| 'comment'` | No       | Colours the line. Defaults to `output`.                 |

## Tokens

- `--cascivo-terminal-bg`
- `--cascivo-terminal-fg`
- `--cascivo-editor-bg`
- `--cascivo-editor-fg`
- `--cascivo-editor-border`
- `--cascivo-editor-syntax-keyword`
- `--cascivo-editor-syntax-string`
- `--cascivo-editor-syntax-comment`
- `--cascivo-color-destructive`
- `--cascivo-font-mono`

## Examples

### Install transcript

```jsx
<Terminal
  lines={[
    { text: 'npx cascivo add button', prefix: '$', type: 'command' },
    { text: 'Added button to src/components.', type: 'output' },
    { text: '# done in 1.2s', type: 'comment' },
  ]}
/>
```

## Boundaries

| Area              | Level    | Note                                                                                    |
| ----------------- | -------- | --------------------------------------------------------------------------------------- |
| colours           | flexible | Follows the editor tokens; override --cascivo-terminal-bg / -fg for an always-dark look |
| speed and looping | flexible | speed, loop, onComplete                                                                 |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Terminal component (display). An animated terminal that types out a script of commands and output — for demos, onboarding and agent transcripts

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Terminal is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-terminal-bg, --cascivo-terminal-fg, --cascivo-editor-bg, --cascivo-editor-fg, --cascivo-editor-border, --cascivo-editor-syntax-keyword, --cascivo-editor-syntax-string, --cascivo-editor-syntax-comment, --cascivo-color-destructive, --cascivo-font-mono

Accessibility: role "group", WCAG 2.2-AA. Keep it AA.
Flexible: colours, speed and looping.

Do not invent props, tokens, or global viewport media queries.
```
