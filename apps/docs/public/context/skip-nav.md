# SkipNav

**Category:** navigation  
**Description:** Skip link that jumps keyboard users past the navigation to the main content

## When to use

- Letting keyboard users jump past repeated navigation to the main content
- Meeting WCAG bypass-blocks by providing a skip link as the first focusable element
- Targeting a custom main-content anchor (targetId / matching SkipNavTarget id)

## When NOT to use

- General in-page navigation — use anchor links or a table of contents
- Visible persistent navigation — this link is hidden until focused

## Anti-patterns

### A skip link only works if the user reaches it before tabbing through the nav it bypasses

**Bad:** `Placing SkipNavLink after the navigation in the DOM`  
**Good:** `Make SkipNavLink the first focusable element on the page`  
**Why:** A skip link only works if the user reaches it before tabbing through the nav it bypasses

## Related components

- **ShellHeader** (alternative): ShellHeader has a built-in skip-to-content link for console shells

## Accessibility rationale

Renders an anchor that is visually hidden until focused, then becomes visible so sighted keyboard users see where focus is; activating it moves focus to the matching target past the navigation

## Props

| Name       | Type                 | Required | Default             | Description                                                 |
| ---------- | -------------------- | -------- | ------------------- | ----------------------------------------------------------- |
| `targetId` | `string`             | No       | cascade-skip-target | SkipNavLink: id of the SkipNavTarget to jump to             |
| `labels`   | `{ label?: string }` | No       | —                   | SkipNavLink: overrides the built-in i18n label per instance |
| `id`       | `string`             | No       | cascade-skip-target | SkipNavTarget: anchor id — must match the link targetId     |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-radius-control`
- `--cascivo-focus-ring`

## Examples

### Default pair

SkipNavLink must be the first focusable element on the page

```jsx
<>
  <SkipNavLink />
  <nav>…</nav>
  <SkipNavTarget />
  <main>…</main>
</>
```

### Custom target

```jsx
<>
  <SkipNavLink targetId="main-content" />
  <SkipNavTarget id="main-content" />
</>
```

## Boundaries

| Area                      | Level    | Note                                                        |
| ------------------------- | -------- | ----------------------------------------------------------- |
| target id                 | flexible | targetId/id may be customized as long as they match         |
| first-focusable placement | strict   | SkipNavLink must be the first focusable element to function |
