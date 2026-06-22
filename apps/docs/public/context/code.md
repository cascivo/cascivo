# Code

**Category:** display  
**Description:** Inline code span for identifiers, commands, and short snippets

## When to use

- Marking up an inline identifier, command, path, or token within prose
- Distinguishing literal code from surrounding text with a monospace span

## When NOT to use

- Multi-line code blocks with syntax highlighting — use a <pre> block
- Keyboard shortcuts the user should press — use Kbd

## Anti-patterns

### Code marks literal code; key presses are semantically Kbd

**Bad:** `<Code>Press Cmd+K</Code>`  
**Good:** `<Kbd>⌘</Kbd> <Kbd>K</Kbd>`  
**Why:** Code marks literal code; key presses are semantically Kbd

## Related components

- **Kbd** (alternative): Kbd is for keys to press, not code to read
- **Prose** (pairs-with): Prose styles inline <code> automatically in authored content

## Accessibility rationale

Renders a native <code> element so assistive tech can expose the content as code; relies on monospace and surface, not color alone, to distinguish it

## Props

| Name   | Type  | Required | Default | Description |
| ------ | ----- | -------- | ------- | ----------- | --- |
| `size` | `'sm' | 'md'`    | No      | md          | —   |

## Tokens

- `--cascivo-font-mono`
- `--cascivo-color-text`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-indicator`
- `--cascivo-text-xs`
- `--cascivo-text-sm`

## Examples

### Default

```jsx
<Code>npx cascivo add button</Code>
```

### In a sentence

Sits inline with surrounding text

```jsx
<Text>
  Run <Code>vp check</Code> before committing.
</Text>
```

### Small

```jsx
<Code size="sm">--cascivo-color-accent</Code>
```

## Boundaries

| Area        | Level    | Note                                                                         |
| ----------- | -------- | ---------------------------------------------------------------------------- |
| size        | flexible | sm fits dense UI; md matches body text                                       |
| token names | strict   | Font and surface must resolve to --cascivo-font-mono and --cascivo-\* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Code component (display). Inline code span for identifiers, commands, and short snippets

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Code is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-font-mono, --cascivo-color-text, --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-indicator, --cascivo-text-xs, --cascivo-text-sm

Accessibility: role "code", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Font and surface must resolve to --cascivo-font-mono and --cascivo-* tokens
Flexible: size.

Do not invent props, tokens, or global viewport media queries.
```
