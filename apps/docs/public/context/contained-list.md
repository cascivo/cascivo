# ContainedList

**Category:** display  
**Description:** Labelled list of rows inside a bordered container

## When to use

- Grouping a short set of related rows under a visible heading in a bordered surface
- Presenting selectable or navigable rows (settings groups, member lists)
- Separating a labelled cluster of items from surrounding page content

## When NOT to use

- A long, virtualised data set — use a Table or DataList instead
- Plain bulleted prose where the container border adds no meaning — use List

## Anti-patterns

### A non-interactive div gives no focus or role semantics to assistive tech

**Bad:** `Putting interactive controls on a plain ContainedListItem div`  
**Good:** `Use ContainedListItem asChild with a <button> or <a> so the row is keyboard-focusable`  
**Why:** A non-interactive div gives no focus or role semantics to assistive tech

## Related components

- **List** (alternative): List is for unbordered prose lists; ContainedList adds a labelled surface
- **ContainedListItem** (contains): Each row is a ContainedListItem

## Accessibility rationale

The container heading labels the ul/li structure; interactive rows must slot a real button or link via asChild so role and focus are native, not faked on a div

## Props

| Name     | Type        | Required     | Default | Description |
| -------- | ----------- | ------------ | ------- | ----------- | --- |
| `label`  | `ReactNode` | Yes          | —       | —           |
| `kind`   | `'on-page'  | 'disclosed'` | No      | on-page     | —   |
| `action` | `ReactNode` | No           | —       | —           |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-surface`
- `--cascivo-focus-ring`

## Examples

### Basic contained list

```jsx
<ContainedList label="Members">
  <ContainedListItem>Ada Lovelace</ContainedListItem>
  <ContainedListItem>Alan Turing</ContainedListItem>
</ContainedList>
```

### Interactive rows

```jsx
<ContainedList label="Settings" kind="disclosed">
  <ContainedListItem asChild>
    <button type="button" onClick={open}>
      Profile
    </button>
  </ContainedListItem>
</ContainedList>
```

## Boundaries

| Area           | Level    | Note                                                                     |
| -------------- | -------- | ------------------------------------------------------------------------ |
| kind           | flexible | on-page sits inline; disclosed adds a header band for menus and popovers |
| list semantics | strict   | Rows are always ul/li; do not replace with generic divs                  |
