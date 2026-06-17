# SkipNav

Skip link that jumps keyboard users past the navigation to the main content

## Install

```bash
npx cascivo add skip-nav
```

## Category

`navigation`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `targetId` | `string` | no | `cascade-skip-target` | SkipNavLink: id of the SkipNavTarget to jump to |
| `labels` | `{ label?: string }` | no | — | SkipNavLink: overrides the built-in i18n label per instance |
| `id` | `string` | no | `cascade-skip-target` | SkipNavTarget: anchor id — must match the link targetId |

## Examples

### Default pair

SkipNavLink must be the first focusable element on the page

```tsx
<><SkipNavLink /><nav>…</nav><SkipNavTarget /><main>…</main></>
```

### Custom target

```tsx
<><SkipNavLink targetId="main-content" /><SkipNavTarget id="main-content" /></>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-radius-control`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `link`
- **Keyboard:** Tab, Enter

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

accessibility, skip-link, keyboard, navigation
