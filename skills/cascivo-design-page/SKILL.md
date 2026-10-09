---
name: cascivo-design-page
description: Generate a page layout from a natural language description using the cascivo view schema, MCP scaffold_view, and the cascivo generate CLI.
---

# cascivo-design-page

## When to use

The user describes a page in plain English (e.g. "a dashboard with a sidebar nav, a KPI card row, and a data table") and wants cascivo to generate the React code for it.

## Procedure

### Whole new app? Use a blueprint instead

This skill designs one page. If the user wants a new app (several pages in a shell), call
`list_blocks`, then `compose_app` with one page per screen, each naming the block that fits. That
writes the shell, routes, nav and every block's source in one call. Use this skill afterwards
for any page no block covers.

### 0. Check the marketplace for a matching template first

Before scaffolding from scratch, see if a published **template** already covers the request — a template is a
whole-page composition (page + components + fixtures) the user installs and adapts, which is faster and higher-quality
than generating from zero.

- Call the `list_templates` MCP tool (optionally filtered by `category`/`framework`), or browse `/docs/marketplace`.
- If a template clearly matches (e.g. the user asks for a dashboard and a `dashboard` template exists), call
  `get_template` to inspect its components + demo, then install it with `add_template` (or
  `npx cascivo add <installSpec>`), and help the user adapt the owned source.
- If nothing matches, continue with the from-scratch scaffold below.

### 0.5. Dashboard / console pages: known component set

If the request is a dashboard, admin console, or analytics/usage page (sidebar or
topbar chrome, a project/workspace switcher, a grid of cards with row actions, KPI
tiles, usage sparklines or time-series charts, a data table) — this maps to an
already-known set of parts. Read
[`docs/RECIPE-DASHBOARD.md`](../../docs/RECIPE-DASHBOARD.md) (or
`https://github.com/cascivo/cascivo/blob/main/docs/RECIPE-DASHBOARD.md`) before
calling `scaffold_view`: it lists the exact component/registry-id for each need
(switcher, dropdown, command-menu, context-menu, card, stat, `@cascivo/charts`
sparkline/line/area/kpi, data-table) and the pre-built blocks that may already cover
the whole page (`block/dashboard-charts`, `block/stats-cards`, `dashboard-overview`,
`dashboard-table`, `block/console-app`, `block/sidebar-app`). Prefer naming these
components in the `scaffold_view` `components` candidate list over generating custom
SVG for a chart or a hand-rolled keydown handler for a menu — both already exist.

### 1. Read only the components you will use

Do NOT rely on training-data knowledge of component APIs, and do not load the whole catalog:
read exactly the components you plan to use.

- With the MCP server: call `get_view_grammar` with `components` set to your candidates. It
  returns the format rules plus each component's props and enum values. For any component
  outside the grammar, call `get_component` with `compact: true` (props, one example, a11y).
- Without it: read `/llms/<name>.md` for each candidate. Read `https://cascivo.com/llms.txt`
  only if you do not yet know which components exist.

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

Call `validate_view` with the returned config and `target: "tsx"`, because step 5 turns it
into source (without `target`, only components `<CascivoView>` renders at runtime pass). If
validation fails:

- Fix the reported errors in the config.
- Re-validate. Repeat until the config is valid (max 5 attempts before reporting to the user).

### 5. Generate owned code

Run the cascivo CLI to turn the validated config into an owned React component:

```bash
npx cascivo generate view.json --out src/pages/<PageName>.tsx
```

Where `view.json` is the validated config written to a temp file (or the project root).
Imports point at the copied components (`./src/components/ui/<name>`). In a project that uses
the prebuilt package instead, which is what `npm create cascivo` scaffolds, add
`--from @cascivo/react`.

### 6. Verify the output compiles

```bash
npx tsc --noEmit
```

Fix any type errors before presenting the result to the user.

### 6.4. Structure with layout primitives, not custom CSS

For page structure — shell content areas, toolbars, card grids, multi-column
sections — use the layout primitives from `@cascivo/react` before writing custom
grid/flex CSS or inline `style` layout:

- `Flex` — gap-based flex container (`direction`/`gap`/`align`/`justify`/`wrap`).
- `Grid` / `GridItem` — responsive object props: `cols={{ base: 1, md: 2, lg: 3 }}`,
  `span={{ base: 1, lg: 2 }}`.
- `AutoGrid` — responsive card grid, fills columns by width with no media queries.
- `Columns`, `Center`, `Spacer` — equal columns, centered max-width column, fixed gap.

The published `Stack` is a visual card-pile (overlap by `offset`) — for gap-based
layout reach for `Flex`. See `docs/cookbooks/layout-and-spacing.md`.

### 6.5. Styling discipline — the layer contract

Any CSS you write for the page must follow cascivo's layer contract (layer order
beats specificity, so unlayered CSS silently wins):

1. Every declaration goes inside an `@layer` block. Unlayered CSS beats all layers —
   never emit it.
2. Never invent layer names. Write only the app's own slot (`cascivo.example`, declared
   in the order statement) for page styles, and `@layer cascivo.override { … }` for
   one-off overrides — it beats everything cascivo ships.
3. Never nest layers deeper than the shipped `cascivo.blocks.<name>` pattern. For
   sub-elements (a badge in a card, a dot in a badge) use native CSS nesting inside one
   layer block, not new sublayers.
4. Third-party CSS: `@import url(…) layer(vendor);` with `vendor` declared before the
   cascivo layers. Never import vendor CSS from JavaScript.
5. Style with `--cascivo-*` tokens, not raw values.

Full recipe: `docs/CSS-LAYERS-PITFALL.md` and `docs/THIRD-PARTY-CSS.md`.

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
