# ScrollArea

**Category:** layout  
**Description:** A scroll container with styled, slim scrollbars and overflow shadows

## When to use

- Constraining a region to a fixed height/width with overflow scrolling
- Giving long lists, tables, or code blocks consistent slim scrollbars across browsers
- Signalling more content with subtle top/bottom scroll shadows

## When NOT to use

- Whole-page scrolling — let the document scroll naturally
- Content that should determine its own height — do not cap it

## Anti-patterns

### Nested scroll regions trap focus and confuse pointer and keyboard scrolling

**Bad:** `Nesting many ScrollAreas so the user faces competing scrollbars`  
**Good:** `Scroll one region; let the rest size to content`  
**Why:** Nested scroll regions trap focus and confuse pointer and keyboard scrolling

## Related components

- **Separator** (pairs-with): Often divides items inside a scrolled list

## Accessibility rationale

Native overflow keeps the container keyboard-scrollable and focusable per browser defaults; styling never removes the scroll affordance, only restyles it

## Props

| Name          | Type        | Required     | Default | Description                                       |
| ------------- | ----------- | ------------ | ------- | ------------------------------------------------- | -------- | ------------------------------------------------------- |
| `height`      | `string`    | No           | —       | Max block size of the container (any CSS length)  |
| `width`       | `string`    | No           | —       | Max inline size of the container (any CSS length) |
| `orientation` | `'vertical' | 'horizontal' | 'both'` | No                                                | vertical | Which axes may scroll                                   |
| `edges`       | `'shadow'   | 'mask'       | 'none'` | No                                                | shadow   | Edge affordance: box-shadow, a mask-image fade, or none |
| `children`    | `ReactNode` | No           | —       | Scrollable content                                |

## Tokens

- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-radius-control`
- `--cascivo-scroll-area-height`
- `--cascivo-scroll-area-width`

## Examples

### Vertical scroll

```jsx
<ScrollArea height="12rem">
  <p>Long content…</p>
</ScrollArea>
```

### Both axes

```jsx
<ScrollArea height="12rem" width="20rem" orientation="both">
  <table>…</table>
</ScrollArea>
```

## Boundaries

| Area             | Level    | Note                                                                  |
| ---------------- | -------- | --------------------------------------------------------------------- |
| orientation      | flexible | vertical, horizontal, or both depending on content                    |
| scroll behaviour | strict   | Relies on native overflow scrolling — never replace with JS scrolling |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ScrollArea component (layout). A scroll container with styled, slim scrollbars and overflow shadows

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ScrollArea is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border, --cascivo-color-surface, --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-radius-control, --cascivo-scroll-area-height, --cascivo-scroll-area-width

Accessibility: role "none", WCAG 2.2-AA, keyboard: ArrowUp/ArrowDown/PageUp/PageDown/Home/End. Keep it AA.

Do not change (strict): scroll behaviour — Relies on native overflow scrolling — never replace with JS scrolling
Flexible: orientation.

Do not invent props, tokens, or global viewport media queries.
```
