---
name: cascivo:design-page
description: Generate a page layout from a natural language description using the cascivo view schema, MCP scaffold_view, and the cascivo generate CLI.
---

# cascivo:design-page

## When to use

The user describes a page in plain English (e.g. "a dashboard with a sidebar nav, a KPI card row, and a data table") and wants cascivo to generate the React code for it.

## Procedure

### 1. Read available components and examples

Before generating anything, read the registry and llms.txt at runtime:

- Read `https://cascivo.com/llms.txt` (or local `apps/docs/public/llms.txt`) for the component index and authoring rules.
- For any component you plan to use, read its `/llms/<name>.md` file for the exact props and example usage.

Do NOT rely on training-data knowledge of component APIs — always read from the live files.

### 2. Clarify the page description

Ask the user for any missing information needed to produce a reasonable first draft:

- Page name / route (e.g. `/dashboard`)
- Key data shown (drives which components to pick)
- Layout style (full-width, sidebar, centered, etc.)
- Any specific cascivo components they want to include

### 3. Call scaffold_view (MCP)

Use the `scaffold_view` MCP tool with the user's description:

```json
{
  "description": "<user's page description>",
  "components": ["<list of candidate component names>"]
}
```

This returns a JSON view config conforming to `view.v1.json`.

### 4. Validate with validate_view (MCP)

Call `validate_view` with the returned config. If validation fails:

- Fix the reported errors in the config.
- Re-validate. Repeat until the config is valid (max 5 attempts before reporting to the user).

### 5. Generate owned code

Run the cascivo CLI to turn the validated config into an owned React component:

```bash
npx cascivo generate view.json --out src/pages/<PageName>.tsx
```

Where `view.json` is the validated config written to a temp file (or the project root).

### 6. Verify the output compiles

```bash
npx tsc --noEmit
```

Fix any type errors before presenting the result to the user.

### 7. Present the result

Show the user:

- The generated file path
- A summary of which components were used
- How to import and use the page component
- Any manual wiring needed (e.g. passing real data to the data table)

## Flow & diagram pages (`@cascivo/flow`)

When the page is a **node/edge diagram** — a flowchart, DAG, pipeline, architecture
map, or mind-map — reach for the **`@cascivo/flow`** package instead of the view
schema. Its headline surface is a single declarative component over plain,
serializable data an agent can emit directly:

```tsx
import { Flow } from '@cascivo/flow'
import '@cascivo/flow/styles.css'
;<Flow
  background
  controls
  layout="layered"
  nodes={[
    { id: 'a', position: { x: 0, y: 0 }, data: { label: 'Client' } },
    { id: 'b', position: { x: 240, y: 0 }, data: { label: 'Gateway' } },
    { id: 'c', position: { x: 480, y: 0 }, data: { label: 'Service' } },
  ]}
  edges={[
    { id: 'ab', source: 'a', target: 'b', animated: true },
    { id: 'bc', source: 'b', target: 'c' },
  ]}
/>
```

- Use the **`scaffold_flow`** MCP tool to generate a starter `<Flow>` from a
  description (it returns serializable `nodes`/`edges` + ready-to-paste JSX).
- For an animated, captioned **walkthrough** of a flow, use `<FlowStory>` with a
  serializable `script` of `{ from, to, label }` steps (it animates each step in
  sequence with a fade-in caption and loops).
- Scope: the basic set (render, pan/zoom, drag, handles, edges, selection,
  connect, background/controls/minimap, animated edges) plus `FlowStory`. Heavy
  editor surfaces (undo/redo, resize/rotate, snaplines, sub-flows) are out of scope.
