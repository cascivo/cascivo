import { signal, useSignals } from '@cascade-ui/core'
import { CascadeView } from '@cascade-ui/render'
import type { ViewConfig } from '@cascade-ui/render'

const EXAMPLE_CONFIG: ViewConfig = {
  version: 1,
  view: {
    regions: {
      status: [
        { component: 'Badge', props: { variant: 'success' }, children: 'Published' },
        { component: 'Badge', props: { variant: 'warning' }, children: 'Draft' },
        { component: 'Badge', props: { variant: 'destructive' }, children: 'Archived' },
      ],
      actions: [
        { component: 'Button', props: { variant: 'primary' }, children: 'Save changes' },
        { component: 'Button', props: { variant: 'secondary' }, children: 'Cancel' },
      ],
      content: [
        {
          component: 'Alert',
          props: { variant: 'info', title: 'AI-generated layout' },
          children: 'This UI was described in JSON and rendered live by CascadeView.',
        },
        { component: 'Separator' },
        {
          component: 'Card',
          children: [
            { component: 'Input', props: { label: 'Name', placeholder: 'Your name' } },
            { component: 'Spinner' },
          ],
        },
      ],
    },
  },
}

const EXAMPLE_JSON = JSON.stringify(EXAMPLE_CONFIG, null, 2)

const configSignal = signal<ViewConfig | null>(EXAMPLE_CONFIG)
const parseErrorSignal = signal<string | null>(null)

export function PlaygroundPage() {
  useSignals()

  function handleInput(e: Event) {
    const raw = (e.target as HTMLTextAreaElement).value
    try {
      const parsed = JSON.parse(raw) as ViewConfig
      configSignal.value = parsed
      parseErrorSignal.value = null
    } catch (err) {
      parseErrorSignal.value = err instanceof Error ? err.message : 'Invalid JSON'
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minBlockSize: 0,
        marginBlockStart: 'calc(-1 * var(--cascade-space-6))',
        marginInline: 'calc(-1 * var(--cascade-space-6))',
      }}
    >
      {/* Pane header */}
      <div
        style={{
          padding: 'var(--cascade-space-4) var(--cascade-space-6)',
          borderBottom: '1px solid var(--cascade-color-border)',
          background: 'var(--cascade-color-surface)',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: 'var(--cascade-text-xl)',
            fontWeight: 'var(--cascade-font-semibold)',
            margin: 0,
          }}
        >
          JSON Playground
        </h1>
        <p
          style={{
            fontSize: 'var(--cascade-text-sm)',
            color: 'var(--cascade-color-text-subtle)',
            margin: 'var(--cascade-space-1) 0 0',
          }}
        >
          Describe a UI in JSON — CascadeView renders it live using cascade components.
        </p>
      </div>

      {/* Split pane */}
      <div style={{ display: 'flex', flex: 1, minBlockSize: 0, overflow: 'hidden' }}>
        {/* Left: editor */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--cascade-color-border)',
          }}
        >
          <div
            style={{
              padding: 'var(--cascade-space-1) var(--cascade-space-3)',
              fontSize: 'var(--cascade-text-xs)',
              fontWeight: 600,
              color: 'var(--cascade-color-text-subtle)',
              background: 'var(--cascade-color-bg-subtle)',
              borderBottom: '1px solid var(--cascade-color-border)',
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
          >
            CONFIG (JSON)
          </div>
          <textarea
            defaultValue={EXAMPLE_JSON}
            onInput={handleInput}
            spellcheck={false}
            style={{
              flex: 1,
              padding: 'var(--cascade-space-4)',
              fontFamily: 'monospace',
              fontSize: 'var(--cascade-text-xs)',
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'var(--cascade-color-background)',
              color: 'var(--cascade-color-text)',
            }}
          />
          {parseErrorSignal.value && (
            <div
              style={{
                padding: 'var(--cascade-space-2) var(--cascade-space-3)',
                background:
                  'color-mix(in oklch, var(--cascade-color-destructive) 10%, transparent)',
                borderTop:
                  '1px solid color-mix(in oklch, var(--cascade-color-destructive) 30%, transparent)',
                fontSize: 'var(--cascade-text-xs)',
                color: 'var(--cascade-color-destructive)',
                flexShrink: 0,
              }}
            >
              {parseErrorSignal.value}
            </div>
          )}
        </div>

        {/* Right: renderer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              padding: 'var(--cascade-space-1) var(--cascade-space-3)',
              fontSize: 'var(--cascade-text-xs)',
              fontWeight: 600,
              color: 'var(--cascade-color-text-subtle)',
              background: 'var(--cascade-color-bg-subtle)',
              borderBottom: '1px solid var(--cascade-color-border)',
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
          >
            PREVIEW
          </div>
          <div style={{ flex: 1, padding: 'var(--cascade-space-6)', overflowY: 'auto' }}>
            {configSignal.value && <CascadeView config={configSignal.value} onInvalid="render" />}
          </div>
        </div>
      </div>
    </div>
  )
}
