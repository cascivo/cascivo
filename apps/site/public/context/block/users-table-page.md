# UsersTablePage

**Category:** display  
**Description:** Full users management page with table, search, and invite action.

## When to use

- A full user-management page with table, search, and invite action
- Admin list views over a collection of records

## When NOT to use

- A read-only data display — use a plain Table
- A dashboard overview — use DashboardCharts

## Related components

- **PageHeader** (contains): Uses a page header with title and invite action

## Accessibility rationale

Table uses proper row/column semantics and the search field is labeled.

## Props

| Name       | Type         | Required | Default | Description           |
| ---------- | ------------ | -------- | ------- | --------------------- |
| `users`    | `User[]`     | No       | —       | User data             |
| `onInvite` | `() => void` | No       | —       | Invite button handler |

## Examples

### Default

Demo users table

```jsx
<UsersTablePage />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo UsersTablePage component (display). Full users management page with table, search, and invite action.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

UsersTablePage is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
