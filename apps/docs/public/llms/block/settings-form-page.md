# SettingsFormPage

Settings page with profile form inside a two-column settings layout.

## Install

```bash
npx cascade add block/settings-form-page
```

## Category

`display`

## Props

| Prop     | Type                               | Required | Default | Description                             |
| -------- | ---------------------------------- | -------- | ------- | --------------------------------------- |
| `onSave` | `(values: SettingsValues) => void` | no       | —       | Called with valid form values on submit |

## Examples

### Default

Settings form page

```tsx
<SettingsFormPage />
```

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/react`
- `layout/settings-layout`

## Tags

block, settings, form, page
