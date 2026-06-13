# OverflowMenu

**Category:** overlay  
**Description:** Kebab icon button revealing a menu of row-level actions

## When to use

- Collapsing secondary row-level or item-level actions behind a kebab trigger in dense layouts like tables and lists
- Offering a small set of actions where a destructive option needs visual distinction

## When NOT to use

- A primary action that should always be visible — use Button
- Selecting a single value from a set rather than triggering actions — use Select or Dropdown
- New code — this component is deprecated in favor of Menu

## Anti-patterns

### A kebab menu keeps dense rows scannable; surfacing every action inline competes for attention and breaks alignment

**Bad:** `Rendering every row action as a visible Button in a crowded table`  
**Good:** `<OverflowMenu items={[{ label: "Edit", value: "edit" }, { label: "Delete", value: "delete", destructive: true }]} onSelect={handle} />`  
**Why:** A kebab menu keeps dense rows scannable; surfacing every action inline competes for attention and breaks alignment

## Related components

- **Menu** (alternative): Preferred replacement; OverflowMenu is deprecated and delegates to Dropdown internally
- **Dropdown** (contains): OverflowMenu is a kebab-triggered wrapper around Dropdown
- **Button** (alternative): Use for a single always-visible action instead of hiding it in a menu

## Accessibility rationale

The kebab trigger carries a localized aria-label since it has no visible text, and the revealed list uses Dropdown's menu semantics so arrow keys, Home/End, Enter/Space, and Escape work without custom handling.

## Props

| Name        | Type                                                                                              | Required      | Default      | Description |
| ----------- | ------------------------------------------------------------------------------------------------- | ------------- | ------------ | ----------- | --- |
| `items`     | `{ label: string; value: string; icon?: ReactNode; disabled?: boolean; destructive?: boolean }[]` | Yes           | —            | —           |
| `onSelect`  | `(value: string) => void`                                                                         | No            | —            | —           |
| `placement` | `'bottom-start'                                                                                   | 'bottom-end'` | No           | bottom-end  | —   |
| `ariaLabel` | `string`                                                                                          | No            | More actions | —           |
| `size`      | `'sm'                                                                                             | 'md'`         | No           | md          | —   |
| `disabled`  | `boolean`                                                                                         | No            | false        | —           |
| `className` | `string`                                                                                          | No            | —            | —           |

## Tokens

- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-color-bg-subtle`
- `--cascade-color-destructive`
- `--cascade-color-destructive-subtle`
- `--cascade-radius-button`
- `--cascade-focus-ring`

## Examples

### Row actions

```jsx
<OverflowMenu
  items={[
    { label: 'Edit', value: 'edit' },
    { label: 'Delete', value: 'delete', destructive: true },
  ]}
  onSelect={handle}
/>
```

### Small, start-aligned

```jsx
<OverflowMenu size="sm" placement="bottom-start" items={items} />
```

## Boundaries

| Area                | Level    | Note                                                                    |
| ------------------- | -------- | ----------------------------------------------------------------------- |
| token names         | strict   | Trigger and item styling must resolve to the listed --cascade-\* tokens |
| item set and labels | flexible | items, ariaLabel, and placement are free to suit the context            |
