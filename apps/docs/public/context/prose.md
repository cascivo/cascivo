# Prose

**Category:** display  
**Description:** Wrapper that styles raw descendant HTML — headings, lists, code, quotes, tables

## When to use

- Styling long-form authored content (articles, docs, CMS output)
- Applying readable typography to raw HTML you do not control (markdown pipelines)
- Getting consistent spacing for headings, lists, code, and quotes in one wrapper

## When NOT to use

- Single typographic elements in app UI — use Heading, Text, or List directly
- Interactive component layouts — Prose only styles flow content

## Anti-patterns

### Prose restyles all descendant HTML, which clobbers component styling and intent

**Bad:** `Wrapping app UI (buttons, forms) in <Prose> for spacing`  
**Good:** `Use layout primitives; reserve Prose for authored document content`  
**Why:** Prose restyles all descendant HTML, which clobbers component styling and intent

## Related components

- **Heading** (alternative): Use Heading/Text directly in app UI; Prose handles authored content

## Accessibility rationale

Adds no roles of its own — it styles descendant native elements, so the document semantics of the underlying HTML (headings, lists, code) are preserved for assistive tech

## Tokens

- `--cascivo-font-sans`
- `--cascivo-font-mono`
- `--cascivo-font-semibold`
- `--cascivo-leading-tight`
- `--cascivo-leading-relaxed`
- `--cascivo-tracking-tight`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-accent-hover`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-indicator`
- `--cascivo-radius-surface`

## Examples

### Authored content

```jsx
<Prose>
  <h2>Install</h2>
  <p>
    Run <code>npx cascivo init</code>.
  </p>
</Prose>
```

### Rendered markdown

The use case: HTML you do not control (CMS, markdown pipelines)

```jsx
<Prose dangerouslySetInnerHTML={{ __html: html }} />
```

## Boundaries

| Area        | Level    | Note                                                               |
| ----------- | -------- | ------------------------------------------------------------------ |
| source HTML | flexible | Accepts authored children or rendered markup                       |
| token names | strict   | All typography and surface styling resolves to --cascivo-\* tokens |
