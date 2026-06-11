import { Badge } from '@cascade-ui/components/badge'
import { Button } from '@cascade-ui/components/button'
import registry from '../../../../registry.json'
import { CopyCommand } from './CopyCommand'

const componentCount = (registry as { components: unknown[] }).components.length

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
