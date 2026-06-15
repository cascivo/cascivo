import { CopyCommand } from './CopyCommand'

const STEPS = [
  {
    title: 'Initialize',
    code: 'npx @cascivo/cli init',
    note: 'Detects your package manager, installs core + tokens, writes cascivo.config.ts.',
  },
  {
    title: 'Add components',
    code: 'npx @cascivo/cli add button',
    note: 'Copies the source into src/components/ui — it is your code now.',
  },
  {
    title: 'Use them',
    code: "import { Button } from './components/ui/button/button'",
    note: 'No provider, no wrapper, no configuration. Just import and render.',
  },
]

export function QuickStart() {
  return (
    <section className="section" id="quickstart" data-reveal="">
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

      <div className="quickstart-prebuilt" aria-label="Prebuilt option">
        <h3 className="quickstart-prebuilt-heading">
          Or use components directly from npm — no copy needed
        </h3>
        <p className="quickstart-prebuilt-note">
          <code>@cascivo/react</code> ships a prebuilt distribution of all components. Install once
          and import anywhere. You don&apos;t own the source, but there&apos;s no setup and no copy
          step. Upgrade to owned code via the CLI at any time.
        </p>
        <div className="quickstart-prebuilt-steps">
          <div>
            <CopyCommand command="npm add @cascivo/react @cascivo/tokens @cascivo/themes" />
            <p className="quickstart-note">Install the prebuilt package and its peer assets.</p>
          </div>
          <div>
            <CopyCommand
              command={`import { Button } from '@cascivo/react'\nimport '@cascivo/themes/light.css'`}
            />
            <p className="quickstart-note">
              Import the component and a theme CSS file. No provider, no wrapper.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
