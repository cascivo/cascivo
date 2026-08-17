# InfiniteScroll

Loads the next page when the end of a list scrolls into view

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add infinite-scroll
```

Or use it from the prebuilt package without copying:

```tsx
import { InfiniteScroll } from '@cascivo/react'
```

## Category

`feedback`

## States

- `idle`
- `loading`
- `disabled`

## Props

| Prop         | Type                                      | Required | Default   | Description                                                                                              |
| ------------ | ----------------------------------------- | -------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `onLoadMore` | `() => Promise<unknown> \| unknown`       | yes      | —         | Called when the sentinel comes into view, or the button is activated; the spinner shows until it settles |
| `disabled`   | `boolean`                                 | no       | `false`   | When true, stops observing and renders nothing — there are no more pages.                                |
| `rootMargin` | `string`                                  | no       | `'200px'` | How far ahead of the end to start loading, as an IntersectionObserver root margin.                       |
| `labels`     | `{ loadMore?: string; loading?: string }` | no       | —         | Overrides for the component’s user-visible strings (i18n).                                               |
| `className`  | `string`                                  | no       | —         | Additional CSS class names merged onto the root element.                                                 |

## Examples

### Basic

Place it as the last child of the scrolling region, after the list.

```tsx
<InfiniteScroll onLoadMore={loadNextPage} />
```

### Stopping at the last page

Renders nothing and stops observing once there is nothing left to load.

```tsx
<InfiniteScroll onLoadMore={loadNextPage} disabled={!hasMore} />
```

### Loading earlier

Starts the next page well before the user reaches the end.

```tsx
<InfiniteScroll onLoadMore={loadNextPage} rootMargin="600px" />
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-text-muted`
- `--cascivo-color-border`
- `--cascivo-color-surface-2`
- `--cascivo-color-foreground`
- `--cascivo-radius-md`
- `--cascivo-ring-width`
- `--cascivo-ring-color`
- `--cascivo-text-ui`
- `--cascivo-target-min-coarse`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

feedback, infinite-scroll, pagination, list, scroll, mobile, lazy

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
