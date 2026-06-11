import { CascadeView } from '@cascade-ui/render'
import type { ViewConfig } from '@cascade-ui/render'

const DEMO_CONFIG: ViewConfig = {
  version: 1,
  view: {
    regions: {
      status: [
        { component: 'Badge', props: { variant: 'success' }, children: 'Published' },
        { component: 'Badge', props: { variant: 'warning' }, children: 'Draft' },
      ],
      actions: [
        { component: 'Button', props: { variant: 'primary' }, children: 'Save changes' },
        { component: 'Button', props: { variant: 'secondary' }, children: 'Cancel' },
      ],
      content: [
        {
          component: 'Alert',
          props: { variant: 'info', title: 'AI-generated' },
          children: 'This layout was described in JSON.',
        },
        { component: 'Separator' },
        {
          component: 'Card',
          children: [{ component: 'Input', props: { label: 'Name', placeholder: 'Your name' } }],
        },
      ],
    },
  },
}

const DEMO_JSON = `{
  "version": 1,
  "view": {
    "regions": {
      "status": [
        { "component": "Badge",
          "props": { "variant": "success" },
          "children": "Published" },
        { "component": "Badge",
          "props": { "variant": "warning" },
          "children": "Draft" }
      ],
      "actions": [
        { "component": "Button",
          "props": { "variant": "primary" },
          "children": "Save changes" }
      ],
      "content": [
        { "component": "Alert",
          "props": { "variant": "info",
                     "title": "AI-generated" },
          "children": "This layout was described in JSON." },
        { "component": "Separator" },
        { "component": "Card",
          "children": [
            { "component": "Input",
              "props": { "label": "Name",
                         "placeholder": "Your name" } }
          ] }
      ]
    }
  }
}`

export function JsonPlayground() {
  return (
    <section className="section">
      <h2>Describe any UI in JSON. Watch it render.</h2>
      <p className="section-sub">
        CascadeView turns a JSON config into a live cascade UI — perfect for AI agents, low-code
        tools, and user-customizable dashboards.{' '}
        <a href="/docs/playground">Try the interactive playground →</a>
      </p>

      <div className="json-playground-demo" data-theme="light">
        {/* JSON pane */}
        <div className="json-playground-editor">
          <div className="json-playground-label">CONFIG (JSON)</div>
          <pre className="json-playground-code">{DEMO_JSON}</pre>
        </div>

        {/* Preview pane */}
        <div className="json-playground-preview">
          <div className="json-playground-label">PREVIEW</div>
          <div className="json-playground-output">
            <CascadeView config={DEMO_CONFIG} onInvalid="render" />
          </div>
        </div>
      </div>
    </section>
  )
}
