import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import registry from '../../../../registry.json'
import { CopyCommand } from './CopyCommand'

const componentCount = (registry as { components: unknown[] }).components.length

const CHIPS = [
  '@layer CSS, no runtime',
  'Fine-grained signals',
  'WCAG 2.1 AA',
  'RTL-ready',
  'AI-native manifests',
  'Copy-paste, owned code',
]

export function Hero() {
  return (
    <section className="hero">
      <Badge variant="outline">{componentCount}+ components · 5 themes · MIT</Badge>
      <h1 className="hero-title">
        Native to the web. <span className="hero-title-accent">Fluent in agent.</span>
      </h1>
      <p className="hero-sub">
        cascade is a React design system built on modern platform CSS and fine-grained signals —
        with a machine-readable manifest behind every component. Copy the code. Own it. Let your
        agent build with it.
      </p>
      <ul className="hero-chips" aria-label="Capabilities">
        {CHIPS.map((chip) => (
          <li key={chip}>
            <Badge variant="outline" size="sm">
              {chip}
            </Badge>
          </li>
        ))}
      </ul>
      <div className="hero-ctas">
        <Button
          onClick={() => {
            window.location.href = '/docs'
          }}
        >
          Start building
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            window.location.href = 'https://github.com/urbanisierung/cascade-ui'
          }}
        >
          GitHub
        </Button>
      </div>
      <CopyCommand command="npx cascade add button" />
    </section>
  )
}
