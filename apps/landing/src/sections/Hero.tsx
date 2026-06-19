import { Badge } from '@cascivo/components/badge'
import { CopyCommand } from './CopyCommand'
import { LinkButton } from './LinkButton'

export function Hero() {
  return (
    <section className="hero" id="hero">
      <Badge variant="outline">
        {__CASCIVO_COMPONENT_COUNT__}+ components · {__CASCIVO_THEME_COUNT__} themes · MIT
      </Badge>
      <h1 className="hero-title">
        Native to the web. <span className="hero-title-accent">Fluent in agent.</span>
      </h1>
      <p className="hero-sub">
        The React design system you copy in and own — built on modern CSS and signals, readable by
        your agent.
      </p>
      <div className="hero-ctas">
        <LinkButton href="/guides">Get started</LinkButton>
        <LinkButton href="https://github.com/urbanisierung/cascivo" variant="secondary">
          GitHub
        </LinkButton>
      </div>
      <CopyCommand command="npx cascivo add button" />
    </section>
  )
}
