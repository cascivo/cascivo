# Search

**Category:** inputs  
**Description:** Search input with debounced search callback and clear button

## When to use

- A query field that filters or searches content, with a built-in clear button and debounced onSearch
- Free-text search where results update as the user types (debounced) or on Enter

## When NOT to use

- General non-search text entry — use Input
- Search that presents an inline list of suggestions/results to pick from — use Combobox
- A bounded numeric value — use NumberInput

## Anti-patterns

### Search provides type="search" semantics, a magnifier affordance, a clear button, and built-in debouncing so you avoid firing a query on every keystroke

**Bad:** `<Input placeholder="Search" onChange={(e) => runQuery(e.target.value)} />`  
**Good:** `<Search onSearch={(q) => runQuery(q)} debounceMs={300} />`  
**Why:** Search provides type="search" semantics, a magnifier affordance, a clear button, and built-in debouncing so you avoid firing a query on every keystroke

## Related components

- **Input** (alternative): Use for general text entry that is not a search query
- **Combobox** (alternative): Use when the query should surface a selectable list of suggestions

## Accessibility rationale

Renders a native <input type="search"> associated with a <label> (defaulting from the i18n catalog) so the field is announced as a searchbox; the clear control is a labeled <button> and moves focus back to the input after clearing.

## Props

| Name           | Type                      | Required | Default      | Description |
| -------------- | ------------------------- | -------- | ------------ | ----------- | --- | --- |
| `value`        | `string`                  | No       | —            | —           |
| `defaultValue` | `string`                  | No       | ''           | —           |
| `onChange`     | `(value: string) => void` | No       | —            | —           |
| `onSearch`     | `(value: string) => void` | No       | —            | —           |
| `debounceMs`   | `number`                  | No       | 300          | —           |
| `placeholder`  | `string`                  | No       | Search       | —           |
| `size`         | `'sm'                     | 'md'     | 'lg'`        | No          | md  | —   |
| `label`        | `string`                  | No       | Search       | —           |
| `disabled`     | `boolean`                 | No       | false        | —           |
| `clearLabel`   | `string`                  | No       | Clear search | —           |
| `id`           | `string`                  | No       | —            | —           |
| `className`    | `string`                  | No       | —            | —           |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<Search onSearch={(q) => runQuery(q)} />
```

### Controlled

```jsx
<Search value={query} onChange={setQuery} onSearch={runQuery} debounceMs={500} />
```

### Large

```jsx
<Search size="lg" placeholder="Search products…" />
```

## Boundaries

| Area              | Level    | Note                                                                         |
| ----------------- | -------- | ---------------------------------------------------------------------------- |
| token names       | strict   | Field and control styling must resolve to the listed --cascivo-\* tokens     |
| debounce and copy | flexible | debounceMs and the placeholder/label/clear copy are free to suit the context |
