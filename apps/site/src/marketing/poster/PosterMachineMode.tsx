'use client'
import { useSignals } from '@cascivo/core'
import { useLiveMarkdown } from '@cascivo/text/react'
import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import { Checkbox } from '@cascivo/components/checkbox'
import { DataTable, type Column } from '@cascivo/components/data-table'
import { Input } from '@cascivo/components/input'
import { useRef } from 'react'

/*
 * Machine mode demonstrating itself.
 *
 * The panel on the right is not a screenshot of some output and not a string written by
 * hand: it is `@cascivo/text` running in the visitor's browser against the DOM of the panel
 * on the left. Type in the field, tick the box, and the document follows — which is the only
 * way to show the part that matters, that the text reports what the UI currently HOLDS and
 * not the props it was mounted with.
 *
 * The UI stays visible here, so this uses `useLiveMarkdown` against its own container rather
 * than `<TextView>`, which hides what it serializes. Both are the same hook underneath.
 */

interface Row {
  name: string
  plan: string
}

const COLUMNS: Column<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'plan', header: 'Plan' },
]

const ROWS: Row[] = [
  { name: 'Ada', plan: 'Pro' },
  { name: 'Linus', plan: 'Free' },
]

const SNIPPET = `import { toMarkdown } from '@cascivo/text'

const doc = toMarkdown(
  renderToStaticMarkup(<Billing />),
)`

export function PosterMachineMode() {
  useSignals()
  const stageRef = useRef<HTMLDivElement>(null)
  const doc = useLiveMarkdown(stageRef)

  return (
    <section
      className="pg-section pg-cols pg-cols--4-8"
      id="machine-mode"
      aria-label="Machine mode"
    >
      <div className="pg-pad">
        <p className="pg-eyebrow">16 / machine mode</p>
        <h2 className="pg-display pg-display--section pg-mm-head">
          The same UI,
          <br />
          as a document
        </h2>
        <p className="pg-body pg-mm-body">
          Every component already answers to a screen reader, so machine mode reads that and writes
          Markdown — no CSS, no hydration, nothing to click. An agent gets the page as text with the
          affordances named, and a chart arrives as a table because the chart already draws one for
          assistive technology.
        </p>
        <pre className="pg-pre pg-pre--tight">
          <code>{SNIPPET}</code>
        </pre>
        <p className="pg-mm-facts pg-mono">
          server · live DOM · &lt;TextView&gt; · JSON view configs
        </p>
        <a className="pg-link" href="/docs/machine-mode.md">
          Read the machine-mode docs →
        </a>
      </div>

      <div className="pg-mm-stage">
        <figure className="pg-mm-figure">
          <figcaption className="pg-mm-caption">The UI</figcaption>
          <div className="pg-mm-panel" ref={stageRef}>
            <h3 className="pg-mm-demo-head">
              Billing <Badge variant="success">Active</Badge>
            </h3>
            <Input label="Email" defaultValue="ada@example.com" />
            <Checkbox label="Email me a receipt" defaultChecked />
            <DataTable columns={COLUMNS} rows={ROWS} ariaLabel="Team plans" />
            <div className="pg-mm-actions">
              <Button variant="primary">Save changes</Button>
              <Button variant="secondary" disabled>
                Cancel
              </Button>
            </div>
          </div>
        </figure>

        <figure className="pg-mm-figure">
          <figcaption className="pg-mm-caption">What an agent reads</figcaption>
          <pre className="pg-pre pg-mm-doc">
            <code>{doc.value}</code>
          </pre>
        </figure>

        <p className="pg-mm-hint">
          Live: type in the field or tick the box and the document follows.
        </p>
      </div>
    </section>
  )
}
