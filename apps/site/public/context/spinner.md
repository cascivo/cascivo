# Spinner

**Category:** feedback  
**Description:** Indeterminate loading indicator

## When to use

- Indicating indeterminate work where duration and progress are unknown
- Loading a small region or inline control where a shape preview is unnecessary
- Showing busy state in buttons or compact UI

## When NOT to use

- Progress with a known percentage — use ProgressBar or ProgressCircle
- Loading content with a known structure — use Skeleton

## Anti-patterns

### Skeletons preview structure and feel faster; spinners are best for short, shapeless waits

**Bad:** `A full-page spinner for content whose layout is known`  
**Good:** `<Skeleton> mirroring the content shape to reduce perceived wait and layout shift`  
**Why:** Skeletons preview structure and feel faster; spinners are best for short, shapeless waits

## Related components

- **Skeleton** (alternative): Skeleton suits content with a known shape
- **ProgressBar** (alternative): ProgressBar suits determinate progress

## Accessibility rationale

role="status" with an accessible label (default "Loading", i18n-driven) so assistive tech announces the busy state rather than leaving the spin silent

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `label` | `string` | No | Loading | Accessible label announced by screen readers |

## Tokens

- `--cascivo-radius-full`

## Examples

### Default

```jsx
<Spinner />
```

### Large

```jsx
<Spinner size="lg" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| size | flexible | sm/md/lg to fit inline vs standalone use |
| token names | strict | Radius must resolve to --cascivo-radius-full |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Spinner component (feedback). Indeterminate loading indicator

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Spinner is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-radius-full

Accessibility: role "status", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Radius must resolve to --cascivo-radius-full
Flexible: size.

Do not invent props, tokens, or global viewport media queries.
```
