import { CopyCommand } from './CopyCommand'
import { LinkButton } from './LinkButton'

export function CtaBand() {
  return (
    <section className="cta-band" data-reveal="">
      <h2>Own your UI.</h2>
      <p>Copy the code. Keep the platform. Bring your agent.</p>
      <div className="cta-band-actions">
        <LinkButton href="/docs">Start building</LinkButton>
        <CopyCommand command="npx cascivo init" />
      </div>
    </section>
  )
}
