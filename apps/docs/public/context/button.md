# Button

**Category:** inputs  
**Description:** Triggers an action or event

## When to use

- Triggering an action or navigation the user initiates by click/press
- Submitting a form or confirming a decision

## When NOT to use

- Navigation between pages where a real link is semantically correct — use an anchor
- Toggling a binary setting — use Toggle; persistent selection — use Checkbox/Radio

## Anti-patterns

### Buttons are for actions, links for navigation — assistive tech and the browser treat them differently

**Bad:** `<Button onClick={() => navigate("/x")}>Home</Button>`  
**Good:** `<a href="/x">Home</a>`  
**Why:** Buttons are for actions, links for navigation — assistive tech and the browser treat them differently

## Related components

- **Toggle** (alternative): Use for binary on/off state, not one-shot actions
- **Dropdown** (pairs-with): A button often triggers a menu

## Accessibility rationale

Renders a native <button> so Enter/Space activation, focus, and role come from the platform; loading state uses aria-busy rather than removing the element so focus is preserved

## Props

| Name       | Type                                         | Required    | Default | Description    |
| ---------- | -------------------------------------------- | ----------- | ------- | -------------- | --- | ------- | --- |
| `variant`  | `'primary'                                   | 'secondary' | 'ghost' | 'destructive'` | No  | primary | —   |
| `size`     | `'sm'                                        | 'md'        | 'lg'`   | No             | md  | —       |
| `loading`  | `boolean`                                    | No          | false   | —              |
| `disabled` | `boolean`                                    | No          | false   | —              |
| `onClick`  | `React.MouseEventHandler<HTMLButtonElement>` | No          | —       | —              |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-hover`
- `--cascivo-color-accent-active`
- `--cascivo-color-text-on-accent`
- `--cascivo-color-destructive`
- `--cascivo-radius-button`
- `--cascivo-focus-ring`
- `--cascivo-disabled-opacity`

## Examples

### Primary

```jsx
<Button>Click me</Button>
```

### Loading

```jsx
<Button loading>Saving…</Button>
```

### Destructive

```jsx
<Button variant="destructive">Delete</Button>
```

## Boundaries

| Area        | Level    | Note                                                               |
| ----------- | -------- | ------------------------------------------------------------------ |
| token names | strict   | Visual props must resolve to --cascivo-button-\* / semantic tokens |
| label copy  | flexible | Free, within tone guidance                                         |
