# ShellHeader

**Category:** navigation  
**Description:** Console application header: brand with prefix, dropdown nav menus, global icon actions, hamburger, skip-to-content

## When to use

- Building console/admin app chrome with brand, dropdown nav, and global icon actions
- Providing a hamburger that toggles a SideNav and a skip-to-content link
- Hosting global controls (notifications, switcher, user menu) in one top bar

## When NOT to use

- A simple marketing or app top bar — use Header
- In-page section headings — use Heading

## Anti-patterns

### ShellHeader carries console machinery (dropdowns, icon actions, hamburger) that is overkill for simple sites

**Bad:** `Reaching for ShellHeader on a basic landing page`  
**Good:** `<Header> for simple top bars`  
**Why:** ShellHeader carries console machinery (dropdowns, icon actions, hamburger) that is overkill for simple sites

## Related components

- **SideNav** (pairs-with): The hamburger toggles a SideNav in the app shell
- **HeaderPanel** (pairs-with): Icon actions open HeaderPanels (notifications, switcher)
- **Header** (alternative): Header is the simpler top bar for non-console apps

## Accessibility rationale

role="banner" landmarks the header; nav dropdowns expose aria-expanded, icon actions use aria-pressed, the hamburger reports aria-expanded, and a skip-to-content link lets keyboard users bypass the chrome

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `brand` | `ShellHeaderBrand | ReactNode` | No | — | Brand: { prefix?, name, href? } or free-form node |
| `nav` | `ShellHeaderNavItem[]` | No | — | Top nav: links or dropdown menus ({ label, items }) |
| `actions` | `ShellHeaderAction[]` | No | — | Right-aligned global icon actions with aria-pressed |
| `end` | `ReactNode` | No | — | Free-form trailing slot (user menu, theme switcher) |
| `onMenuClick` | `() => void` | No | — | Renders the hamburger button; call shell.toggleSideNav |
| `menuExpanded` | `boolean` | No | — | aria-expanded for the hamburger button |
| `skipToContentHref` | `string | false` | No | '#cascade-main' | Skip-link target; false disables the link |
| `labels` | `ShellHeaderLabels` | No | — | i18n overrides for built-in strings |

## Tokens

- `--cascivo-shell-header-block-size`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-accent`
- `--cascivo-radius-control`

## Examples

### Console header

Brand with prefix, dropdown nav, global icon action

```jsx
<ShellHeader
  brand={{ prefix: 'cascivo', name: 'Console', href: '/' }}
  nav={[
    { label: 'Dashboard', href: '/dash', active: true },
    { label: 'Manage', items: [{ label: 'Users', href: '/users' }] },
  ]}
  actions={[{ id: 'notifications', label: 'Notifications', icon: <Bell /> }]}
/>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| nav / actions / end slots | flexible | Brand, nav, actions, and end are composable and optional |
| token names | strict | Surfaces, sizing, and accent must resolve to --cascivo-* shell tokens |
