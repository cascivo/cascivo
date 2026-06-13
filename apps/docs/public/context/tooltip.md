# Tooltip

**Category:** overlay  
**Description:** Contextual label shown on hover or focus

## When to use

- Labeling an icon-only control or clarifying a terse element on hover or focus
- Showing brief, supplementary text that is non-essential to completing the task
- Progressive disclosure of a short hint anchored to a trigger element

## When NOT to use

- The content is interactive (links, buttons, inputs) — use Popover
- Richer non-interactive preview content is needed — use HoverCard
- The information is essential and must always be visible — render it inline instead

## Anti-patterns

### Tooltips are hover/focus hints and cannot reliably hold focusable content; interactive content belongs in a Popover

**Bad:** `<Tooltip content={<button>Undo</button>}><Icon /></Tooltip>`  
**Good:** `<Popover><button>Undo</button></Popover>`  
**Why:** Tooltips are hover/focus hints and cannot reliably hold focusable content; interactive content belongs in a Popover

## Related components

- **Popover** (alternative): Use when the floating content is interactive
- **HoverCard** (alternative): Use for richer non-interactive preview content
- **Button** (pairs-with): Commonly wraps an icon button to explain its action

## Accessibility rationale

The floating element uses role="tooltip" and is linked to the trigger via aria-describedby only while visible; it shows on both hover and keyboard focus so it is reachable without a pointer.

## Props

| Name        | Type           | Required | Default  | Description                         |
| ----------- | -------------- | -------- | -------- | ----------------------------------- | --- | --- | --- |
| `content`   | `ReactNode`    | Yes      | —        | —                                   |
| `placement` | `'top'         | 'right'  | 'bottom' | 'left'`                             | No  | top | —   |
| `children`  | `ReactElement` | Yes      | —        | —                                   |
| `delay`     | `number`       | No       | 200      | Milliseconds to wait before showing |

## Tokens

- `--cascade-color-text`
- `--cascade-color-text-on-accent`
- `--cascade-radius-sm`
- `--cascade-z-tooltip`

## Examples

### Basic

```jsx
<Tooltip content="Copy to clipboard">
  <Button>Copy</Button>
</Tooltip>
```

## Boundaries

| Area      | Level    | Note                                             |
| --------- | -------- | ------------------------------------------------ | ----- | ------ | ------------------------------- |
| placement | strict   | Limited to top                                   | right | bottom | left, positioned via CSS anchor |
| delay     | flexible | Consumer can tune the show delay (default 200ms) |
