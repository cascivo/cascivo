# Toc

**Category:** navigation  
**Description:** Table of contents with scroll-spy highlighting of the active section

## When to use

- Long-form pages (docs, articles) that benefit from in-page jump links
- Highlighting which section is currently in view as the reader scrolls

## When NOT to use

- Top-level site navigation between pages — use NavigationMenu or SideNav
- Showing hierarchy depth of the current page — use Breadcrumb

## Anti-patterns

### Toc links to sections within the current document, not to other pages

**Bad:** `Using Toc as the primary site navigation between routes`  
**Good:** `<NavigationMenu> / <SideNav> for cross-page navigation`  
**Why:** Toc links to sections within the current document, not to other pages

## Related components

- **SideNav** (alternative): SideNav navigates between pages; Toc navigates within one page
- **Breadcrumb** (alternative): Breadcrumb shows ancestor hierarchy; Toc shows in-page sections

## Accessibility rationale

Rendered as a <nav> landmark with a label; entries are real anchor links and the active one is marked aria-current="location" so assistive tech announces the current section

## Props

| Name             | Type                                              | Required | Default | Description                                                      |
| ---------------- | ------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------- |
| `items`          | `{ id: string; label: string; level?: number }[]` | Yes      | —       | —                                                                |
| `activeId`       | `string`                                          | No       | —       | Controlled active item id; disables built-in scroll-spy when set |
| `onActiveChange` | `(id: string) => void`                            | No       | —       | —                                                                |
| `labels`         | `{ nav?: string }`                                | No       | —       | —                                                                |
| `className`      | `string`                                          | No       | —       | —                                                                |

## Tokens

- `--cascivo-font-sans`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-accent`
- `--cascivo-focus-ring`
- `--cascivo-target-min-coarse`

## Examples

### Basic

```jsx
<Toc
  items={[
    { id: 'intro', label: 'Introduction' },
    { id: 'usage', label: 'Usage' },
    { id: 'api', label: 'API', level: 3 },
  ]}
/>
```

### Controlled active item

Pass activeId to drive the highlight yourself; scroll-spy is disabled.

```jsx
<Toc
  activeId="usage"
  items={[
    { id: 'intro', label: 'Introduction' },
    { id: 'usage', label: 'Usage' },
  ]}
/>
```

## Boundaries

| Area        | Level    | Note                                                                     |
| ----------- | -------- | ------------------------------------------------------------------------ |
| activeId    | flexible | Control the highlight externally, or omit it for built-in scroll-spy     |
| token names | strict   | Colors, focus ring, and touch target must resolve to --cascivo-\* tokens |
