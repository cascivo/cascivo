# Item

**Category:** display  
**Description:** Generic content row primitive with media, content, and action regions

## When to use

- Composing a single content row with leading media, a text block, and trailing actions
- Building list, menu, or card rows from a consistent layout primitive
- Slotting a row onto a real anchor or button via asChild for navigation or selection

## When NOT to use

- A full surface with elevation and padding regions — use Card
- Key-value metadata pairs — use DataList

## Anti-patterns

### asChild merges row styling onto the real interactive element instead of nesting a non-semantic div

**Bad:** `Wrapping an Item div in an anchor to make the whole row clickable`  
**Good:** `Use Item asChild with the anchor as the single child so semantics and focus are native`  
**Why:** asChild merges row styling onto the real interactive element instead of nesting a non-semantic div

## Related components

- **Card** (alternative): Card is a padded surface; Item is a lightweight horizontal row
- **ContainedListItem** (alternative): ContainedListItem is bound to a contained list; Item is a free-standing row

## Accessibility rationale

Item is presentational by default; the slotted element determines the role and focus behaviour, so wrap it asChild around a button or link when the row is interactive

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `asChild` | `boolean` | No | false | — |
| `variant` | `'default' | 'muted'` | No | default | — |
| `size` | `'sm' | 'md'` | No | md | — |

## Tokens

- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-item`
- `--cascivo-space-3`

## Examples

### Item with media, content, and actions

```jsx
<Item>
  <ItemMedia><Avatar /></ItemMedia>
  <ItemContent>
    <ItemTitle>Ada Lovelace</ItemTitle>
    <ItemDescription>Mathematician</ItemDescription>
  </ItemContent>
  <ItemActions><Button size="sm">Edit</Button></ItemActions>
</Item>
```

### As a link via asChild

```jsx
<Item asChild>
  <a href="/profile">
    <ItemContent><ItemTitle>Profile</ItemTitle></ItemContent>
  </a>
</Item>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| variant and size | flexible | Tune density and emphasis to match the surrounding list |
| compound parts | flexible | Media, content, title, description, and actions are optional and composable |
