# SegmentedControl

**Category:** inputs  
**Description:** Mutually exclusive toggle group

## When to use

- A compact inline single choice among a few mutually exclusive options (2–5) such as view modes or time ranges
- Switching between alternatives where all options should stay visible in a tight horizontal space

## When NOT to use

- Switching between full panels of page content — use Tabs
- A single binary on/off state — use Toggle
- More options than comfortably fit inline, or options needing descriptions — use Select or RadioCard

## Anti-patterns

### A pair of buttons does not convey exclusive selection; SegmentedControl uses radio semantics with aria-checked and arrow-key navigation so the single-choice state is announced

**Bad:** `Two <Button> elements toggling which is "active" via app state`  
**Good:** `<SegmentedControl options={[{label:"Day",value:"day"},{label:"Week",value:"week"}]} value={range} onValueChange={setRange} />`  
**Why:** A pair of buttons does not convey exclusive selection; SegmentedControl uses radio semantics with aria-checked and arrow-key navigation so the single-choice state is announced

## Related components

- **Toggle** (alternative): Use for a single binary on/off state, not a multi-option choice
- **Radio** (alternative): Use for a vertical or longer single-choice list with plain labels
- **Select** (alternative): Use when there are too many options to show inline

## Accessibility rationale

Wraps role="radio" buttons in a role="group" with aria-checked marking the selected segment, and ArrowLeft/ArrowRight move selection across enabled segments (skipping disabled ones) so keyboard users get standard single-choice navigation.

## Props

| Name            | Type                       | Required | Default | Description |
| --------------- | -------------------------- | -------- | ------- | ----------- | --- | --- |
| `options`       | `SegmentedControlOption[]` | Yes      | —       | —           |
| `value`         | `string`                   | Yes      | —       | —           |
| `onValueChange` | `(v: string) => void`      | Yes      | —       | —           |
| `size`          | `'sm'                      | 'md'     | 'lg'`   | No          | md  | —   |
| `disabled`      | `boolean`                  | No       | false   | —           |

## Tokens

- `--cascade-color-bg-subtle`
- `--cascade-color-border`
- `--cascade-color-surface`
- `--cascade-color-text`
- `--cascade-radius-md`
- `--cascade-radius-sm`
- `--cascade-shadow-sm`

## Examples

### Basic

```jsx
<SegmentedControl
  options={[
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ]}
  value="day"
  onValueChange={() => {}}
/>
```

## Boundaries

| Area          | Level    | Note                                                                    |
| ------------- | -------- | ----------------------------------------------------------------------- |
| token names   | strict   | Segment styling must resolve to the listed --cascade-\* tokens          |
| option labels | flexible | option label and value are free, and individual options may be disabled |
