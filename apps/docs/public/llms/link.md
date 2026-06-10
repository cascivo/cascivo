# Link

Styled anchor for navigation, standalone or inline within prose

## Install

```bash
npx cascade add link
```

## Category

`navigation`

## Variants

- `standalone`
- `inline`

## Sizes

- `sm`
- `md`
- `lg`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'standalone' | 'inline'` | no | `standalone` | — |
| `size` | `'sm' | 'md' | 'lg'` | no | `md` | — |
| `external` | `boolean` | no | `false` | — |
| `href` | `string` | no | — | — |

## Examples

### Standalone

```tsx
<Link href="/docs">View documentation</Link>
```

### Inline

Inline links inherit the surrounding font size and stay underlined.

```tsx
<p>Read the <Link variant="inline" href="/guide">guide</Link> first.</p>
```

### External

Opens in a new tab with rel="noreferrer" and a visual indicator.

```tsx
<Link external href="https://example.com">Example</Link>
```

## Design tokens

- `--cascade-color-accent`
- `--cascade-color-accent-hover`
- `--cascade-color-accent-active`
- `--cascade-radius-sm`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `link`
- **Keyboard:** Enter

## Dependencies

- `@cascade-ui/core`

## Tags

link, anchor, navigation
