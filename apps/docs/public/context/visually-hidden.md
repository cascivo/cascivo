# VisuallyHidden

**Category:** display  
**Description:** Hides content visually while keeping it available to screen readers

## When to use

- Giving an icon-only control an accessible name without showing text
- Adding screen-reader-only context that would be redundant visually
- Providing off-screen labels for tables, links, or form controls

## When NOT to use

- Hiding content from everyone — use hidden or display:none
- Temporarily hiding then revealing UI — use conditional rendering

## Anti-patterns

### VisuallyHidden keeps content in the accessibility tree — using it to hide noise pollutes screen-reader output

**Bad:** `Wrapping decorative content in VisuallyHidden to "clean up" the layout`  
**Good:** `aria-hidden on decorative elements; VisuallyHidden only for content screen readers need`  
**Why:** VisuallyHidden keeps content in the accessibility tree — using it to hide noise pollutes screen-reader output

## Related components

- **SkipNav** (alternative): SkipNav uses a similar hidden-until-focused technique for skip links

## Accessibility rationale

Applies the standard clip technique so content stays in the DOM and accessibility tree while being painted off-screen — assistive tech reads it, sighted users do not see it

## Props

| Name       | Type        | Required | Default | Description                                               |
| ---------- | ----------- | -------- | ------- | --------------------------------------------------------- |
| `children` | `ReactNode` | Yes      | —       | Content announced by assistive technology but not painted |

## Examples

### Icon button label

Gives an icon-only control an accessible name

```jsx
<button type="button">
  <CloseIcon />
  <VisuallyHidden>Close dialog</VisuallyHidden>
</button>
```

### Table context

```jsx
<th>
  Price <VisuallyHidden>(in euros)</VisuallyHidden>
</th>
```

## Boundaries

| Area                 | Level    | Note                                                    |
| -------------------- | -------- | ------------------------------------------------------- |
| children             | flexible | Any text/content meant for assistive tech               |
| visibility technique | strict   | Must keep content in the a11y tree — never display:none |
