# ConsoleApp

**Category:** display  
**Description:** Carbon-parity console shell: ShellHeader + icon-rail SideNav + HeaderPanel notifications/switcher + collapsible aside + main content.

## When to use

- A Carbon-parity console shell with icon-rail nav, header panels, and aside
- Admin or operations consoles needing dense, app-like navigation

## When NOT to use

- A simpler sidebar app — use SidebarApp
- A bare shell to fully customise — use AppShell

## Related components

- **SidebarApp** (alternative): Use for a lighter, less dense sidebar app frame
- **AppShell** (alternative): Use the bare shell to compose custom console chrome

## Accessibility rationale

Provides header, navigation, and complementary landmarks for screen reader orientation.

## Tokens

- `--cascivo-shell-header-block-size`
- `--cascivo-shell-panel-inline-size`
- `--cascivo-shell-aside-inline-size`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-color-scrim`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Examples

### Default

Full console shell demo

```jsx
<ConsoleApp />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ConsoleApp component (display). Carbon-parity console shell: ShellHeader + icon-rail SideNav + HeaderPanel notifications/switcher + collapsible aside + main content.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ConsoleApp is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-shell-header-block-size, --cascivo-shell-panel-inline-size, --cascivo-shell-aside-inline-size, --cascivo-color-border, --cascivo-color-surface, --cascivo-color-scrim, --cascivo-motion-enter, --cascivo-motion-exit

Accessibility: role "generic", WCAG 2.1-AA, keyboard: Escape/Tab. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
