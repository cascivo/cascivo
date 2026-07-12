# Toc

**Category:** navigation  
**Description:** Table of contents with scroll-spy highlighting of the active section

## When to use

- Long-form pages (docs, articles) that benefit from in-page jump links
- Highlighting which section is currently in view as the reader scrolls

## When NOT to use

- Top-level site navigation between pages — use NavigationMenu or SideNav
- Showing hierarchy depth of the current page — use Breadcrumb

## Anti-patterns

### Toc links to sections within the current document, not to other pages

**Bad:** `Using Toc as the primary site navigation between routes`  
**Good:** `<NavigationMenu> / <SideNav> for cross-page navigation`  
**Why:** Toc links to sections within the current document, not to other pages

## Related components

- **SideNav** (alternative): SideNav navigates between pages; Toc navigates within one page
- **Breadcrumb** (alternative): Breadcrumb shows ancestor hierarchy; Toc shows in-page sections

## Accessibility rationale

Rendered as a <nav> landmark with a label; entries are real anchor links and the active one is marked aria-current="location" so assistive tech announces the current section

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `{ id: string; label: string; level?: number }[]` | Yes | — | The items to render. |
| `activeId` | `string` | No | — | Controlled active item id; disables built-in scroll-spy when set |
| `onActiveChange` | `(id: string) => void` | No | — | Called with the id of the active section when it changes. |
| `labels` | `{ nav?: string }` | No | — | Overrides for the component’s user-visible strings (i18n). |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-font-sans`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-accent`
- `--cascivo-focus-ring`
- `--cascivo-target-min-coarse`

## Examples

### Basic

```jsx
<Toc items={[{ id: 'intro', label: 'Introduction' }, { id: 'usage', label: 'Usage' }, { id: 'api', label: 'API', level: 3 }]} />
```

### Controlled active item

Pass activeId to drive the highlight yourself; scroll-spy is disabled.

```jsx
<Toc activeId="usage" items={[{ id: 'intro', label: 'Introduction' }, { id: 'usage', label: 'Usage' }]} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| activeId | flexible | Control the highlight externally, or omit it for built-in scroll-spy |
| token names | strict | Colors, focus ring, and touch target must resolve to --cascivo-* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Toc component (navigation). Table of contents with scroll-spy highlighting of the active section

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Toc is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-font-sans, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-accent, --cascivo-focus-ring, --cascivo-target-min-coarse

Accessibility: role "navigation", WCAG 2.2-AA, keyboard: Tab/Enter. Keep it AA.

Do not change (strict): token names — Colors, focus ring, and touch target must resolve to --cascivo-* tokens
Flexible: activeId.

Do not invent props, tokens, or global viewport media queries.
```
