import { LinkButton } from '../../sections/LinkButton'

export function A11yCta() {
  return (
    <section className="cta-band" data-reveal="">
      <h2>Check the work.</h2>
      <p>
        The methodology is public and the suite runs with one command. Then see what the same rigor
        says about speed.
      </p>
      <div className="cta-band-actions">
        <LinkButton href="https://github.com/urbanisierung/cascivo/blob/main/apps/bench/METHODOLOGY.md">
          Read the methodology
        </LinkButton>
        <LinkButton href="/performance" variant="secondary">
          Performance, same treatment
        </LinkButton>
      </div>
    </section>
  )
}
