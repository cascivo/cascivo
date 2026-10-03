# ShareMenu

**Category:** overlay  
**Description:** A Share button opening intent links for Bluesky, Mastodon, Threads, LinkedIn and X, plus copy link and the system share sheet

## When to use

- Letting readers share a page to a social network without any account, token or API on your side
- Article, release-note and product pages where sharing is a secondary action

## When NOT to use

- Posting on the user’s behalf from your app — connect their account and use the publishers in @cascivo/app/social
- Copying a single value — use CopyButton

## Anti-patterns

### Intent links need no third-party script, set no tracking cookies, and work before hydration

**Bad:** `Loading each network’s share widget script to get a share button`  
**Good:** `Use ShareMenu, whose entries are plain links to each network’s composer`  
**Why:** Intent links need no third-party script, set no tracking cookies, and work before hydration

## Related components

- **CopyButton** (alternative): Use when copying the link is the only sharing you need
- **MenuButton** (alternative): Use for a list of in-app actions rather than outbound links

## Accessibility rationale

The trigger is a native <button popovertarget>, so the browser supplies aria-expanded, Escape and outside-click dismissal, and focus return without script. The panel is a labelled disclosure of ordinary links and buttons in Tab order rather than an ARIA menu, so no arrow-key contract is implied. Each link names its network in text ("Share on Bluesky"), and the copy confirmation is announced through a polite live region.

## Props

| Name        | Type                                                                                                                            | Required | Default                                             | Description                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| `url`       | `string`                                                                                                                        | Yes      | —                                                   | The page being shared                                                    |
| `text`      | `string`                                                                                                                        | No       | —                                                   | Text to post alongside the link (LinkedIn takes none; it reads the page) |
| `items`     | `Array<'bluesky' \| 'mastodon' \| 'threads' \| 'linkedin' \| 'x'>`                                                              | No       | ['bluesky', 'mastodon', 'threads', 'linkedin', 'x'] | The networks offered, in order                                           |
| `size`      | `'sm' \| 'md'`                                                                                                                  | No       | md                                                  | Visual size of the component (e.g. 'sm', 'md', 'lg').                    |
| `labels`    | `{ share?: string; copyLink?: string; copied?: string; more?: string; server?: string; shareOn?: (network: string) => string }` | No       | —                                                   | Overrides the built-in i18n labels per instance                          |
| `className` | `string`                                                                                                                        | No       | —                                                   | Class added to the root element                                          |

## Tokens

- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-success`
- `--cascivo-color-surface`
- `--cascivo-color-surface-overlay`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-control-height-md`
- `--cascivo-control-height-sm`
- `--cascivo-focus-ring`
- `--cascivo-font-medium`
- `--cascivo-font-sans`
- `--cascivo-motion-enter`
- `--cascivo-radius-control`
- `--cascivo-radius-item`
- `--cascivo-radius-overlay`
- `--cascivo-shadow-overlay`
- `--cascivo-space-1`
- `--cascivo-space-2`
- `--cascivo-space-3`
- `--cascivo-space-4`
- `--cascivo-target-min-coarse`
- `--cascivo-text-sm`
- `--cascivo-text-xs`

## Examples

### Default

```jsx
<ShareMenu url="https://cascivo.com/blog/launch" text="cascivo 1.0 is out" />
```

### Chosen networks

Offer only the networks your readers use, in your order

```jsx
<ShareMenu url={url} items={['bluesky', 'mastodon']} size="sm" />
```

### Just the link

shareIntentUrl builds the same compose link for your own markup; it returns null for Mastodon without a server

```jsx
import { shareIntentUrl } from './share-menu'
;<a href={shareIntentUrl('bluesky', { url, text }) ?? undefined}>Post to Bluesky</a>
```

## Boundaries

| Area        | Level    | Note                                                                                        |
| ----------- | -------- | ------------------------------------------------------------------------------------------- |
| networks    | flexible | items picks and orders the networks; shareIntentUrl builds the same links for custom markup |
| token names | strict   | Styling resolves to the listed semantic --cascivo-\* tokens                                 |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ShareMenu component (overlay). A Share button opening intent links for Bluesky, Mastodon, Threads, LinkedIn and X, plus copy link and the system share sheet

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ShareMenu is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-bg-subtle, --cascivo-color-border, --cascivo-color-success, --cascivo-color-surface, --cascivo-color-surface-overlay, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-control-height-md, --cascivo-control-height-sm, --cascivo-focus-ring, --cascivo-font-medium, --cascivo-font-sans, --cascivo-motion-enter, --cascivo-radius-control, --cascivo-radius-item, --cascivo-radius-overlay, --cascivo-shadow-overlay, --cascivo-space-1, --cascivo-space-2, --cascivo-space-3, --cascivo-space-4, --cascivo-target-min-coarse, --cascivo-text-sm, --cascivo-text-xs

Accessibility: role "button", WCAG 2.2-AA, keyboard: Enter/Space/Escape/Tab. Keep it AA.

Do not change (strict): token names — Styling resolves to the listed semantic --cascivo-* tokens
Flexible: networks.

Do not invent props, tokens, or global viewport media queries.
```
