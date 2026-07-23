# HoverCard

Hover-triggered popover with configurable open/close delay

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add hover-card
```

Or use it from the prebuilt package without copying:

```tsx
import { HoverCard } from '@cascivo/react'
```

## Category

`overlay`

## States

- `open`
- `closed`

## Props

| Prop         | Type              | Required | Default | Description                                                 |
| ------------ | ----------------- | -------- | ------- | ----------------------------------------------------------- |
| `children`   | `React.ReactNode` | yes      | —       | A HoverCardTrigger and HoverCardContent pair.               |
| `openDelay`  | `number`          | no       | `300`   | Delay (ms) before the card opens on hover/focus.            |
| `closeDelay` | `number`          | no       | `100`   | Delay (ms) before the card closes after hover/focus leaves. |

## Examples

### Profile preview

```tsx
<HoverCard>
  <HoverCardTrigger>
    <a href="/users/ada">@ada</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <Avatar name="Ada Lovelace" />
    <p>Wrote the first program.</p>
  </HoverCardContent>
</HoverCard>
```

### Custom delays

```tsx
<HoverCard openDelay={500} closeDelay={200}>
  <HoverCardTrigger>Definition</HoverCardTrigger>
  <HoverCardContent>A longer explanation shown on hover or focus.</HoverCardContent>
</HoverCard>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-md`
- `--cascivo-shadow-md`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `complementary`
- **Keyboard:** Tab, Escape

## Dependencies

- `@cascivo/core`

## Tags

overlay, hover, preview, floating

---

_Generated from registry v0.10.1 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
