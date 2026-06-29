# Header

**Category:** navigation  
**Description:** App top bar with brand, primary navigation links, and an actions slot

## When to use

- Providing a simple marketing or app top bar with brand, links, and actions
- Anchoring primary navigation across pages of a site
- Keeping the bar visible while scrolling (sticky)

## When NOT to use

- Dense console apps with dropdown nav, global icon actions, and a hamburger — use ShellHeader
- Section headings within page content — use Heading

## Anti-patterns

### Header is intentionally simple; console patterns belong to ShellHeader which provides them natively

**Bad:** `Building complex multi-menu console chrome on top of Header`  
**Good:** `<ShellHeader> for console-grade navigation`  
**Why:** Header is intentionally simple; console patterns belong to ShellHeader which provides them natively

## Related components

- **ShellHeader** (alternative): ShellHeader is the console-grade header with dropdowns and icon actions

## Accessibility rationale

role="banner" marks the page header landmark; the active link is marked aria-current="page", and links/actions are real focusable controls so keyboard users can navigate the bar

## Props

| Name        | Type                                                  | Required | Default | Description                                                    |
| ----------- | ----------------------------------------------------- | -------- | ------- | -------------------------------------------------------------- |
| `brand`     | `React.ReactNode`                                     | No       | —       | Product name or logo area, typically wraps a link              |
| `links`     | `{ label: string; href: string; active?: boolean }[]` | No       | —       | Primary navigation links; active link gets aria-current="page" |
| `actions`   | `React.ReactNode`                                     | No       | —       | Right-aligned slot for buttons or an avatar                    |
| `sticky`    | `boolean`                                             | No       | false   | When true, the header sticks to the top on scroll.             |
| `className` | `string`                                              | No       | —       | Additional CSS class names merged onto the root element.       |

## Tokens

- `--cascivo-header-bg`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-bg-subtle`
- `--cascivo-focus-ring`
- `--cascivo-z-raised`

## Examples

### Basic

```jsx
<Header brand="cascivo" links={[{ label: 'Docs', href: '/docs' }]} />
```

### With actions

```jsx
<Header brand="cascivo" actions={<Button size="sm">Sign in</Button>} />
```

### Sticky

```jsx
<Header sticky brand="cascivo" links={links} />
```

## Boundaries

| Area              | Level    | Note                                                             |
| ----------------- | -------- | ---------------------------------------------------------------- |
| links and actions | flexible | Brand, links, and actions slots are optional and composable      |
| token names       | strict   | Surface, border, and z-index must resolve to --cascivo-\* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Header component (navigation). App top bar with brand, primary navigation links, and an actions slot

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Header is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-header-bg, --cascivo-color-surface, --cascivo-color-border, --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-color-bg-subtle, --cascivo-focus-ring, --cascivo-z-raised

Accessibility: role "banner", WCAG 2.2-AA, keyboard: Tab. Keep it AA.

Do not change (strict): token names — Surface, border, and z-index must resolve to --cascivo-* tokens
Flexible: links and actions.

Do not invent props, tokens, or global viewport media queries.
```
