# ToolCall

**Category:** display  
**Description:** Card for one AI tool invocation — the tool name, its lifecycle status, collapsible input/output, and approval actions

## When to use

- Showing an AI tool or function call in a conversation, with what it was given and what it returned
- Asking the reader to approve or deny a call before it runs (human-in-the-loop)

## When NOT to use

- A list of agent steps without payloads — use ChainOfThought
- Announcing that the assistant is working — use AiStatus
- Showing arbitrary code — use CodeSnippet

## Anti-patterns

### A pending approval must be visible and reachable without first opening a disclosure

**Bad:** `Putting Approve / Deny inside the collapsible input panel`  
**Good:** `Pass them to `actions`, which always renders below the card`  
**Why:** A pending approval must be visible and reachable without first opening a disclosure

## Related components

- **ChainOfThought** (contained-by): A ToolCall can sit in a ChainOfThought step’s detail
- **Badge** (contains): The status is a Badge whose tone follows the lifecycle
- **AiStatus** (pairs-with): AiStatus announces progress; ToolCall is never a live region

## Accessibility rationale

The header is a native <summary>, so the disclosure is keyboard-operable (Enter/Space) and works before hydration; its accessible name is the tool name plus the status text, never colour alone. Approval actions live outside the disclosure so they are always reachable. The card is not a live region — announce progress with AiStatus. Only the tool glyph pulses while running, under prefers-reduced-motion: no-preference

## Props

| Name      | Type                                                                                                                                                                            | Required | Default | Description                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`                                                                                                                                                                        | Yes      | —       | The tool’s name, shown in monospace (e.g. `search_web`).                                                                                     |
| `status`  | `'pending' \| 'running' \| 'awaiting-approval' \| 'complete' \| 'error' \| 'denied'`                                                                                            | Yes      | —       | Lifecycle, matching the AI SDK tool-part states: `pending` (input streaming), `running`, `awaiting-approval`, `complete`, `error`, `denied`. |
| `input`   | `ReactNode`                                                                                                                                                                     | No       | —       | The call’s arguments. A string (e.g. `JSON.stringify(args, null, 2)`) renders preformatted; any other node renders as given.                 |
| `output`  | `ReactNode`                                                                                                                                                                     | No       | —       | The tool’s result — a string renders preformatted, a node as given.                                                                          |
| `error`   | `ReactNode`                                                                                                                                                                     | No       | —       | Why the call failed. The panel opens itself when status is `error`.                                                                          |
| `actions` | `ReactNode`                                                                                                                                                                     | No       | —       | Rich slot below the card — typically Approve / Deny buttons while `awaiting-approval`. Always visible, never inside the collapsible panel.   |
| `labels`  | `{ pending?: string; running?: string; awaitingApproval?: string; complete?: string; error?: string; denied?: string; input?: string; output?: string; errorHeading?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n).                                                                                   |

## Tokens

- `--cascivo-color-ai`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text-muted`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-radius-surface`
- `--cascivo-font-mono`
- `--cascivo-focus-ring`

## Examples

### Running

```jsx
<ToolCall name="search_web" status="running" input={'{ "query": "cascivo pricing" }'} />
```

### Complete

```jsx
<ToolCall
  name="get_weather"
  status="complete"
  input={'{ "city": "Berlin" }'}
  output={'{ "tempC": 18, "sky": "clear" }'}
/>
```

### Awaiting approval

```jsx
<ToolCall
  name="send_email"
  status="awaiting-approval"
  input={'{ "to": "team@example.com", "subject": "Weekly report" }'}
  actions={
    <>
      <Button variant="ghost" size="sm">
        Deny
      </Button>
      <Button size="sm">Approve</Button>
    </>
  }
/>
```

### Error

```jsx
<ToolCall name="fetch_page" status="error" error="The page returned 404." />
```

## Boundaries

| Area              | Level    | Note                                                                                |
| ----------------- | -------- | ----------------------------------------------------------------------------------- |
| payloads          | flexible | Strings render preformatted; pass a node (a table, a CodeSnippet) for richer output |
| status vocabulary | strict   | Map your framework’s tool states onto the six statuses; do not invent more          |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ToolCall component (display). Card for one AI tool invocation — the tool name, its lifecycle status, collapsible input/output, and approval actions

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ToolCall is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-ai, --cascivo-color-surface, --cascivo-color-border, --cascivo-color-bg-subtle, --cascivo-color-text-muted, --cascivo-color-warning, --cascivo-color-destructive, --cascivo-radius-surface, --cascivo-font-mono, --cascivo-focus-ring

Accessibility: role "group", WCAG 2.2-AA, keyboard: Tab/Enter/Space. Keep it AA.

Do not change (strict): status vocabulary — Map your framework’s tool states onto the six statuses; do not invent more
Flexible: payloads.

Do not invent props, tokens, or global viewport media queries.
```
