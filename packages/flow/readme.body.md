CSS-native, signal-driven flow & diagram library for cascivo — render node/edge graphs (flowcharts, DAGs, pipelines, mind-maps) with pan/zoom, draggable nodes, connection handles, animated edges, controls, a minimap, and scripted `FlowStory` storylines. HTML nodes (themed cascivo content for free), SVG edges, one CSS-transform viewport. Zero runtime dependencies beyond `@cascivo/core` + `@cascivo/i18n`.

## Install

```sh
pnpm add @cascivo/flow @preact/signals-react
```

`react`, `react-dom`, and `@preact/signals-react` are peer dependencies — install them in your app.

## Usage

The headline API is a single declarative `<Flow nodes edges />` that takes plain
serializable data (an agent can emit it as JSON):

```tsx
import { Flow } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // required — maps to the dist `flow.css`
import '@cascivo/themes/dark.css' // any cascivo theme drives the flow colors

const nodes = [
  { id: 'a', position: { x: 0, y: 0 }, data: { label: 'Client' } },
  { id: 'b', position: { x: 240, y: 0 }, data: { label: 'Gateway' } },
  { id: 'c', position: { x: 480, y: 0 }, data: { label: 'Service' } },
]
const edges = [
  { id: 'ab', source: 'a', target: 'b', animated: true },
  { id: 'bc', source: 'b', target: 'c' },
]

export function Pipeline() {
  return <Flow nodes={nodes} edges={edges} background controls />
}
```

> **Vite SSR (TanStack Start, Remix, vite-ssr, workerd)?** The flow CSS ships as side-effect
> imports a bare server loader can't resolve — mark `ssr: { noExternal: [/^@cascivo\//] }` (the
> pattern already covers `@cascivo/flow`) and import `@cascivo/flow/styles.css` once in your root
> entry. Full recipe:
> [USING-WITH-VITE-SSR.md](https://github.com/cascivo/cascivo/blob/main/docs/USING-WITH-VITE-SSR.md).

### Scripted storylines

`<FlowStory>` walks the viewer through a graph step by step with fade-in
captions — driven by a serializable `script`:

```tsx
import { FlowStory } from '@cascivo/flow'
;<FlowStory
  nodes={nodes}
  edges={edges}
  script={[
    { from: 'a', to: 'b', label: 'Request sent' },
    { from: 'b', to: 'a', label: 'Acknowledged' },
    { from: 'a', to: 'b', label: 'Payload streamed' },
    { from: 'b', to: 'c', label: 'Forwarded to Service' },
  ]}
  loop
/>
```

## Scope

Covers the basic set both [React Flow](https://reactflow.dev) and
[AntV X6](https://x6.antv.antgroup.com/) share — render, pan/zoom, drag,
handles, edges (bezier/straight/smoothstep), selection, interactive connect,
background, controls, minimap, animated edges — plus the `FlowStory` storyline.
It deliberately does **not** ship heavy editor surfaces (auto-layout engines,
undo/redo, clipboard, resize/rotate, snaplines, lasso/whiteboard, sub-flows,
multiplayer). A tiny optional dependency-free `gridLayout`/`layeredLayout`
helper covers the common "just arrange these for me" case.
