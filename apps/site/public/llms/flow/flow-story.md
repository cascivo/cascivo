# FlowStory

A scripted, sequenced, looping flow animation — walks a graph step by step with fade-in captions.

## Install

Ships in the `@cascivo/flow` package — install it (no copy-paste):

```sh
pnpm add @cascivo/flow
```

```tsx
import { FlowStory } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // required stylesheet
```

## Category

`display`

## States

- `playing`
- `paused`

## Props

| Prop           | Type                     | Required | Default | Description                                                                           |
| -------------- | ------------------------ | -------- | ------- | ------------------------------------------------------------------------------------- |
| `nodes`        | `FlowNode[]`             | yes      | —       | The nodes to render.                                                                  |
| `edges`        | `FlowEdge[]`             | yes      | —       | The edges to render at each step.                                                     |
| `script`       | `StoryStep[]`            | yes      | —       | Ordered steps: { from, to, label? } or { edge, reverse? }.                            |
| `loop`         | `boolean`                | no       | `true`  | When true, navigation wraps around from end to start.                                 |
| `stepDuration` | `number`                 | no       | `1500`  | How long (ms) each step is shown during playback.                                     |
| `stepGap`      | `number`                 | no       | `0`     | Extra pause after each step before advancing (ms) — makes the story easier to follow. |
| `playing`      | `boolean`                | no       | —       | Whether the story is currently playing (controlled).                                  |
| `currentStep`  | `number`                 | no       | —       | The controlled current step index.                                                    |
| `onStepChange` | `(step: number) => void` | no       | —       | Called with the new step index when it changes.                                       |
| `controls`     | `boolean`                | no       | `true`  | Whether to show the controls.                                                         |
| `autoPlay`     | `boolean`                | no       | `true`  | When true, starts playback automatically on mount.                                    |
| `interactive`  | `boolean`                | no       | `false` | A storyline is a view by default — set true to allow selecting/dragging/connecting.   |
| `className`    | `string`                 | no       | —       | Additional CSS class names merged onto the root element.                              |

## Examples

### A request/response storyboard

A<->B-->C: animate A→B, B→A, A→B, B→C, looping — each step fades in its caption.

```tsx
;() => (
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

```tsx
;() => (
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
      {
        from: 'ingest',
        to: 'transform',
        label: 'Records ingested',
        description: 'Raw events read from the source',
      },
      { from: 'transform', to: 'load', label: 'Transformed', description: 'Cleaned and enriched' },
    ]}
  />
)
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-text-muted`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `group`
- **Keyboard:** Tab (focus controls), Enter/Space (play/pause, prev, next)

## Dependencies

- `@cascivo/core`

## Tags

flow, animation, storyline, walkthrough, sequence

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
