# Tabs

Switch between related panels of content

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add tabs
```

Or use it from the prebuilt package without copying:

```tsx
import { Tabs } from '@cascivo/react'
```

## Category

`navigation`

## States

- `active`
- `inactive`

## Props

| Prop            | Type                      | Required | Default | Description                                |
| --------------- | ------------------------- | -------- | ------- | ------------------------------------------ |
| `defaultValue`  | `string`                  | no       | —       | The initial value when uncontrolled.       |
| `value`         | `string`                  | no       | —       | The controlled value.                      |
| `onValueChange` | `(value: string) => void` | no       | —       | Called with the new value when it changes. |

## Examples

### Basic

```tsx
<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
  </TabsList>
  <TabsContent value="account">…</TabsContent>
</Tabs>
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-border`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `tablist`
- **Keyboard:** ArrowLeft, ArrowRight, Home, End

## Dependencies

- `@cascivo/core`

## Tags

navigation, tabs, sections

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
