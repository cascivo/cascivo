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

| Name       | Type      | Required  | Default | Description                               |
| ---------- | --------- | --------- | ------- | ----------------------------------------- | ----- | --- | --- | --- |
| `src`      | `string`  | No        | —       | —                                         |
| `alt`      | `string`  | No        | —       | —                                         |
| `fallback` | `string`  | No        | —       | Initials shown when no image is available |
| `size`     | `'xs'     | 'sm'      | 'md'    | 'lg'                                      | 'xl'` | No  | md  | —   |
| `status`   | `'online' | 'offline' | 'busy'` | No                                        | —     | —   |

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

### Fallback

```jsx
<Avatar fallback="JD" alt="Jane Doe" />
```

### With status

```jsx
<Avatar fallback="JD" status="online" />
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
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Avatar is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent-subtle, --cascivo-color-success, --cascivo-color-destructive, --cascivo-radius-full

Accessibility: role "img", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Fallback and status colors must resolve to --cascivo-* semantic tokens
Flexible: size.

Do not invent props, tokens, or global viewport media queries.
```
