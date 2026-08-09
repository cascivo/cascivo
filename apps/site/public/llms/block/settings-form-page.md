# SettingsFormPage

Settings page with profile form inside a two-column settings layout.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add block/settings-form-page
```

_Copy-paste only — `SettingsFormPage` is not exported from `@cascivo/react`. Run the command above to own the source, or compose it from the exported primitives (`Flex`, `Grid`, `Heading`, …)._

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

## Tags

block, settings, form, page

---

_Generated from registry v0.16.1 on 2026-08-09. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
