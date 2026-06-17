import { Badge } from '@cascivo/components/badge'
import { CopyCommand } from './CopyCommand'
import { LinkButton } from './LinkButton'

const CHIPS = [
  '@layer CSS, no runtime',
  'Fine-grained signals',
  'WCAG 2.2 AA',
  'RSC-compatible',
  'RTL-ready',
  'AI-native manifests',
  'Copy-paste, owned code',
]

export function Hero() {
  return (
    <section className="hero">
      <Badge variant="outline">{__CASCIVO_COMPONENT_COUNT__}+ components · 10 themes · MIT</Badge>
      <h1 className="hero-title">
        Native to the web. <span className="hero-title-accent">Fluent in agent.</span>
      </h1>
      <p className="hero-sub">
        cascivo is a React design system built on modern platform CSS and fine-grained signals —
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
        <LinkButton href="/docs">Start building</LinkButton>
        <LinkButton href="https://github.com/urbanisierung/cascivo" variant="secondary">
          GitHub
        </LinkButton>
      </div>
      <CopyCommand command="npx cascivo add button" />
    </section>
  )
}
