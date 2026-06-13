# Tabs

Switch between related panels of content

## Install

```bash
npx cascade add tabs
```

## Category

`navigation`

## States

- `active`
- `inactive`

## Props

| Prop            | Type                      | Required | Default | Description |
| --------------- | ------------------------- | -------- | ------- | ----------- |
| `defaultValue`  | `string`                  | no       | —       | —           |
| `value`         | `string`                  | no       | —       | —           |
| `onValueChange` | `(value: string) => void` | no       | —       | —           |

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
