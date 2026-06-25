import { CopyCommand } from '../../sections/CopyCommand'
import { LinkButton } from '../../sections/LinkButton'
import { GUIDES_CTA } from './data'

export function GuidesCta() {
  return (
    <section className="cta-band" data-reveal="">
      <h2>{GUIDES_CTA.title}</h2>
      <p>{GUIDES_CTA.sub}</p>
      <div className="cta-band-actions">
        <LinkButton href={GUIDES_CTA.primary.href}>{GUIDES_CTA.primary.label}</LinkButton>
        <LinkButton href={GUIDES_CTA.secondary.href} variant="secondary">
          {GUIDES_CTA.secondary.label}
        </LinkButton>
        <CopyCommand command={GUIDES_CTA.install} />
      </div>
    </section>
  )
}
