import { Button } from '@cascivo/components/button'
import { GUIDES_HERO } from './data'

export function GuidesHero() {
  return (
    <section id="guides-top" className="proof-hero" aria-label="Guides overview">
      <p className="guides-eyebrow">{GUIDES_HERO.eyebrow}</p>
      <h1>{GUIDES_HERO.title}</h1>
      <p className="proof-hero-sub">{GUIDES_HERO.sub}</p>
      <div className="guides-hero-ctas">
        {GUIDES_HERO.ctas.map((cta, i) => (
          <Button
            key={cta.href}
            variant={i === 0 ? 'primary' : 'secondary'}
            onClick={() => {
              window.location.hash = cta.href.replace('#', '')
            }}
          >
            {cta.label}
          </Button>
        ))}
      </div>
    </section>
  )
}
