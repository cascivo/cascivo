# Link

**Category:** navigation  
**Description:** Styled anchor for navigation, standalone or inline within prose

## When to use

- Navigating to another page, view, or resource via a real href
- Inline cross-references within prose (variant="inline")
- Linking to an external destination with a clear new-tab indicator (external)

## When NOT to use

- Triggering an action or mutation with no destination — use Button
- Submitting a form — use a submit Button

## Anti-patterns

### Links are for navigation; actions belong to buttons so keyboard and assistive tech behave correctly

**Bad:** `<Link onClick={doThing}> with no href`  
**Good:** `<Button onClick={doThing}>`  
**Why:** Links are for navigation; actions belong to buttons so keyboard and assistive tech behave correctly

## Related components

- **Button** (alternative): Button is for actions; Link is for navigation

## Accessibility rationale

Renders a native <a> so role, Enter activation, and focus come from the platform; external links add rel="noreferrer" and a visual indicator so users know a new tab will open

## Props

| Name       | Type          | Required  | Default | Description |
| ---------- | ------------- | --------- | ------- | ----------- | --- | --- |
| `variant`  | `'standalone' | 'inline'` | No      | standalone  | —   |
| `size`     | `'sm'         | 'md'      | 'lg'`   | No          | md  | —   |
| `external` | `boolean`     | No        | false   | —           |
| `href`     | `string`      | No        | —       | —           |

## Tokens

- `--cascade-color-accent`
- `--cascade-color-accent-hover`
- `--cascade-color-accent-active`
- `--cascade-radius-sm`
- `--cascade-focus-ring`

## Examples

### Standalone

```jsx
<Link href="/docs">View documentation</Link>
```

### Inline

Inline links inherit the surrounding font size and stay underlined.

```jsx
<p>
  Read the{' '}
  <Link variant="inline" href="/guide">
    guide
  </Link>{' '}
  first.
</p>
```

### External

Opens in a new tab with rel="noreferrer" and a visual indicator.

```jsx
<Link external href="https://example.com">
  Example
</Link>
```

## Boundaries

| Area        | Level    | Note                                                             |
| ----------- | -------- | ---------------------------------------------------------------- |
| variant     | flexible | standalone vs inline depending on whether the link sits in prose |
| token names | strict   | Accent colors and focus ring must resolve to --cascade-\* tokens |
