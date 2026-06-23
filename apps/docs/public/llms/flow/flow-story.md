# FlowStory

A scripted, sequenced, looping flow animation — walks a graph step by step with fade-in captions.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add flow/flow-story
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`display`

## States

- `playing`
- `paused`

## Props

| Prop           | Type                     | Required | Default | Description                                                |
| -------------- | ------------------------ | -------- | ------- | ---------------------------------------------------------- |
| `nodes`        | `FlowNode[]`             | yes      | —       | —                                                          |
| `edges`        | `FlowEdge[]`             | yes      | —       | —                                                          |
| `script`       | `StoryStep[]`            | yes      | —       | Ordered steps: { from, to, label? } or { edge, reverse? }. |
| `loop`         | `boolean`                | no       | `true`  | —                                                          |
| `stepDuration` | `number`                 | no       | `1500`  | —                                                          |
| `playing`      | `boolean`                | no       | —       | —                                                          |
| `currentStep`  | `number`                 | no       | —       | —                                                          |
| `onStepChange` | `(step: number) => void` | no       | —       | —                                                          |
| `controls`     | `boolean`                | no       | `true`  | —                                                          |
| `autoPlay`     | `boolean`                | no       | `true`  | —                                                          |
| `className`    | `string`                 | no       | —       | —                                                          |

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
