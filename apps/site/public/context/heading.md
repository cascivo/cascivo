# Heading

**Category:** display  
**Description:** Section heading with semantic level decoupled from visual size

## When to use

- Titling a page or section as part of the document outline
- Keeping the semantic heading level correct while choosing the visual size independently

## When NOT to use

- Emphasizing inline or body text — use Text with a weight
- Long-form rendered content — let Prose style its own headings

## Anti-patterns

### Skipping heading levels breaks the document outline screen-reader users rely on to navigate

**Bad:** `<Heading level={4} size="2xl"> chosen only to look big, skipping h2/h3`  
**Good:** `Keep levels sequential; use size to control scale within the correct level`  
**Why:** Skipping heading levels breaks the document outline screen-reader users rely on to navigate

## Related components

- **Text** (alternative): Text is for body copy; Heading is for outline structure
- **Prose** (alternative): Prose styles headings inside authored long-form content

## Accessibility rationale

Renders a real <h1>–<h6> from the level prop so the heading appears in the accessibility tree at the correct level; visual size is decoupled so styling never forces an incorrect level

## Props

| Name    | Type  | Required | Default | Description |
| ------- | ----- | -------- | ------- | ----------- | ------ | --- | -------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------- |
| `level` | `1    | 2        | 3       | 4           | 5      | 6`  | No                                                       | 2                                                     | Heading level (1–6) mapping to h1–h6. |
| `size`  | `'sm' | 'md'     | 'lg'    | 'xl'        | '2xl'` | No  | derived from level (1→2xl, 2→xl, 3→lg, 4→md, 5→sm, 6→sm) | Visual size of the component (e.g. 'sm', 'md', 'lg'). |

## Tokens

- `--cascivo-font-display`
- `--cascivo-font-semibold`
- `--cascivo-leading-tight`
- `--cascivo-tracking-tight`
- `--cascivo-color-text`
- `--cascivo-text-base`
- `--cascivo-text-lg`
- `--cascivo-text-xl`
- `--cascivo-text-2xl`
- `--cascivo-text-3xl`

## Examples

### Default

```jsx
<Heading>Section title</Heading>
```

### Page title

```jsx
<Heading level={1}>Page title</Heading>
```

### Decoupled size

Keep the document outline correct while controlling the visual scale

```jsx
<Heading level={2} size="2xl">
  Visually large, semantically h2
</Heading>
```

## Boundaries

| Area           | Level    | Note                                                         |
| -------------- | -------- | ------------------------------------------------------------ |
| size           | flexible | size may override the level-derived default for visual scale |
| level sequence | strict   | Levels must not skip — maintain a valid heading hierarchy    |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Heading component (display). Section heading with semantic level decoupled from visual size

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Heading is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-font-display, --cascivo-font-semibold, --cascivo-leading-tight, --cascivo-tracking-tight, --cascivo-color-text, --cascivo-text-base, --cascivo-text-lg, --cascivo-text-xl, --cascivo-text-2xl, --cascivo-text-3xl

Accessibility: role "heading", WCAG 2.2-AA. Keep it AA.

Do not change (strict): level sequence — Levels must not skip — maintain a valid heading hierarchy
Flexible: size.

Do not invent props, tokens, or global viewport media queries.
```
