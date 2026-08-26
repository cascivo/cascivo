# LargeTitleHeader

Scrolling region whose large title collapses into a compact sticky bar as it scrolls

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add large-title-header
```

Or use it from the prebuilt package without copying:

```tsx
import { LargeTitleHeader } from '@cascivo/react'
```

## Category

`navigation`

## States

- `expanded`
- `collapsed`

## Props

| Prop               | Type              | Required | Default | Description                                                                   |
| ------------------ | ----------------- | -------- | ------- | ----------------------------------------------------------------------------- |
| `title`            | `string`          | yes      | —       | The page title, rendered as the large heading and mirrored in the compact bar |
| `children`         | `React.ReactNode` | yes      | —       | Content rendered inside the component.                                        |
| `leading`          | `React.ReactNode` | no       | —       | Leading slot of the compact bar — typically a back control                    |
| `actions`          | `React.ReactNode` | no       | —       | Trailing slot of the compact bar — typically icon buttons                     |
| `level`            | `1 \| 2 \| 3`     | no       | `1`     | Heading level for the title, mapping to h1–h3.                                |
| `collapseDistance` | `number`          | no       | `48`    | Scroll distance (px) over which the large title collapses into the bar.       |
| `className`        | `string`          | no       | —       | Additional CSS class names merged onto the root element.                      |

## Examples

### Basic

The component owns the scroll container; give it a parent with a height.

```tsx
<LargeTitleHeader title="Library">
  <List>
    <ListItem>Recently Added</ListItem>
    <ListItem>Artists</ListItem>
    <ListItem>Albums</ListItem>
  </List>
</LargeTitleHeader>
```

### With a back control and actions

Both slots stay in the compact bar and never scroll away.

```tsx
<LargeTitleHeader
  title="Downloads"
  leading={
    <IconButton label="Back" onClick={goBack}>
      ←
    </IconButton>
  }
  actions={<IconButton label="Sort">⇅</IconButton>}
>
  <FileList files={files} />
</LargeTitleHeader>
```

### Longer collapse

Stretches the reveal over more scroll distance.

```tsx
<LargeTitleHeader title="Recently Played" collapseDistance={96}>
  <TrackList tracks={tracks} />
</LargeTitleHeader>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-foreground`
- `--cascivo-border-subtle`
- `--cascivo-text-ui`
- `--cascivo-text-heading-lg`
- `--cascivo-font-semibold`
- `--cascivo-font-bold`
- `--cascivo-leading-tight`
- `--cascivo-target-min-coarse`
- `--cascivo-z-raised`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `heading`

## Dependencies

- `@cascivo/core`

## Tags

navigation, header, title, mobile, scroll, sticky, ios

---

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
