import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'FlowStory',
  description:
    'A scripted, sequenced, looping flow animation — walks a graph step by step with fade-in captions.',
  category: 'display',
  states: ['playing', 'paused'],
  variants: [],
  sizes: [],
  props: [
    { name: 'nodes', type: 'FlowNode[]', required: true },
    { name: 'edges', type: 'FlowEdge[]', required: true },
    {
      name: 'script',
      type: 'StoryStep[]',
      required: true,
      description: 'Ordered steps: { from, to, label? } or { edge, reverse? }.',
    },
    { name: 'loop', type: 'boolean', required: false, default: 'true' },
    { name: 'stepDuration', type: 'number', required: false, default: '1500' },
    {
      name: 'stepGap',
      type: 'number',
      required: false,
      default: '0',
      description:
        'Extra pause after each step before advancing (ms) — makes the story easier to follow.',
    },
    { name: 'playing', type: 'boolean', required: false },
    { name: 'currentStep', type: 'number', required: false },
    { name: 'onStepChange', type: '(step: number) => void', required: false },
    { name: 'controls', type: 'boolean', required: false, default: 'true' },
    { name: 'autoPlay', type: 'boolean', required: false, default: 'true' },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: ['--cascivo-color-surface', '--cascivo-color-accent', '--cascivo-color-text-muted'],
  accessibility: {
    role: 'group',
    wcag: '2.1-AA',
    keyboard: ['Tab (focus controls)', 'Enter/Space (play/pause, prev, next)'],
    reducedMotion: true,
  },
  examples: [
    {
      title: 'A request/response storyboard',
      description:
        'A<->B-->C: animate A→B, B→A, A→B, B→C, looping — each step fades in its caption.',
      code: `() => (
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
)`,
    },
    {
      title: 'A linear pipeline',
      description: 'Each stage animates and is captioned in turn.',
      code: `() => (
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
)`,
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['flow', 'animation', 'storyline', 'walkthrough', 'sequence'],
  intent: {
    whenToUse: [
      'Explaining how a flow works step by step, not just showing a static diagram',
      'Onboarding, architecture walkthroughs, and request/response narratives',
    ],
    whenNotToUse: [
      'A static or freely-explorable graph — use <Flow>',
      'A single always-on animated edge — set animated on a FlowEdge',
    ],
    antiPatterns: [
      {
        bad: 'A requestAnimationFrame loop to sequence steps',
        good: 'A currentStep signal advanced by a timer in useSignalEffect',
        why: 'CLAUDE.md bans the useEffect-style loop; the signal+timer idiom is deterministic + testable.',
      },
    ],
    related: [
      {
        name: 'Flow',
        relationship: 'contains',
        reason: 'Renders the graph the storyline animates.',
      },
      {
        name: 'FlowEdge',
        relationship: 'pairs-with',
        reason: 'Reuses the animated-edge keyframe per step.',
      },
    ],
    a11yRationale:
      'The caption is an aria-live region announced each step; play/pause/prev/next make it keyboard-operable; travel motion is disabled under prefers-reduced-motion while captions are preserved.',
    flexibility: [
      {
        area: 'script',
        level: 'flexible',
        note: 'Serializable steps — { from, to } or { edge, reverse }.',
      },
      {
        area: 'playback',
        level: 'flexible',
        note: 'Controllable playing/currentStep; loop + per-step duration.',
      },
    ],
  },
}
