# Alert

**Category:** display  
**Description:** Highlights a short, important message inline

## When to use

- Surfacing a persistent, contextual message inline within a view (warning, error, info, success)
- Communicating status that should stay visible until read or resolved
- Offering an inline recovery action tied to the message (action prop)

## When NOT to use

- Transient confirmation that should auto-dismiss — use Toast
- Blocking the user for a decision — use Modal or AlertDialog

## Anti-patterns

### Alerts persist by design; auto-hiding important inline context risks the user missing it

**Bad:** `Auto-dismissing an Alert on a timer to mimic a notification`  
**Good:** `<Toast> for ephemeral feedback`  
**Why:** Alerts persist by design; auto-hiding important inline context risks the user missing it

## Related components

- **Toast** (alternative): Toast auto-dismisses and floats; Alert persists inline in the layout
- **AlertDialog** (alternative): Use AlertDialog when the message must block and demand a choice

## Accessibility rationale

role="alert" makes assistive tech announce the message when it appears; the dismiss control is a real button so it is reachable and labeled, and color is paired with an icon/title so meaning is not conveyed by hue alone

## Props

| Name          | Type                                     | Required | Default   | Description |
| ------------- | ---------------------------------------- | -------- | --------- | ----------- | -------------- | --- | ------- | --- |
| `variant`     | `'default'                               | 'info'   | 'success' | 'warning'   | 'destructive'` | No  | default | —   |
| `title`       | `string`                                 | No       | —         | —           |
| `icon`        | `ReactNode`                              | No       | —         | —           |
| `dismissible` | `boolean`                                | No       | false     | —           |
| `onDismiss`   | `() => void`                             | No       | —         | —           |
| `action`      | `{ label: string; onClick: () => void }` | No       | —         | —           |

## Tokens

- `--cascivo-color-info`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-color-border`
- `--cascivo-radius-md`

## Examples

### Info

```jsx
<Alert variant="info" title="Heads up">
  Your trial ends soon.
</Alert>
```

### Dismissible

```jsx
<Alert variant="success" dismissible title="Saved">
  Changes saved.
</Alert>
```

### Actionable

```jsx
<Alert variant="warning" title="Update available" action={{ label: 'Update now', onClick: update }}>
  A new version is ready.
</Alert>
```

## Boundaries

| Area        | Level    | Note                                                                             |
| ----------- | -------- | -------------------------------------------------------------------------------- |
| variant     | flexible | Choose the severity variant that matches the message; default is neutral         |
| token names | strict   | Severity colors must resolve to --cascivo-color-info/success/warning/destructive |
