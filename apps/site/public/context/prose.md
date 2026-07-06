# Prose

**Category:** display  
**Description:** Wrapper that styles raw descendant HTML — headings, lists, code, quotes, tables

## When to use

- Styling long-form authored content (articles, docs, CMS output)
- Applying readable typography to raw HTML you do not control (markdown pipelines)
- Getting consistent spacing for headings, lists, code, and quotes in one wrapper

## When NOT to use

- Single typographic elements in app UI — use Heading, Text, or List directly
- Interactive component layouts — Prose only styles flow content

## Anti-patterns

### Prose restyles all descendant HTML, which clobbers component styling and intent

**Bad:** `Wrapping app UI (buttons, forms) in <Prose> for spacing`  
**Good:** `Use layout primitives; reserve Prose for authored document content`  
**Why:** Prose restyles all descendant HTML, which clobbers component styling and intent

## Related components

- **Heading** (alternative): Use Heading/Text directly in app UI; Prose handles authored content

## Accessibility rationale

Adds no roles of its own — it styles descendant native elements, so the document semantics of the underlying HTML (headings, lists, code) are preserved for assistive tech

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | No | — | Authored flow content (headings, paragraphs, lists, code, tables) to style. |
| `dangerouslySetInnerHTML` | `{ __html: string }` | No | — | Rendered HTML you do not control (CMS, markdown pipelines). Sanitize first. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-font-sans`
- `--cascivo-font-mono`
- `--cascivo-font-semibold`
- `--cascivo-leading-tight`
- `--cascivo-leading-relaxed`
- `--cascivo-tracking-tight`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-accent-hover`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-indicator`
- `--cascivo-radius-surface`

## Examples

### Authored content

```jsx
<Prose><h2>Install</h2><p>Run <code>npx cascivo init</code>.</p></Prose>
```

### Rendered markdown

The use case: HTML you do not control (CMS, markdown pipelines)

```jsx
<Prose dangerouslySetInnerHTML={{ __html: html }} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| source HTML | flexible | Accepts authored children or rendered markup |
| token names | strict | All typography and surface styling resolves to --cascivo-* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Prose component (display). Wrapper that styles raw descendant HTML — headings, lists, code, quotes, tables

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Prose is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-font-sans, --cascivo-font-mono, --cascivo-font-semibold, --cascivo-leading-tight, --cascivo-leading-relaxed, --cascivo-tracking-tight, --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-color-accent, --cascivo-color-accent-hover, --cascivo-color-surface, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-radius-indicator, --cascivo-radius-surface

Accessibility: role "generic", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — All typography and surface styling resolves to --cascivo-* tokens
Flexible: source HTML.

Do not invent props, tokens, or global viewport media queries.
```
