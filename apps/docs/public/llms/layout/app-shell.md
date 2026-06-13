# AppShell

Full-page application shell with persisted collapsible sidebar. Includes a signal-driven top progress bar with determinate progress, error state, and dismissible error strip.

## Install

```bash
npx cascivo add layout/app-shell
```

## Category

`layout`

## States

- `expanded`
- `collapsed`
- `loading`
- `error`

## Props

| Prop         | Type         | Required | Default | Description                                                                    |
| ------------ | ------------ | -------- | ------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `header`     | `ReactNode`  | yes      | —       | Top header slot                                                                |
| `sideNav`    | `ReactNode`  | no       | —       | Side navigation slot                                                           |
| `aside`      | `ReactNode`  | no       | —       | Right aside slot                                                               |
| `children`   | `ReactNode`  | yes      | —       | Main content                                                                   |
| `persistKey` | `string      | false`   | no      | —                                                                              | localStorage key prefix. Pass false to disable persistence. |
| `state`      | `ShellState` | no       | —       | External shell state from createShellState(). Created internally when omitted. |

## Examples

### Basic

App shell with collapsible nav

```tsx
<AppShell header={<Header />} sideNav={<Nav />}>
  content
</AppShell>
```

## Design tokens

- `--cascivo-space-3`
- `--cascivo-space-4`
- `--cascivo-space-6`
- `--cascivo-duration-200`
- `--cascivo-ease-out`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-font-size-xs`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-destructive-subtle`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`
- `@cascivo/storage`

## Tags

layout, shell, sidebar, navigation
