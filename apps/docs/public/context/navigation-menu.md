# NavigationMenu

**Category:** navigation  
**Description:** Site navigation bar with links and dropdown flyout panels

## When to use

- Primary site navigation where some destinations are plain links and others reveal a flyout of grouped links
- A header nav bar that mixes direct links with rich dropdown panels

## When NOT to use

- Application commands and actions grouped under File/Edit/View — use Menubar
- A single trigger opening a list of actions — use a Menu/Dropdown
- Switching between peer content panels in place — use Tabs

## Anti-patterns

### navigation landmark implies moving between destinations, not invoking actions

**Bad:** `Putting action commands (Save, Delete) inside NavigationMenu flyouts`  
**Good:** `<Menubar> or <Menu> for commands; NavigationMenu is for destinations`  
**Why:** navigation landmark implies moving between destinations, not invoking actions

## Related components

- **Menubar** (alternative): Menubar invokes application commands; NavigationMenu navigates to destinations
- **Tabs** (alternative): Tabs swap in-page panels; NavigationMenu links to other destinations

## Accessibility rationale

Wrapped in a navigation landmark with a roving-tabindex row of links and disclosure triggers; triggers expose aria-expanded/aria-controls onto a flyout panel, and outside-pointer or Escape dismisses the open panel and restores trigger focus

## Props

| Name          | Type                   | Required   | Default | Description |
| ------------- | ---------------------- | ---------- | ------- | ----------- | --- | --- |
| `items`       | `NavigationMenuItem[]` | Yes        | —       | —           |
| `aria-label`  | `string`               | No         | —       | —           |
| `orientation` | `'horizontal'          | 'vertical' | 'both'` | No          | —   | —   |
| `className`   | `string`               | No         | —       | —           |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-border`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Examples

### Basic

```jsx
<NavigationMenu
  aria-label="Main"
  items={[
    { id: 'home', label: 'Home', href: '/' },
    { id: 'products', label: 'Products', content: <ul>…</ul> },
  ]}
/>
```

## Boundaries

| Area          | Level    | Note                                                                          |
| ------------- | -------- | ----------------------------------------------------------------------------- |
| orientation   | flexible | horizontal (default) or vertical roving navigation                            |
| panel content | flexible | content is arbitrary ReactNode; links without content render as plain anchors |
