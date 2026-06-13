# Status

**Category:** display  
**Description:** Colored dot with a label communicating the state of a system or entity

## When to use

- Communicating the live state of a system or entity (operational, deploying, down)
- Pairing a colored dot with a text label for an at-a-glance state
- Drawing attention to an active/changing state with an optional pulse

## When NOT to use

- A static category or count label — use Badge
- An identity thumbnail with presence — use Avatar with its status prop

## Anti-patterns

### A bare colored dot conveys nothing to color-blind or screen-reader users; always pair with text

**Bad:** `<Status status="success" /> with no label`  
**Good:** `<Status status="success">Operational</Status>`  
**Why:** A bare colored dot conveys nothing to color-blind or screen-reader users; always pair with text

## Related components

- **Badge** (alternative): Badge labels categories; Status reflects live state with a dot
- **Avatar** (alternative): Avatar embeds presence status on an identity

## Accessibility rationale

Meaning is carried by the text label, never by the dot color alone; the pulse animation is gated behind prefers-reduced-motion: no-preference so it never animates for users who opt out

## Props

| Name     | Type       | Required  | Default | Description                                                         |
| -------- | ---------- | --------- | ------- | ------------------------------------------------------------------- | ---------- | --- | ------- | --- |
| `status` | `'success' | 'warning' | 'error' | 'info'                                                              | 'neutral'` | No  | neutral | —   |
| `pulse`  | `boolean`  | No        | false   | Pulses the dot — gated behind prefers-reduced-motion: no-preference |

## Tokens

- `--cascade-color-success`
- `--cascade-color-warning`
- `--cascade-color-error`
- `--cascade-color-info`
- `--cascade-color-text-muted`
- `--cascade-color-text`
- `--cascade-radius-full`

## Examples

### Default

```jsx
<Status>Unknown</Status>
```

### Success

```jsx
<Status status="success">Operational</Status>
```

### Pulsing

The pulse animation respects prefers-reduced-motion

```jsx
<Status status="info" pulse>
  Deploying
</Status>
```

## Boundaries

| Area        | Level    | Note                                                                    |
| ----------- | -------- | ----------------------------------------------------------------------- |
| pulse       | flexible | Enable pulse only for actively-changing states                          |
| token names | strict   | State colors must resolve to --cascade-color-success/warning/error/info |
