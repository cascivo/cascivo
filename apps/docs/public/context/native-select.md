# NativeSelect

**Category:** inputs  
**Description:** A styled native <select> that keeps platform form/keyboard behavior with a custom chevron and focus ring

## When to use

- A standard single-choice dropdown where native behavior and form integration matter most
- Mobile-first forms that should use the platform picker UI
- Pairing with a Field/Label inside a regular HTML form

## When NOT to use

- Multi-select, search/typeahead, or rich option rendering — use the custom Select/Combobox
- A handful of mutually exclusive options where radios read better

## Anti-patterns

### Native <option> cannot render icons or be searched; use a custom listbox for rich options

**Bad:** `<NativeSelect options={oneHundredOptionsWithIcons} />`  
**Good:** `<Combobox options={...} />`  
**Why:** Native <option> cannot render icons or be searched; use a custom listbox for rich options

## Related components

- **Select** (alternative): Custom-rendered listbox for richer options at the cost of native form/keyboard behavior
- **RadioCard** (alternative): Better for a small fixed set of mutually exclusive choices shown inline

## Accessibility rationale

It is a real <select>, so the browser provides the combobox role, keyboard interaction, and announcement. aria-invalid is set when invalid; the placeholder is a disabled hidden first option so it shows but is not selectable.

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-text-muted`
- `--cascivo-radius-field`
- `--cascivo-focus-ring`

## Boundaries

| Area | Level | Note |
|------|-------|------|
| options | flexible | Pass an options array or raw <option> children |
| value | flexible | Controlled (value/onChange) or uncontrolled (defaultValue) |
