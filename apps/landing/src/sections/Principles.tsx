const PRINCIPLES = [
  {
    title: 'Platform CSS',
    line: '@layer, @container, :has() — no utilities, no runtime styling.',
    href: '#console',
  },
  {
    title: 'Signals, not re-renders',
    line: 'Interactions commit once. Counted on this page, not claimed.',
    href: '#signals',
  },
  {
    title: 'Owned code',
    line: 'npx @cascivo/cli add copies the source into your repo. It is yours.',
    href: '#quickstart',
  },
  {
    title: 'Agent-ready',
    line: 'Manifests, MCP, skills, llms.txt. Artifacts, not adjectives.',
    href: '#agents',
  },
]

export function Principles() {
  return (
    <section className="principles" aria-label="Principles" data-reveal="">
      {PRINCIPLES.map((p) => (
        <a key={p.title} href={p.href} className="principle">
          <span className="principle-title">{p.title}</span>
          <span className="principle-line">{p.line}</span>
        </a>
      ))}
    </section>
  )
}
