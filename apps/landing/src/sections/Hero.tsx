import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import { CopyCommand } from './CopyCommand'
import { LinkButton } from './LinkButton'

// Decorative theme-swatch dots for the static preview visual (pure CSS colours,
// no JS, no layout shift). Order mirrors the first-party theme set.
const SWATCHES = ['#3b82f6', '#a855f7', '#f59e0b', '#10b981', '#ef4444']

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <Badge variant="outline">{__CASCIVO_COMPONENT_COUNT__}+ components · 10 themes · MIT</Badge>
        <h1 className="hero-title">
          Native to the web. <span className="hero-title-accent">Fluent in agent.</span>
        </h1>
        <p className="hero-sub">
          A React design system on modern platform CSS and fine-grained signals — with a
          machine-readable manifest behind every component.
        </p>
        <div className="hero-ctas">
          <LinkButton href="/guides">Get started</LinkButton>
          <LinkButton href="https://github.com/urbanisierung/cascivo" variant="secondary">
            GitHub
          </LinkButton>
        </div>
        <CopyCommand command="npx cascivo add button" />
      </div>

      <div className="hero-visual" aria-hidden="true">
        <div className="hero-preview-card">
          <div className="hero-preview-head">
            <Badge variant="success" size="sm">
              live
            </Badge>
            <span className="hero-preview-dots">
              {SWATCHES.map((c) => (
                <span key={c} className="hero-preview-dot" style={{ background: c }} />
              ))}
            </span>
          </div>
          <span className="hero-preview-label">Create account</span>
          <span className="hero-preview-field" />
          <span className="hero-preview-field" />
          <Button>Sign up</Button>
        </div>
      </div>
    </section>
  )
}
