# Image

**Category:** display  
**Description:** Image with load state, blur-up placeholder, graceful fallback, and optional zoom

## When to use

- Displaying a content image that should show a placeholder while loading and degrade gracefully on error
- Photos, thumbnails, or media that benefit from a blur-up placeholder or hover zoom
- Any image where a broken src should fall back rather than show a broken-image icon

## When NOT to use

- Identity thumbnails for a person or entity — use Avatar
- Purely decorative shapes or a fixed-ratio layout box with no load behavior — use AspectRatio

## Anti-patterns

### Without alt the image is invisible to assistive tech; pass an empty alt only for decorative images

**Bad:** `<Image src="/photo.jpg" /> with no alt`  
**Good:** `<Image src="/photo.jpg" alt="Sunset over the bay" />`  
**Why:** Without alt the image is invisible to assistive tech; pass an empty alt only for decorative images

## Related components

- **Avatar** (alternative): Use Avatar for identity thumbnails with an initials fallback
- **AspectRatio** (alternative): Use AspectRatio for a ratio box that does not own image load behavior

## Accessibility rationale

role="img" with alt names the image; on error it shows a fallback image or neutral box so layout survives; the blur-up and zoom transitions are disabled under prefers-reduced-motion

## Props

| Name            | Type      | Required | Default | Description                                               |
| --------------- | --------- | -------- | ------- | --------------------------------------------------------- | ------------------------ | --- | --- | ---------------------------------- | ---- | ---- | ---- | -------- |
| `src`           | `string`  | No       | —       | Image source URL.                                         |
| `alt`           | `string`  | No       | —       | Alternative text describing the image.                    |
| `fallbackSrc`   | `string`  | No       | —       | Image shown if src fails to load                          |
| `width`         | `string   | number`  | No      | —                                                         | Width of the component.  |
| `height`        | `string   | number`  | No      | —                                                         | Height of the component. |
| `radius`        | `'none'   | 'sm'     | 'md'    | 'lg'                                                      | 'full'`                  | No  | md  | Corner radius of the image ('none' | 'sm' | 'md' | 'lg' | 'full'). |
| `zoom`          | `boolean` | No       | false   | When true, zooms the image on hover.                      |
| `removeWrapper` | `boolean` | No       | false   | Render a bare <img> with no wrapper, placeholder, or zoom |
| `isBlurred`     | `boolean` | No       | false   | When true, renders a blurred backdrop behind the image.   |

## Tokens

- `--cascivo-radius-none`
- `--cascivo-radius-sm`
- `--cascivo-radius-md`
- `--cascivo-radius-lg`
- `--cascivo-radius-full`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-space-12`

## Examples

### Basic

```jsx
<Image src="/photo.jpg" alt="A photo" width={320} height={240} />
```

### With fallback

```jsx
<Image src="/broken.jpg" fallbackSrc="/placeholder.jpg" alt="A photo" />
```

### Blurred placeholder

```jsx
<Image src="/photo.jpg" alt="A photo" isBlurred />
```

### Hover zoom

```jsx
<Image src="/photo.jpg" alt="A photo" zoom />
```

## Boundaries

| Area        | Level    | Note                                                              |
| ----------- | -------- | ----------------------------------------------------------------- |
| radius      | flexible | Pick the corner radius that matches the surrounding surface       |
| token names | strict   | Radius and placeholder colors must resolve to --cascivo-\* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Image component (display). Image with load state, blur-up placeholder, graceful fallback, and optional zoom

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Image is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-radius-none, --cascivo-radius-sm, --cascivo-radius-md, --cascivo-radius-lg, --cascivo-radius-full, --cascivo-color-bg-subtle, --cascivo-color-border, --cascivo-space-12

Accessibility: role "img", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Radius and placeholder colors must resolve to --cascivo-* tokens
Flexible: radius.

Do not invent props, tokens, or global viewport media queries.
```
