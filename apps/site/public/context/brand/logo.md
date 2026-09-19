# Logo

**Category:** display  
**Description:** The cascivo mark and its sanctioned lockups, as inline SVG

## When to use

- Placing the cascivo logo in a header, footer, auth screen or splash
- Needing the mark to repaint with the surrounding data-theme instead of shipping a per-theme image
- Any spot that would otherwise hand-roll the logo SVG or point an <img> at logo.svg

## When NOT to use

- Rendering an adopter's own brand — this is the cascivo mark, not a generic logo slot; pass your own node to AuthLayout's `logo` or ShellHeader's `brand` instead
- Below 16px — the notch closes optically; use the wordmark alone
- Favicons and app icons, which are static files with their own optical centring (see https://cascivo.com/docs/brand)

## Anti-patterns

### currentColor and --cascivo-color-accent only resolve when the SVG is inline, so an <img> cannot follow the theme

**Bad:** `<img src="/logo.svg" alt="cascivo" />`  
**Good:** `<Logo variant="horizontal" />`  
**Why:** currentColor and --cascivo-color-accent only resolve when the SVG is inline, so an <img> cannot follow the theme

### The mark is always 1:1 and never scales on one axis

**Bad:** `<Logo variant="mark" style={{ transform: "scaleX(1.4)" }} />`  
**Good:** `<Logo variant="mark" size={48} />`  
**Why:** The mark is always 1:1 and never scales on one axis

### The wordmark is lowercase cascivo; uppercasing it is a misuse of the mark

**Bad:** `Wrapping the logo in chrome that sets text-transform: uppercase`  
**Good:** `Leave the wordmark lowercase — the component pins text-transform: none`  
**Why:** The wordmark is lowercase cascivo; uppercasing it is a misuse of the mark

## Related components

- **ShellHeader** (contained-by): The nav lockup is what the header brand slot takes

## Accessibility rationale

The bare mark carries role="img" and a <title> so it is announced as "cascivo"; in a lockup the wordmark is real text, so the mark goes aria-hidden rather than announcing the name twice

## Props

| Name      | Type                                                            | Required | Default                    | Description                                                                                                                                          |
| --------- | --------------------------------------------------------------- | -------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant` | `'mark' \| 'mark-accent' \| 'horizontal' \| 'stacked' \| 'nav'` | No       | mark                       | `mark` and `mark-accent` render the square alone; `horizontal`, `stacked` and `nav` add the wordmark. `nav` is the only lockup permitted below 24px. |
| `size`    | `number`                                                        | No       | 18 for `nav`, 32 otherwise | Mark height in px. Clamped to a 16px floor — below that the notch closes optically.                                                                  |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-font-display`

## Examples

### Mark

```jsx
<Logo />
```

### Two colour

The accent fills the notch. Decoration — the mark is complete without it.

```jsx
<Logo variant="mark-accent" />
```

### Horizontal lockup

```jsx
<Logo variant="horizontal" />
```

### Nav lockup

18px mark, 16px wordmark, 10px gap — the only lockup allowed below 24px.

```jsx
<Logo variant="nav" />
```

### Stacked

```jsx
<Logo variant="stacked" size={48} />
```

## Boundaries

| Area    | Level    | Note                                                                                                                               |
| ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| size    | flexible | Any size at or above the 16px floor; the wordmark and gap scale from it                                                            |
| variant | strict   | A closed set of five. Do not invent a lockup — clear space, gaps and ratios are specified at https://cascivo.com/docs/brand        |
| colour  | strict   | Ink is currentColor and the notch is --cascivo-color-accent. Never recolour the ink off-token or fill the notch with anything else |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Logo component (display). The cascivo mark and its sanctioned lockups, as inline SVG

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Logo is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-font-display

Accessibility: role "img", WCAG 2.2-AA. Keep it AA.

Do not change (strict): variant — A closed set of five. Do not invent a lockup — clear space, gaps and ratios are specified at https://cascivo.com/docs/brand; colour — Ink is currentColor and the notch is --cascivo-color-accent. Never recolour the ink off-token or fill the notch with anything else
Flexible: size.

Do not invent props, tokens, or global viewport media queries.
```
