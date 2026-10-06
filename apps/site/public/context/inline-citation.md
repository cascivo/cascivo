# InlineCitation

**Category:** display  
**Description:** A numbered citation marker inside AI-generated text that links to its source and previews it in a hover card

## When to use

- Attributing a claim in an AI answer to the source it came from, right where the claim is made

## When NOT to use

- Listing every source of an answer — use Sources (and number the citations to match)
- General footnotes in authored content — use a plain link or Prose

## Anti-patterns

### A reader matches "2" in the text to row 2 of the list; mismatched numbers point at the wrong source

**Bad:** `Numbering citations independently of the Sources list`  
**Good:** `Use the source’s position in Sources as `index``  
**Why:** A reader matches "2" in the text to row 2 of the list; mismatched numbers point at the wrong source

## Related components

- **Sources** (pairs-with): The list the numbers point at
- **HoverCard** (contains): The preview opens in a HoverCard on hover and keyboard focus

## Accessibility rationale

A real link whose accessible name starts with the visible number and includes the source title ("Source 1: Refund policy"), so it is meaningful without the hover card, which also opens on keyboard focus. Refused URLs keep the number and name but are not links

## Props

| Name     | Type                  | Required | Default | Description                                                                                                                            |
| -------- | --------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `index`  | `number`              | Yes      | —       | The visible citation number — the source’s position in the matching Sources list.                                                      |
| `source` | `AiSource`            | Yes      | —       | The cited source (`title`, `url`, optional `description`). Only absolute http(s) URLs become links.                                    |
| `labels` | `{ source?: string }` | No       | —       | Overrides for the component’s user-visible strings (i18n). `source` may contain `{index}`; the accessible name is "<source>: <title>". |

## Object types

### `AiSource`

One source an answer cites (shared with Sources).

| Field         | Type        | Required | Description                                                  |
| ------------- | ----------- | -------- | ------------------------------------------------------------ |
| `title`       | `string`    | Yes      | The source’s title.                                          |
| `url`         | `string`    | Yes      | Treated as untrusted: only absolute http(s) URLs are linked. |
| `description` | `ReactNode` | No       | An excerpt shown in the hover card.                          |

## Tokens

- `--cascivo-color-ai-subtle`
- `--cascivo-color-ai-sheen`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### In a sentence

```jsx
<p>
  Refunds are available for 30 days.
  <InlineCitation
    index={1}
    source={{ title: 'Refund policy', url: 'https://example.com/refunds' }}
  />
</p>
```

## Boundaries

| Area            | Level    | Note                                                        |
| --------------- | -------- | ----------------------------------------------------------- |
| preview content | flexible | description can be any node — an excerpt, a date, a favicon |
| URL handling    | strict   | Do not bypass sourceHref() — model output is untrusted      |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo InlineCitation component (display). A numbered citation marker inside AI-generated text that links to its source and previews it in a hover card

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

InlineCitation is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-ai-subtle, --cascivo-color-ai-sheen, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-radius-full, --cascivo-focus-ring

Accessibility: role "link", WCAG 2.2-AA, keyboard: Tab/Enter. Keep it AA.

Do not change (strict): URL handling — Do not bypass sourceHref() — model output is untrusted
Flexible: preview content.

Do not invent props, tokens, or global viewport media queries.
```
