import { Button } from '@cascivo/components/button'

export function A11yCta() {
  return (
    <section className="cta-band" data-reveal="">
      <h2>Check the work.</h2>
      <p>
        The methodology is public and the suite runs with one command. Then see what the same rigor
        says about speed.
      </p>
      <div className="cta-band-actions">
        <Button
          onClick={() => {
            window.location.href =
              'https://github.com/urbanisierung/cascade-ui/blob/main/apps/bench/METHODOLOGY.md'
          }}
        >
          Read the methodology
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            window.location.href = '/performance'
          }}
        >
          Performance, same treatment
        </Button>
      </div>
    </section>
  )
}
