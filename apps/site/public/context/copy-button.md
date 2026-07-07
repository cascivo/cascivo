# CopyButton

**Category:** inputs  
**Description:** Icon button that copies a value to the clipboard with copied feedback

## When to use

- Letting users copy a short value to the clipboard — install commands, API keys, tokens, share links
- Inline next to code snippets or read-only fields where copying is the primary affordance

## When NOT to use

- Triggering a general action — use Button
- Copying content the user can already select and edit freely where a copy affordance adds nothing

## Anti-patterns

### Its click handler is fixed to navigator.clipboard.writeText(value) plus copied feedback — overloading it breaks user expectation

**Bad:** `Wiring CopyButton to perform a non-clipboard action via onClick`  
**Good:** `Use Button for arbitrary actions; CopyButton always writes value to the clipboard`  
**Why:** Its click handler is fixed to navigator.clipboard.writeText(value) plus copied feedback — overloading it breaks user expectation

## Related components

- **Button** (alternative): Use for actions other than copying to clipboard
- **Input** (pairs-with): Often placed alongside a read-only field whose value it copies

## Accessibility rationale

Renders a native <button> so Enter/Space, focus, and role come from the platform; the aria-label swaps between copy and copied labels to announce the state change to screen readers since the icon swap alone is silent, and the SVG icons are aria-hidden

## Props

| Name     | Type                                 | Required | Default | Description                                           |
| -------- | ------------------------------------ | -------- | ------- | ----------------------------------------------------- |
| `value`  | `string`                             | Yes      | —       | The text written to the clipboard on click            |
| `size`   | `'sm' \| 'md'`                       | No       | md      | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `labels` | `{ copy?: string; copied?: string }` | No       | —       | Overrides the built-in i18n labels per instance       |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-success`
- `--cascivo-radius-control`
- `--cascivo-focus-ring`
- `--cascivo-control-height-sm`
- `--cascivo-control-height-md`

## Examples

### Default

```jsx
<CopyButton value="npx cascivo add button" />
```

### Small

```jsx
<CopyButton value="pnpm install" size="sm" />
```

### Custom labels

Override the built-in copy/copied strings per instance

```jsx
<CopyButton value="token" labels={{ copy: 'Copy token', copied: 'Token copied' }} />
```

## Boundaries

| Area        | Level    | Note                                                                                              |
| ----------- | -------- | ------------------------------------------------------------------------------------------------- |
| labels      | flexible | copy/copied strings overridable via labels; default from i18n catalog                             |
| token names | strict   | Styling resolves to semantic --cascivo-color-\* tokens; copied state uses --cascivo-color-success |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo CopyButton component (inputs). Icon button that copies a value to the clipboard with copied feedback

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

CopyButton is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-text-subtle, --cascivo-color-text, --cascivo-color-border, --cascivo-color-bg-subtle, --cascivo-color-success, --cascivo-radius-control, --cascivo-focus-ring, --cascivo-control-height-sm, --cascivo-control-height-md

Accessibility: role "button", WCAG 2.2-AA, keyboard: Enter/Space. Keep it AA.

Do not change (strict): token names — Styling resolves to semantic --cascivo-color-* tokens; copied state uses --cascivo-color-success
Flexible: labels.

Do not invent props, tokens, or global viewport media queries.
```
