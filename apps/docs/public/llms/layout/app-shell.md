# AppShell

Full-page application shell with persisted collapsible sidebar.

## Install

```bash
npx cascade add layout/app-shell
```

## Category

`layout`

## States

- `expanded`
- `collapsed`

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

- `--cascade-space-3`
- `--cascade-space-4`
- `--cascade-space-6`
- `--cascade-duration-200`
- `--cascade-ease-out`
- `--cascade-color-border`
- `--cascade-color-surface`
- `--cascade-font-size-xs`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`
- `@cascade-ui/storage`

## Tags

layout, shell, sidebar, navigation
