import { Card, CardContent, CardHeader, CardTitle } from '@cascade-ui/components/card'

const FEATURES = [
  {
    title: 'CSS-native',
    body: '@layer, @container, :has() — modern platform CSS with zero preprocessors and zero utility-class bloat.',
  },
  {
    title: 'Signal-driven',
    body: 'A micro-FSM on Preact Signals replaces useState and useContext. Zero unnecessary re-renders.',
  },
  {
    title: 'Owned code',
    body: 'Components are copy-pasted into your project via the CLI. You own every line you ship.',
  },
  {
    title: 'Three themes',
    body: 'Light, dark, and warm out of the box — scoped to any container with a data-theme attribute.',
  },
  {
    title: 'AI-first',
    body: 'Every component ships a machine-readable manifest, exposed through an MCP server and Claude Code skills.',
  },
  {
    title: 'Dark factory',
    body: 'An automated pipeline generates, tests, and self-heals new components from a spec backlog.',
  },
]

export function Features() {
  return (
    <section className="section">
      <h2>Six reasons to switch</h2>
      <div className="features-grid">
        {FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>{feature.body}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
