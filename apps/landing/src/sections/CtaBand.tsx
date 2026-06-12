import { Button } from '@cascade-ui/components/button'
import { CopyCommand } from './CopyCommand'

export function CtaBand() {
  return (
    <section className="cta-band">
      <h2>Own your UI.</h2>
      <p>Copy the code. Keep the platform. Bring your agent.</p>
      <div className="cta-band-actions">
        <Button
          onClick={() => {
            window.location.href = '/docs'
          }}
        >
          Start building
        </Button>
        <CopyCommand command="npx cascade init" />
      </div>
    </section>
  )
}
