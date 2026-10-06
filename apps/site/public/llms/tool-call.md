# ToolCall

Card for one AI tool invocation — the tool name, its lifecycle status, collapsible input/output, and approval actions

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add tool-call
```

Or use it from the prebuilt package without copying:

```tsx
import { ToolCall } from '@cascivo/react'
```

## Category

`display`

## States

- `pending`
- `running`
- `awaiting-approval`
- `complete`
- `error`
- `denied`

## Props

| Prop      | Type                                                                                                                                                                            | Required | Default | Description                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`                                                                                                                                                                        | yes      | —       | The tool’s name, shown in monospace (e.g. `search_web`).                                                                                     |
| `status`  | `'pending' \| 'running' \| 'awaiting-approval' \| 'complete' \| 'error' \| 'denied'`                                                                                            | yes      | —       | Lifecycle, matching the AI SDK tool-part states: `pending` (input streaming), `running`, `awaiting-approval`, `complete`, `error`, `denied`. |
| `input`   | `ReactNode`                                                                                                                                                                     | no       | —       | The call’s arguments. A string (e.g. `JSON.stringify(args, null, 2)`) renders preformatted; any other node renders as given.                 |
| `output`  | `ReactNode`                                                                                                                                                                     | no       | —       | The tool’s result — a string renders preformatted, a node as given.                                                                          |
| `error`   | `ReactNode`                                                                                                                                                                     | no       | —       | Why the call failed. The panel opens itself when status is `error`.                                                                          |
| `actions` | `ReactNode`                                                                                                                                                                     | no       | —       | Rich slot below the card — typically Approve / Deny buttons while `awaiting-approval`. Always visible, never inside the collapsible panel.   |
| `labels`  | `{ pending?: string; running?: string; awaitingApproval?: string; complete?: string; error?: string; denied?: string; input?: string; output?: string; errorHeading?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n).                                                                                   |

## Examples

### Running

```tsx
<ToolCall name="search_web" status="running" input={'{ "query": "cascivo pricing" }'} />
```

### Complete

```tsx
<ToolCall
  name="get_weather"
  status="complete"
  input={'{ "city": "Berlin" }'}
  output={'{ "tempC": 18, "sky": "clear" }'}
/>
```

### Awaiting approval

```tsx
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

```tsx
<ToolCall name="fetch_page" status="error" error="The page returned 404." />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

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

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`
- **Keyboard:** Tab, Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

ai, agent, tool, function-call, approval, mcp, status

---

_Generated from registry v1.6.0 on 2026-10-02. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
