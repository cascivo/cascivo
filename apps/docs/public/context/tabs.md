# Tabs

**Category:** navigation  
**Description:** Switch between related panels of content

## When to use

- Switching between peer panels of related content in the same context
- Showing one section at a time when all sections are equally important

## When NOT to use

- Stacked sequential content the user reads top to bottom — use Accordion
- Changing a setting or view parameter — use a SegmentedControl
- Navigating between pages — use links

## Anti-patterns

### Tabs imply switching content panels; toggling a parameter is a control, not navigation

**Bad:** `Using Tabs to toggle a single display option (e.g. grid/list view)`  
**Good:** `<SegmentedControl> for view/setting toggles`  
**Why:** Tabs imply switching content panels; toggling a parameter is a control, not navigation

## Related components

- **Accordion** (alternative): Accordion stacks sequential sections; Tabs switch between peers
- **SegmentedControl** (alternative): SegmentedControl changes a setting/parameter rather than swapping panels

## Accessibility rationale

Implements the WAI-ARIA tabs pattern: tablist/tab/tabpanel roles with arrow-key navigation and Home/End, so the active tab and its panel are correctly associated for assistive tech

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `defaultValue` | `string` | No | — | — |
| `value` | `string` | No | — | — |
| `onValueChange` | `(value: string) => void` | No | — | — |

## Tokens

- `--cascade-color-accent`
- `--cascade-color-text`
- `--cascade-color-text-subtle`
- `--cascade-color-border`
- `--cascade-focus-ring`

## Examples

### Basic

```jsx
<Tabs defaultValue="account"><TabsList><TabsTrigger value="account">Account</TabsTrigger></TabsList><TabsContent value="account">…</TabsContent></Tabs>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| controlled vs uncontrolled | flexible | Use value or defaultValue depending on control needs |
| token names | strict | Accent, borders, and focus ring must resolve to --cascade-* tokens |
