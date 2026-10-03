# ShareMenu

A Share button opening intent links for Bluesky, Mastodon, Threads, LinkedIn and X, plus copy link and the system share sheet

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add share-menu
```

Or use it from the prebuilt package without copying:

```tsx
import { ShareMenu } from '@cascivo/react'
```

## Category

`overlay`

## Sizes

- `sm`
- `md`

## States

- `closed`
- `open`
- `copied`

## Props

| Prop        | Type                                                                                                                            | Required | Default                                               | Description                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| `url`       | `string`                                                                                                                        | yes      | —                                                     | The page being shared                                                    |
| `text`      | `string`                                                                                                                        | no       | —                                                     | Text to post alongside the link (LinkedIn takes none; it reads the page) |
| `items`     | `Array<'bluesky' \| 'mastodon' \| 'threads' \| 'linkedin' \| 'x'>`                                                              | no       | `['bluesky', 'mastodon', 'threads', 'linkedin', 'x']` | The networks offered, in order                                           |
| `size`      | `'sm' \| 'md'`                                                                                                                  | no       | `md`                                                  | Visual size of the component (e.g. 'sm', 'md', 'lg').                    |
| `labels`    | `{ share?: string; copyLink?: string; copied?: string; more?: string; server?: string; shareOn?: (network: string) => string }` | no       | —                                                     | Overrides the built-in i18n labels per instance                          |
| `className` | `string`                                                                                                                        | no       | —                                                     | Class added to the root element                                          |

## Examples

### Default

```tsx
<ShareMenu url="https://cascivo.com/blog/launch" text="cascivo 1.0 is out" />
```

### Chosen networks

Offer only the networks your readers use, in your order

```tsx
<ShareMenu url={url} items={['bluesky', 'mastodon']} size="sm" />
```

### Just the link

shareIntentUrl builds the same compose link for your own markup; it returns null for Mastodon without a server

```tsx
import { shareIntentUrl } from './share-menu'
;<a href={shareIntentUrl('bluesky', { url, text }) ?? undefined}>Post to Bluesky</a>
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

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

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space, Escape, Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

share, social, bluesky, mastodon, threads, linkedin, popover, link

---

_Generated from registry v1.6.0 on 2026-10-02. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
