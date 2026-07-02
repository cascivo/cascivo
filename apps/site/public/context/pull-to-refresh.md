# PullToRefresh

**Category:** feedback  
**Description:** Wraps a scrollable region and triggers a refresh when pulled down past a threshold at the top

## When to use

- A scrollable list or feed on touch devices that the user refreshes by pulling down from the top
- Mobile screens where a dedicated refresh button would be redundant or out of reach
- Content that updates on demand and benefits from a familiar pull gesture

## When NOT to use

- Desktop, pointer-first surfaces — provide an explicit Refresh button
- Content that auto-refreshes or paginates on scroll — use infinite scroll instead
- Regions that are not the primary scroll container of the screen

## Anti-patterns

### Pull-to-refresh is touch-only; keyboard and pointer users need an explicit control

**Bad:** `Wrapping a non-scrolling element and relying on pull as the only refresh path`  
**Good:** `Wrap the scroll container and also expose a Refresh control for non-touch users`  
**Why:** Pull-to-refresh is touch-only; keyboard and pointer users need an explicit control

## Related components

- **Spinner** (contains): Shows the Spinner while the refresh promise settles
- **ScrollArea** (pairs-with): Wraps a scrollable region; pair with the app’s scroll container

## Accessibility rationale

The gesture is a touch-only enhancement: it arms only at scrollTop 0 and uses touch-action/overscroll containment so normal scrolling and keyboard use are unaffected. A polite aria-live status region announces the pull, release, and refreshing states (strings from the i18n catalog), and the Spinner exposes role="status" while loading. Because pull-to-refresh cannot be performed without a pointer, apps should also offer an explicit refresh control for keyboard users.

## Props

| Name        | Type                                                       | Required | Default | Description                                                        |
| ----------- | ---------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `onRefresh` | `() => Promise<unknown>                                    | unknown` | Yes     | —                                                                  | Called when the pull passes the threshold; the spinner shows until it settles |
| `children`  | `React.ReactNode`                                          | Yes      | —       | Content rendered inside the component.                             |
| `threshold` | `number`                                                   | No       | 64      | Pull distance (px) required to trigger a refresh.                  |
| `disabled`  | `boolean`                                                  | No       | —       | When true, disables the control and removes it from the tab order. |
| `labels`    | `{ pull?: string; release?: string; refreshing?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n).         |
| `className` | `string`                                                   | No       | —       | Additional CSS class names merged onto the root element.           |

## Tokens

- `--cascivo-color-text-muted`
- `--cascivo-motion-enter`

## Examples

### Basic

The spinner shows until the returned promise settles.

```jsx
<PullToRefresh onRefresh={() => refetch()}>
  <FeedList items={items} />
</PullToRefresh>
```

### Custom threshold

Requires a longer pull before a refresh is triggered.

```jsx
<PullToRefresh onRefresh={loadLatest} threshold={96}>
  <MessageList />
</PullToRefresh>
```

## Boundaries

| Area      | Level    | Note                                                             |
| --------- | -------- | ---------------------------------------------------------------- |
| threshold | flexible | Pull distance required to trigger is configurable (default 64px) |
| onRefresh | flexible | May return a promise; the spinner persists until it settles      |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo PullToRefresh component (feedback). Wraps a scrollable region and triggers a refresh when pulled down past a threshold at the top

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

PullToRefresh is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text-muted, --cascivo-motion-enter

Accessibility: role "status", WCAG 2.2-AA. Keep it AA.
Flexible: threshold, onRefresh.

Do not invent props, tokens, or global viewport media queries.
```
