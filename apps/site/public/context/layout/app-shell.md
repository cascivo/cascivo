# AppShell

**Category:** layout  
**Description:** Full-page application shell with persisted collapsible sidebar. Includes a signal-driven top progress bar with determinate progress, error state, and dismissible error strip.

## When to use

- A full-page application frame with header, collapsible sidebar, and content
- You need a bare shell to compose your own navigation into

## When NOT to use

- You want opinionated, prewired sidebar navigation — use SidebarApp
- A simple centered content page — use Section or Center
- You just need a drop-in header + toggleable nav with no persistence — use the published `AppShell` from @cascivo/react (a `nav` prop, no copy-paste), not this richer copy-paste shell.

## Related components

- **AppShell (@cascivo/react)** (alternative): The published, self-contained AppShell: header + a single `nav` slot with an animated accessible drawer, no persistence/progress/aside. Same name, simpler prop surface (`nav` vs this shell’s `sideNav`/`aside`/`persistKey`/`state`). Use it for a quick drop-in; use this copy-paste shell when you need persisted collapse, a progress bar, or a right aside.
- **SidebarApp** (alternative): Use the opinionated block when you want prewired sidebar nav
- **DashboardLayout** (alternative): Use for a stats-strip dashboard page rather than a bare shell

## Accessibility rationale

Provides landmark structure with header and navigation regions for screen reader orientation.

## Props

| Name         | Type              | Required | Default | Description                                                                    |
| ------------ | ----------------- | -------- | ------- | ------------------------------------------------------------------------------ |
| `header`     | `ReactNode`       | Yes      | —       | Top header slot                                                                |
| `sideNav`    | `ReactNode`       | No       | —       | Side navigation slot                                                           |
| `aside`      | `ReactNode`       | No       | —       | Right aside slot                                                               |
| `children`   | `ReactNode`       | Yes      | —       | Main content                                                                   |
| `persistKey` | `string \| false` | No       | —       | localStorage key prefix. Pass false to disable persistence.                    |
| `state`      | `ShellState`      | No       | —       | External shell state from createShellState(). Created internally when omitted. |

## Tokens

- `--cascivo-space-3`
- `--cascivo-space-4`
- `--cascivo-space-6`
- `--cascivo-duration-200`
- `--cascivo-ease-out`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-font-size-xs`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-destructive-subtle`
- `--cascivo-focus-ring`

## Examples

### Basic

App shell with collapsible nav

```jsx
<AppShell header={<Header />} sideNav={<Nav />}>
  content
</AppShell>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo AppShell component (layout). Full-page application shell with persisted collapsible sidebar. Includes a signal-driven top progress bar with determinate progress, error state, and dismissible error strip.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

AppShell is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-3, --cascivo-space-4, --cascivo-space-6, --cascivo-duration-200, --cascivo-ease-out, --cascivo-color-border, --cascivo-color-surface, --cascivo-font-size-xs, --cascivo-color-accent, --cascivo-color-destructive, --cascivo-color-destructive-subtle, --cascivo-focus-ring

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
