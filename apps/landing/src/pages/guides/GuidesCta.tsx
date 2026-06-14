import { Button } from '@cascivo/components/button'
import { CopyCommand } from '../../sections/CopyCommand'
import { GUIDES_CTA } from './data'

export function GuidesCta() {
  return (
    <section className="cta-band" data-reveal="">
      <h2>{GUIDES_CTA.title}</h2>
      <p>{GUIDES_CTA.sub}</p>
      <div className="cta-band-actions">
        <Button
          onClick={() => {
            window.location.href = GUIDES_CTA.primary.href
          }}
        >
          {GUIDES_CTA.primary.label}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            window.location.href = GUIDES_CTA.secondary.href
          }}
        >
          {GUIDES_CTA.secondary.label}
        </Button>
        <CopyCommand command={GUIDES_CTA.install} />
      </div>
    </section>
  )
}
