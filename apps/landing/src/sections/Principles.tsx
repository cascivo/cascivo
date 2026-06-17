import { Collapsible } from '@cascivo/components/collapsible'

const PRINCIPLES = [
  {
    title: 'Platform CSS',
    line: '@layer, @container, :has() — no utilities, no runtime styling.',
    more: '@layer keeps the cascade predictable with no specificity wars, @container lets components respond to their slot, and :has() handles conditional styling with zero JavaScript.',
    href: '/modern-css',
    linkLabel: 'Modern CSS',
  },
  {
    title: 'Signals, not re-renders',
    line: 'Interactions commit once. Measured, not claimed.',
    more: "Fine-grained signals write state past React's reconciler, so a component commits only when its own data changes — counted on the performance page, not asserted.",
    href: '/performance',
    linkLabel: 'See the benchmarks',
  },
  {
    title: 'Owned code',
    line: 'npx cascivo add copies the source into your repo. It is yours.',
    more: 'No version lock, no black-box dependency: the component source lands in your project. Edit it, fork it, keep it — or start from the prebuilt @cascivo/react package and migrate later.',
    href: '/guides',
    linkLabel: 'Adoption guides',
  },
  {
    title: 'Agent-ready',
    line: 'Manifests, MCP, skills, llms.txt. Artifacts, not adjectives.',
    more: 'Every component ships a machine-readable manifest that powers an MCP server, Claude Code skills, and llms.txt — so agents build with real components, props, and tokens instead of guessing.',
    href: '/ai',
    linkLabel: 'The AI layer',
  },
]

export function Principles() {
  return (
    <section className="principles" aria-label="Principles" data-reveal="">
      {PRINCIPLES.map((p) => (
        <div key={p.title} className="principle">
          <span className="principle-title">{p.title}</span>
          <span className="principle-line">{p.line}</span>
          <Collapsible className="principle-more" trigger="Learn more">
            <p className="principle-more-text">{p.more}</p>
            <a className="principle-more-link" href={p.href}>
              {p.linkLabel} &rarr;
            </a>
          </Collapsible>
        </div>
      ))}
    </section>
  )
}
