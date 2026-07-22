# FlowStory

**Category:** display  
**Description:** A scripted, sequenced, looping flow animation — walks a graph step by step with fade-in captions.

## When to use

- Explaining how a flow works step by step, not just showing a static diagram
- Onboarding, architecture walkthroughs, and request/response narratives

## When NOT to use

- A static or freely-explorable graph — use <Flow>
- A single always-on animated edge — set animated on a FlowEdge

## Anti-patterns

### CLAUDE.md bans the useEffect-style loop; the signal+timer idiom is deterministic + testable.

**Bad:** `A requestAnimationFrame loop to sequence steps`  
**Good:** `A currentStep signal advanced by a timer in useSignalEffect`  
**Why:** CLAUDE.md bans the useEffect-style loop; the signal+timer idiom is deterministic + testable.

## Related components

- **Flow** (contains): Renders the graph the storyline animates.
- **FlowEdge** (pairs-with): Reuses the animated-edge keyframe per step.

## Accessibility rationale

The caption is an aria-live region announced each step; play/pause/prev/next make it keyboard-operable; travel motion is disabled under prefers-reduced-motion while captions are preserved.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `nodes` | `FlowNode[]` | Yes | — | The nodes to render. |
| `edges` | `FlowEdge[]` | Yes | — | The edges to render at each step. |
| `script` | `StoryStep[]` | Yes | — | Ordered steps: { from, to, label? } or { edge, reverse? }. |
| `loop` | `boolean` | No | true | When true, navigation wraps around from end to start. |
| `stepDuration` | `number` | No | 1500 | How long (ms) each step is shown during playback. |
| `stepGap` | `number` | No | 0 | Extra pause after each step before advancing (ms) — makes the story easier to follow. |
| `playing` | `boolean` | No | — | Whether the story is currently playing (controlled). |
| `currentStep` | `number` | No | — | The controlled current step index. |
| `onStepChange` | `(step: number) => void` | No | — | Called with the new step index when it changes. |
| `controls` | `boolean` | No | true | Whether to show the controls. |
| `autoPlay` | `boolean` | No | true | When true, starts playback automatically on mount. |
| `interactive` | `boolean` | No | false | A storyline is a view by default — set true to allow selecting/dragging/connecting. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-text-muted`

## Examples

### A request/response storyboard

A<->B-->C: animate A→B, B→A, A→B, B→C, looping — each step fades in its caption.

```jsx
() => (
  <FlowStory
    style={{ height: 340 }}
    nodes={[
      { id: 'A', position: { x: 0, y: 100 }, data: { label: 'Client' } },
      { id: 'B', position: { x: 240, y: 100 }, data: { label: 'Gateway' } },
      { id: 'C', position: { x: 480, y: 100 }, data: { label: 'Service' } },
    ]}
    edges={[
      { id: 'ab', source: 'A', target: 'B' },
      { id: 'bc', source: 'B', target: 'C' },
    ]}
    script={[
      { from: 'A', to: 'B', label: 'Request sent' },
      { from: 'B', to: 'A', label: 'Acknowledged' },
      { from: 'A', to: 'B', label: 'Payload streamed' },
      { from: 'B', to: 'C', label: 'Forwarded to Service' },
    ]}
    loop
  />
)
```

### A linear pipeline

Each stage animates and is captioned in turn.

```jsx
() => (
  <FlowStory
    style={{ height: 320 }}
    nodes={[
      { id: 'ingest', position: { x: 0, y: 100 }, data: { label: 'Ingest' } },
      { id: 'transform', position: { x: 240, y: 100 }, data: { label: 'Transform' } },
      { id: 'load', position: { x: 480, y: 100 }, data: { label: 'Load' } },
    ]}
    edges={[
      { id: 'it', source: 'ingest', target: 'transform' },
      { id: 'tl', source: 'transform', target: 'load' },
    ]}
    script={[
      { from: 'ingest', to: 'transform', label: 'Records ingested', description: 'Raw events read from the source' },
      { from: 'transform', to: 'load', label: 'Transformed', description: 'Cleaned and enriched' },
    ]}
  />
)
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| script | flexible | Serializable steps — { from, to } or { edge, reverse }. |
| playback | flexible | Controllable playing/currentStep; loop + per-step duration. |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo FlowStory component (display). A scripted, sequenced, looping flow animation — walks a graph step by step with fade-in captions.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

FlowStory is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-accent, --cascivo-color-text-muted

Accessibility: role "group", WCAG 2.1-AA, keyboard: Tab (focus controls)/Enter/Space (play/pause, prev, next). Keep it AA.
Flexible: script, playback.

Do not invent props, tokens, or global viewport media queries.
```
