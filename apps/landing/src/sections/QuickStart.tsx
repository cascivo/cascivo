import { CopyCommand } from './CopyCommand'

const STEPS = [
  {
    title: 'Initialize',
    code: 'npx cascade init',
    note: 'Detects your package manager, installs core + tokens, writes cascade.config.ts.',
    copyable: true,
  },
  {
    title: 'Add components',
    code: 'npx cascade add button',
    note: 'Copies the source into src/components/ui — it is your code now.',
    copyable: true,
  },
  {
    title: 'Use them',
    code: "import { Button } from './components/ui/button/button'",
    note: 'No provider, no wrapper, no configuration. Just import and render.',
    copyable: false,
  },
]

export function QuickStart() {
  return (
    <section className="section" id="quickstart">
      <h2>Up and running in three steps</h2>
      <div className="quickstart">
        {STEPS.map((step, i) => (
          <div key={step.title} className="quickstart-step">
            <div className="quickstart-head">
              <span className="quickstart-num">{i + 1}</span>
              <h3>{step.title}</h3>
            </div>
            {step.copyable ? (
              <CopyCommand command={step.code} />
            ) : (
              <pre className="quickstart-code">
                <code>{step.code}</code>
              </pre>
            )}
            <p className="quickstart-note">{step.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
