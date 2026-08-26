import { CodeSnippet } from '@cascivo/components/code-snippet'

const STEPS = [
  {
    title: 'Initialize',
    code: 'npx cascivo init',
    language: 'bash' as const,
    note: 'Detects your package manager and writes the config.',
  },
  {
    title: 'Add components',
    code: 'npx cascivo add button',
    language: 'bash' as const,
    note: 'Copies the source into your repo — it is yours now.',
  },
  {
    title: 'Use them',
    code: "import '@cascivo/themes/light-dark.css'\nimport { Button } from './components/ui/button'",
    language: 'ts' as const,
    note: 'Import a theme once; each component brings its own CSS. No provider, no wrapper.',
  },
]

/**
 * Three install steps. Deliberately not the `Steps` component: that models
 * *progress* through a flow (`activeStep`, per-step state announced to
 * assistive tech) and none of these three is pending or complete — they are
 * three commands with their own copy buttons.
 */
export function PosterQuickStart() {
  return (
    <section className="pg-section" id="quickstart" aria-label="Quick start">
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">Three steps in</h2>
        <p className="pg-eyebrow">10 / quick start</p>
      </div>
      <ol className="pg-tiles pg-tiles--3 pg-steps">
        {STEPS.map((step, i) => (
          <li key={step.title} className="pg-pad pg-step">
            <p className="pg-step-head">
              <span className="pg-step-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="pg-display pg-display--sub">{step.title}</span>
            </p>
            <CodeSnippet
              className="pg-step-code"
              variant="multi"
              language={step.language}
              code={step.code}
            />
            <p className="pg-note">{step.note}</p>
          </li>
        ))}
      </ol>
      <div className="pg-pad pg-surface pg-prebuilt">
        <div className="pg-prebuilt-copy">
          <p className="pg-display pg-display--sub">Prefer no copy step?</p>
          <p className="pg-note">
            <code>@cascivo/react</code> ships a prebuilt distribution of every component. You
            don&apos;t own the source, but there is no setup — upgrade to owned code via the CLI at
            any time.
          </p>
        </div>
        <CodeSnippet
          className="pg-prebuilt-code"
          variant="single"
          language="bash"
          code="npm add @cascivo/react @cascivo/themes"
        />
      </div>
    </section>
  )
}
