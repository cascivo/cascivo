# Steps

**Category:** navigation  
**Description:** Visual progress indicator for multi-step flows with horizontal and vertical orientations

## When to use

- Checkout flows where the user moves through a fixed sequence of screens
- Onboarding wizards with a known number of steps
- Multi-step forms where showing overall progress reduces abandonment

## When NOT to use

- General section navigation — use Tabs instead
- Simple back/next controls without step labels — use Pagination instead
- More than 7 steps where the connector lines become unreadable on mobile

## Anti-patterns

### Steps imply a linear sequence and derive complete/pending state from position

**Bad:** `Using Steps as a replacement for Tabs for non-sequential navigation`  
**Good:** `<Tabs> for switching between independent views`  
**Why:** Steps imply a linear sequence and derive complete/pending state from position

## Related components

- **Pagination** (alternative): Pagination is for paged data sets, Steps is for guided task sequences
- **Tabs** (alternative): Tabs are for non-sequential section switching, not ordered task flows

## Accessibility rationale

Rendered as an ordered list (<ol>) with aria-label; the active item carries aria-current="step" to communicate progress to screen readers

## Props

| Name          | Type          | Required    | Default | Description                                                  |
| ------------- | ------------- | ----------- | ------- | ------------------------------------------------------------ | ----------------------------- |
| `steps`       | `Step[]`      | Yes         | —       | Array of step objects with label and optional explicit state |
| `activeStep`  | `number`      | No          | 0       | Index of the currently active step (0-based)                 |
| `orientation` | `'horizontal' | 'vertical'` | No      | 'horizontal'                                                 | Layout direction of the steps |
| `className`   | `string`      | No          | —       | —                                                            |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-content`
- `--cascivo-color-success`
- `--cascivo-color-success-content`
- `--cascivo-color-error`
- `--cascivo-color-error-content`
- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-muted`
- `--cascivo-border-default`
- `--cascivo-radius-full`
- `--cascivo-ease-out`

## Examples

### Horizontal (default)

Standard checkout or onboarding progress tracker

```jsx
<Steps
  steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }, { label: 'Confirm' }]}
  activeStep={1}
/>
```

### Vertical

Sidebar-style progress for tall forms

```jsx
<Steps
  orientation="vertical"
  steps={[{ label: 'Account info' }, { label: 'Profile details' }, { label: 'Preferences' }]}
  activeStep={0}
/>
```

### With explicit error state

Override derived state on a specific step

```jsx
<Steps
  steps={[{ label: 'Upload' }, { label: 'Validate', state: 'error' }, { label: 'Process' }]}
  activeStep={1}
/>
```

## Boundaries

| Area        | Level    | Note                                                                        |
| ----------- | -------- | --------------------------------------------------------------------------- |
| step state  | flexible | Each step can override derived pending/active/complete state via step.state |
| orientation | flexible | Horizontal for top progress bars, vertical for sidebar wizards              |
