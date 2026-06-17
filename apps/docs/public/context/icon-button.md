# IconButton

**Category:** inputs  
**Description:** Square, icon-only button with a required accessible label

## When to use

- A compact, recognizable action where an icon alone communicates intent (close, edit, more)
- Dense toolbars or table rows where a text label would not fit

## When NOT to use

- The action is not universally recognizable by its icon — use a Button with a text label
- Navigating between pages — use an anchor (optionally via asChild)

## Anti-patterns

### An icon-only control has no visible text, so the label prop is the only accessible name screen readers can announce

**Bad:** `<IconButton label=""><TrashIcon /></IconButton>`  
**Good:** `<IconButton label="Delete item"><TrashIcon /></IconButton>`  
**Why:** An icon-only control has no visible text, so the label prop is the only accessible name screen readers can announce

## Related components

- **Button** (alternative): Use a Button when the action needs a visible text label
- **ButtonGroup** (contained-by): Icon buttons are commonly joined into a toolbar via ButtonGroup

## Accessibility rationale

Renders a native <button> with a mandatory aria-label so the icon-only control always exposes an accessible name; focus, role, and Enter/Space activation come from the platform

## Props

| Name       | Type                                         | Required  | Default   | Description |
| ---------- | -------------------------------------------- | --------- | --------- | ----------- | ----- | --- |
| `label`    | `string`                                     | Yes       | —         | —           |
| `icon`     | `React.ReactNode`                            | No        | —         | —           |
| `variant`  | `'ghost'                                     | 'outline' | 'filled'` | No          | ghost | —   |
| `size`     | `'sm'                                        | 'md'      | 'lg'`     | No          | md    | —   |
| `asChild`  | `boolean`                                    | No        | false     | —           |
| `disabled` | `boolean`                                    | No        | false     | —           |
| `onClick`  | `React.MouseEventHandler<HTMLButtonElement>` | No        | —         | —           |

## Tokens

- `--cascivo-control-height-sm`
- `--cascivo-control-height-md`
- `--cascivo-control-height-lg`
- `--cascivo-button-radius`
- `--cascivo-radius-control`
- `--cascivo-color-primary`
- `--cascivo-color-primary-fg`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-focus-ring`

## Examples

### Ghost

```jsx
<IconButton label="Settings">
  <GearIcon />
</IconButton>
```

### Filled

```jsx
<IconButton label="Add" variant="filled" icon={<PlusIcon />} />
```

### As link

```jsx
<IconButton label="Home" asChild>
  <a href="/">
    <HomeIcon />
  </a>
</IconButton>
```

## Boundaries

| Area        | Level    | Note                                                                                                  |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------- |
| token names | strict   | Sizing must resolve to --cascivo-control-height-\* so it stays square and aligned with other controls |
| icon choice | flexible | Any single icon node; consumer owns the icon set                                                      |
