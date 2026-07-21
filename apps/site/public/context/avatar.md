# Avatar

**Category:** display  
**Description:** Displays a user image with initials fallback

## When to use

- Representing a person or entity with a thumbnail image and initials fallback
- Showing presence/status alongside an identity (status prop)
- Compactly identifying authors in lists, comments, and headers

## When NOT to use

- Decorative imagery unrelated to identity — use a plain <img>
- A generic icon or logo with no person/entity meaning

## Anti-patterns

### Without alt/fallback the identity is invisible to assistive tech and breaks on image load failure

**Bad:** `<Avatar src="/logo.png" /> with no alt and no fallback`  
**Good:** `<Avatar src="/jane.jpg" alt="Jane Doe" fallback="JD" />`  
**Why:** Without alt/fallback the identity is invisible to assistive tech and breaks on image load failure

## Related components

- **Status** (alternative): Use Status for a standalone state dot not attached to an identity

## Accessibility rationale

role="img" with alt names the person; on image error it falls back to initials so the identity survives; the status dot carries an accessible label rather than relying on color alone

## Props

| Name       | Type                                   | Required | Default | Description                                                                       |
| ---------- | -------------------------------------- | -------- | ------- | --------------------------------------------------------------------------------- |
| `src`      | `string`                               | No       | —       | Image source URL.                                                                 |
| `alt`      | `string`                               | No       | —       | Alternative text describing the image.                                            |
| `name`     | `string`                               | No       | —       | Full name — used to derive initials for the fallback and as the accessible label. |
| `fallback` | `string`                               | No       | —       | Explicit fallback text (initials/glyph); overrides initials derived from name.    |
| `size`     | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | No       | md      | Visual size of the component (e.g. 'sm', 'md', 'lg').                             |
| `status`   | `'online' \| 'offline' \| 'busy'`      | No       | —       | Status state.                                                                     |

## Tokens

- `--cascivo-color-accent-subtle`
- `--cascivo-color-success`
- `--cascivo-color-destructive`
- `--cascivo-radius-full`

## Examples

### Image

```jsx
<Avatar src="/jane.jpg" alt="Jane Doe" />
```

### Initials from name

Derives initials automatically; also sets the accessible label.

```jsx
<Avatar name="Ada Lovelace" /> // renders "AL"
```

### Explicit fallback

```jsx
<Avatar fallback="JD" alt="Jane Doe" />
```

### With status

```jsx
<Avatar name="Jane Doe" status="online" />
```

## Boundaries

| Area        | Level    | Note                                                                    |
| ----------- | -------- | ----------------------------------------------------------------------- |
| size        | flexible | Pick the size that fits the surrounding density                         |
| token names | strict   | Fallback and status colors must resolve to --cascivo-\* semantic tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Avatar component (display). Displays a user image with initials fallback

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Avatar is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent-subtle, --cascivo-color-success, --cascivo-color-destructive, --cascivo-radius-full

Accessibility: role "img", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Fallback and status colors must resolve to --cascivo-* semantic tokens
Flexible: size.

Do not invent props, tokens, or global viewport media queries.
```
