# CopyButton

**Category:** inputs  
**Description:** Icon button that copies a value to the clipboard with copied feedback

## When to use

- Letting users copy a short value to the clipboard — install commands, API keys, tokens, share links
- Inline next to code snippets or read-only fields where copying is the primary affordance

## When NOT to use

- Triggering a general action — use Button
- Copying content the user can already select and edit freely where a copy affordance adds nothing

## Anti-patterns

### Its click handler is fixed to navigator.clipboard.writeText(value) plus copied feedback — overloading it breaks user expectation

**Bad:** `Wiring CopyButton to perform a non-clipboard action via onClick`  
**Good:** `Use Button for arbitrary actions; CopyButton always writes value to the clipboard`  
**Why:** Its click handler is fixed to navigator.clipboard.writeText(value) plus copied feedback — overloading it breaks user expectation

## Related components

- **Button** (alternative): Use for actions other than copying to clipboard
- **Input** (pairs-with): Often placed alongside a read-only field whose value it copies

## Accessibility rationale

Renders a native <button> so Enter/Space, focus, and role come from the platform; the aria-label swaps between copy and copied labels to announce the state change to screen readers since the icon swap alone is silent, and the SVG icons are aria-hidden

## Props

| Name     | Type                                 | Required | Default | Description                                     |
| -------- | ------------------------------------ | -------- | ------- | ----------------------------------------------- | --- |
| `value`  | `string`                             | Yes      | —       | The text written to the clipboard on click      |
| `size`   | `'sm'                                | 'md'`    | No      | md                                              | —   |
| `labels` | `{ copy?: string; copied?: string }` | No       | —       | Overrides the built-in i18n labels per instance |

## Tokens

- `--cascade-color-surface`
- `--cascade-color-text-subtle`
- `--cascade-color-text`
- `--cascade-color-border`
- `--cascade-color-bg-subtle`
- `--cascade-color-success`
- `--cascade-radius-control`
- `--cascade-focus-ring`
- `--cascade-control-height-sm`
- `--cascade-control-height-md`

## Examples

### Default

```jsx
<CopyButton value="npx cascade add button" />
```

### Small

```jsx
<CopyButton value="pnpm install" size="sm" />
```

### Custom labels

Override the built-in copy/copied strings per instance

```jsx
<CopyButton value="token" labels={{ copy: 'Copy token', copied: 'Token copied' }} />
```

## Boundaries

| Area        | Level    | Note                                                                                              |
| ----------- | -------- | ------------------------------------------------------------------------------------------------- |
| labels      | flexible | copy/copied strings overridable via labels; default from i18n catalog                             |
| token names | strict   | Styling resolves to semantic --cascade-color-\* tokens; copied state uses --cascade-color-success |
