A runtime that turns a plain **JSON config into live cascivo UI**. `CascadeView` takes a `ViewConfig` object and renders the real components — so AI agents (and no-code tooling) can emit data instead of writing TSX.

## Usage

```tsx
import { CascadeView } from '@cascivo/render'

const view = {
  type: 'Card',
  children: [
    { type: 'Heading', props: { level: 2 }, children: 'Welcome' },
    { type: 'Button', props: { variant: 'primary' }, children: 'Start' },
  ],
}

export function App() {
  return <CascadeView config={view} />
}
```

## Validation

`validateView` checks a config against the registry — unknown components, bad prop types, and out-of-range enum values are reported with exact paths, so generated views fail loudly rather than rendering garbage:

```ts
import { validateView } from '@cascivo/render'

const errors = validateView(view) // ValidationError[] — empty when valid
```

Pair it with the MCP server's bound-vocabulary grammar (`get_view_grammar`) for the full anti-hallucination loop: the model can only emit components and props that exist, and `validateView` is the enforcement backstop.
