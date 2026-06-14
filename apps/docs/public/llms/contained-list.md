# ContainedList

Labelled list of rows inside a bordered container

## Install

```bash
npx cascivo add contained-list
```

## Category

`display`

## Variants

- `on-page`
- `disclosed`

## Props

| Prop     | Type        | Required     | Default | Description |
| -------- | ----------- | ------------ | ------- | ----------- | --- |
| `label`  | `ReactNode` | yes          | —       | —           |
| `kind`   | `'on-page'  | 'disclosed'` | no      | `on-page`   | —   |
| `action` | `ReactNode` | no           | —       | —           |

## Examples

### Basic contained list

```tsx
<ContainedList label="Members">
  <ContainedListItem>Ada Lovelace</ContainedListItem>
  <ContainedListItem>Alan Turing</ContainedListItem>
</ContainedList>
```

### Interactive rows

```tsx
<ContainedList label="Settings" kind="disclosed">
  <ContainedListItem asChild>
    <button type="button" onClick={open}>
      Profile
    </button>
  </ContainedListItem>
</ContainedList>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-surface`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`
- **Keyboard:** Tab, Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

list, container, rows, group
