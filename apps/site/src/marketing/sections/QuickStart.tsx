import { CopyCommand } from './CopyCommand'

const STEPS = [
  {
    title: 'Initialize',
    code: 'npx cascivo init',
    note: 'Detects your package manager and writes the config.',
  },
  {
    title: 'Add components',
    code: 'npx cascivo add button',
    note: 'Copies the source into your repo — it is yours now.',
  },
  {
    title: 'Use them',
    code: "import '@cascivo/themes/all.css'\nimport { Button } from './components/ui/button/button'",
    note: 'Import a theme once; each component brings its own CSS. No provider, no wrapper.',
  },
]

export function QuickStart() {
  return (
    <section className="section" id="quickstart" data-reveal="">
      <p className="flow-eyebrow">Quick start</p>
      <h2>Up and running in three steps</h2>
      <div className="quickstart">
        {STEPS.map((step, i) => (
          <div key={step.title} className="quickstart-step">
            <div className="quickstart-head">
              <span className="quickstart-num">{i + 1}</span>
              <h3>{step.title}</h3>
            </div>
            <CopyCommand command={step.code} />
            <p className="quickstart-note">{step.note}</p>
          </div>
        ))}
      </div>

      <div className="quickstart-prebuilt">
        <h3 className="quickstart-prebuilt-title">
          Prefer no copy step? Use the components directly from npm
        </h3>
        <p className="quickstart-prebuilt-note">
          <code>@cascivo/react</code> ships a prebuilt distribution of all components. Install once
          and import anywhere. You don&apos;t own the source, but there&apos;s no setup and no copy
          step. Upgrade to owned code via the CLI at any time.
        </p>
        <div className="quickstart-prebuilt-steps">
          <div>
            <CopyCommand command="npm add @cascivo/react @cascivo/themes @preact/signals-react" />
            <p className="quickstart-note">
              Install the components, the themes, and the signals runtime.
            </p>
          </div>
          <div>
            <CopyCommand
              command={`import '@cascivo/themes/all.css'\nimport { Button } from '@cascivo/react'`}
            />
            <p className="quickstart-note">
              Import a theme once. Each component&apos;s CSS is bundled with it — no stylesheet to
              wire up.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
