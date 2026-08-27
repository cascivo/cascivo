import { CopyButton } from '@cascivo/components/copy-button'

const INIT = 'npx cascivo init'

export function PosterCta() {
  return (
    <section className="pg-section pg-acid pg-pad pg-cta" id="cta" aria-label="Get started">
      <h2 className="pg-display pg-display--cta">Own your UI.</h2>
      <p className="pg-cta-sub">Copy the code. Keep the platform. Bring your agent.</p>
      <div className="pg-cta-actions">
        <a className="pg-btn pg-btn--ink" href="/docs/getting-started">
          Get started
        </a>
        <a className="pg-btn pg-btn--quiet" href="/docs">
          Read the docs
        </a>
        <div className="pg-command">
          <code>{INIT}</code>
          <CopyButton className="pg-command-copy" value={INIT} />
        </div>
      </div>
    </section>
  )
}
