# NavigationMenu

**Category:** navigation  
**Description:** Site navigation bar with links and dropdown flyout panels

## When to use

- Primary site navigation where some destinations are plain links and others reveal a flyout of grouped links
- A header nav bar that mixes direct links with rich dropdown panels

## When NOT to use

- Application commands and actions grouped under File/Edit/View — use Menubar
- A single trigger opening a list of actions — use a Menu/Dropdown
- Switching between peer content panels in place — use Tabs

## Anti-patterns

### navigation landmark implies moving between destinations, not invoking actions

**Bad:** `Putting action commands (Save, Delete) inside NavigationMenu flyouts`  
**Good:** `<Menubar> or <Menu> for commands; NavigationMenu is for destinations`  
**Why:** navigation landmark implies moving between destinations, not invoking actions

## Related components

- **Menubar** (alternative): Menubar invokes application commands; NavigationMenu navigates to destinations
- **Tabs** (alternative): Tabs swap in-page panels; NavigationMenu links to other destinations

## Accessibility rationale

Wrapped in a navigation landmark with a roving-tabindex row of links and disclosure triggers; triggers expose aria-expanded/aria-controls onto a flyout panel, and outside-pointer or Escape dismisses the open panel and restores trigger focus

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `NavigationMenuItem[]` | Yes | — | The items to render. |
| `aria-label` | `string` | No | — | Accessible label used when no visible label is present. |
| `orientation` | `'horizontal' \| 'vertical' \| 'both'` | No | — | Layout orientation of the component. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-border`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Examples

### Basic

```jsx
<NavigationMenu aria-label="Main" items={[{ id: "home", label: "Home", href: "/" }, { id: "products", label: "Products", content: <ul>…</ul> }]} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| orientation | flexible | horizontal (default) or vertical roving navigation |
| panel content | flexible | content is arbitrary ReactNode; links without content render as plain anchors |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo NavigationMenu component (navigation). Site navigation bar with links and dropdown flyout panels

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

NavigationMenu is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-bg-subtle, --cascivo-color-text, --cascivo-color-border, --cascivo-focus-ring, --cascivo-motion-enter, --cascivo-motion-exit

Accessibility: role "navigation", WCAG 2.2-AA, keyboard: ArrowLeft/ArrowRight/Home/End/Enter/Escape. Keep it AA.
Flexible: orientation, panel content.

Do not invent props, tokens, or global viewport media queries.
```
