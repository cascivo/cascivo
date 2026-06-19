# AvatarGroup

**Category:** display  
**Description:** Overlapping stack of avatars with a max cap and an i18n-labelled +N overflow chip

## When to use

- Showing several people compactly as an overlapping stack (collaborators, attendees, reviewers)
- Capping a long list of avatars with a +N overflow chip
- A facepile in a card header, table cell, or activity row

## When NOT to use

- A single identity with a name — use User or Avatar
- A selectable list of people — use a list/menu with checkboxes

## Anti-patterns

### Without a max the row grows unbounded; a cap plus total keeps it compact and accurate

**Bad:** `<AvatarGroup>{hundredsOfAvatars}</AvatarGroup> with no max`  
**Good:** `<AvatarGroup max={5} total={120}>{avatars}</AvatarGroup>`  
**Why:** Without a max the row grows unbounded; a cap plus total keeps it compact and accurate

## Related components

- **Avatar** (contains): AvatarGroup arranges Avatar children and adds an overflow chip
- **User** (alternative): Use User for a single labelled identity row

## Accessibility rationale

The stack is a labelled group; the +N chip carries an i18n-defaulted aria-label ("{count} more") so the hidden count is announced, not conveyed by the chip text alone

## Props

| Name      | Type                | Required | Default | Description                                   |
| --------- | ------------------- | -------- | ------- | --------------------------------------------- | --- | --- |
| `max`     | `number`            | No       | —       | Cap the number of visible avatars             |
| `total`   | `number`            | No       | —       | Override the total count used for the +N chip |
| `spacing` | `'sm'               | 'md'     | 'lg'`   | No                                            | md  | —   |
| `isGrid`  | `boolean`           | No       | false   | —                                             |
| `labels`  | `AvatarGroupLabels` | No       | —       | —                                             |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-text-muted`
- `--cascivo-space-2`
- `--cascivo-text-xs`

## Examples

### Basic

```jsx
<AvatarGroup>
  <Avatar fallback="A" />
  <Avatar fallback="B" />
  <Avatar fallback="C" />
</AvatarGroup>
```

### With max

```jsx
<AvatarGroup max={3}>
  {users.map((u) => (
    <Avatar key={u.id} src={u.src} alt={u.name} />
  ))}
</AvatarGroup>
```

### Grid

```jsx
<AvatarGroup isGrid max={8}>
  {avatars}
</AvatarGroup>
```

## Boundaries

| Area           | Level    | Note                                                                             |
| -------------- | -------- | -------------------------------------------------------------------------------- |
| spacing        | flexible | Pick the overlap that fits the surrounding density                               |
| overflow label | strict   | The +N label must come from i18n (builtin.avatarGroup.more or a labels override) |
