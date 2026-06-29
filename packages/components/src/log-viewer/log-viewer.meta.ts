import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'LogViewer',
  description: 'Virtualized monospace console for high-frequency log and stream output',
  category: 'display',
  states: ['following', 'paused', 'empty'],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'lines',
      description: 'The log lines to display (a signal or array).',
      type: 'ReadonlySignal<readonly LogLine[]> | readonly LogLine[]',
      required: true,
    },
    {
      name: 'rowHeight',
      description: 'Height of each row in pixels, used for virtualization.',
      type: 'number',
      required: false,
      default: '20',
    },
    {
      name: 'overscan',
      description: 'Number of extra rows rendered above and below the viewport.',
      type: 'number',
      required: false,
      default: '8',
    },
    {
      name: 'follow',
      description: 'Whether the view auto-scrolls to follow new lines (controlled).',
      type: 'boolean',
      required: false,
    },
    {
      name: 'onFollowChange',
      description: 'Called with the new follow state when it changes.',
      type: '(follow: boolean) => void',
      required: false,
    },
    {
      name: 'ansi',
      description: 'When true, parses ANSI color escape codes into colored spans.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'search',
      description: 'Query used to filter and highlight matching lines.',
      type: 'string',
      required: false,
    },
    {
      name: 'maxHeight',
      description: 'Maximum height of the scroll viewport (CSS length).',
      type: 'string',
      required: false,
      default: "'24rem'",
    },
    {
      name: 'labels',
      description: 'Overrides for the component’s user-visible strings (i18n).',
      type: 'LogViewerLabels',
      required: false,
    },
  ],
  tokens: [
    '--cascivo-font-mono',
    '--cascivo-color-text',
    '--cascivo-color-text-muted',
    '--cascivo-color-surface',
    '--cascivo-color-surface-raised',
    '--cascivo-color-border',
    '--cascivo-color-error',
    '--cascivo-color-warning',
    '--cascivo-color-success',
    '--cascivo-color-info',
    '--cascivo-color-accent',
    '--cascivo-target-min-coarse',
  ],
  accessibility: {
    role: 'log',
    wcag: '2.2-AA',
    keyboard: ['Tab', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'],
  },
  examples: [
    {
      title: 'Streaming build log',
      code: 'const logs = useStreamBuffer<LogLine>({ capacity: 1000 })\n// socket.onmessage = (e) => logs.append({ id: seq++, text: e.data })\n<LogViewer lines={logs.signal} />',
      description: 'Backed by createStreamBuffer; auto-follows the tail',
    },
    {
      title: 'Static log with levels',
      code: '<LogViewer lines={[{ id: 1, text: "Build started", level: "info" }, { id: 2, text: "Type error", level: "error" }]} />',
    },
    {
      title: 'ANSI colored output',
      code: '<LogViewer ansi lines={ansiLines} maxHeight="32rem" />',
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['log', 'stream', 'virtual', 'console', 'terminal', 'monospace'],
  intent: {
    whenToUse: [
      'Rendering continuous, high-volume log or stream output (build/deploy logs, server output)',
      'Showing thousands of lines without mounting a DOM node per line',
      'Auto-following live output while letting the user scroll back to inspect history',
    ],
    whenNotToUse: [
      'A short, static block of code or output — use a <pre> or Code block',
      'Tabular data with columns — use DataTable',
      'A rich interactive terminal with cursor addressing — out of scope (line-oriented only)',
    ],
    antiPatterns: [
      {
        bad: 'logsSignal.value = [...logsSignal.value.slice(1), line]',
        good: 'const logs = useStreamBuffer({ capacity: 1000 }); logs.append(line)',
        why: 'The slice pattern reallocates the whole array per line (O(n)) and renders per line; the stream buffer is O(1) and renders once per frame',
      },
    ],
    related: [
      {
        name: 'createStreamBuffer',
        relationship: 'pairs-with',
        reason: 'Provides the bounded, O(1) signal LogViewer renders',
      },
      {
        name: 'DataTable',
        relationship: 'alternative',
        reason: 'DataTable virtualizes tabular rows; LogViewer virtualizes monospace lines',
      },
    ],
    a11yRationale:
      'The scroll region is role="log" with aria-live="polite" so assistive tech announces new output without stealing focus; the container is keyboard-scrollable and a visually-hidden live status reports the line count; color is paired with level semantics, never the sole encoding',
    flexibility: [
      {
        area: 'data source',
        level: 'flexible',
        note: 'Accepts a live signal or a plain array',
      },
      {
        area: 'rowHeight',
        level: 'strict',
        note: 'Virtualization assumes a fixed row height; variable-height lines are not supported',
      },
      {
        area: 'coloring',
        level: 'flexible',
        note: 'Per-line level or ANSI SGR-16 escapes',
      },
    ],
  },
}
