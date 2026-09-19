# SettingsLayout

**Category:** layout  
**Description:** Two-column settings page layout with a fixed-width menu and fluid content area.

## When to use

- A two-column settings page with a fixed-width menu and fluid content
- Account, preferences, or admin pages with sectioned navigation

## When NOT to use

- A general resizable two-pane layout — use SplitView
- A full app frame — use AppShell or SidebarApp

## Related components

- **SettingsFormPage** (contained-by): The settings form block composes this layout
- **SplitView** (alternative): Use when the two panes should be user-resizable

## Accessibility rationale

Provides a navigation region for the menu and a main region for content.

## Props

| Name       | Type        | Required | Default | Description           |
| ---------- | ----------- | -------- | ------- | --------------------- |
| `menu`     | `ReactNode` | Yes      | —       | Side navigation menu  |
| `children` | `ReactNode` | Yes      | —       | Settings content area |

## Tokens

- `--cascivo-space-8`

## Examples

### Basic

Menu + content layout

```jsx
<SettingsLayout menu={<nav>Menu</nav>}>
  <div>Settings</div>
</SettingsLayout>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo SettingsLayout component (layout). Two-column settings page layout with a fixed-width menu and fluid content area.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

SettingsLayout is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-8

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
