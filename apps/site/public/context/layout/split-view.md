# SplitView

**Category:** layout  
**Description:** Resizable two-pane split layout with keyboard and pointer drag support.

## When to use

- Two side-by-side panes the user can resize via pointer or keyboard
- Master/detail, editor/preview, or list/content layouts

## When NOT to use

- Static two-column content — use Columns
- A full app frame with persistent navigation — use AppShell or SidebarApp

## Related components

- **Columns** (alternative): Use for static, non-resizable two-column content

## Accessibility rationale

Exposes a keyboard-operable separator with role="separator" and aria-valuenow for the split ratio.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `start` | `ReactNode` | Yes | — | Left pane content |
| `end` | `ReactNode` | Yes | — | Right pane content |
| `defaultRatio` | `number` | No | — | Initial split ratio (0–1) |
| `min` | `number` | No | — | Minimum ratio for start pane |
| `max` | `number` | No | — | Maximum ratio for start pane |
| `aria-label` | `string` | No | — | Label for the separator |

## Tokens

- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-duration-150`

## Examples

### Basic

Two-pane split with draggable divider

```jsx
<SplitView start={<FileTree />} end={<Editor />} />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo SplitView component (layout). Resizable two-pane split layout with keyboard and pointer drag support.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

SplitView is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border, --cascivo-color-accent, --cascivo-duration-150

Accessibility: role "separator", WCAG 2.1-AA, keyboard: ArrowLeft/ArrowRight. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
