import { CodeSnippet } from '@cascivo/components/code-snippet'
import { CopyButton } from '@cascivo/components/copy-button'
import { CTA_SHIP_COMMANDS } from './ship'

const INIT = 'npx cascivo init'

export function PosterCta() {
  return (
    <section className="pg-section pg-acid pg-pad pg-cta" id="cta" aria-label="Get started">
      <h2 className="pg-display pg-display--cta">Own your UI.</h2>
      <p className="pg-cta-sub">Copy the code. Keep the platform. Bring your agent.</p>
      <div className="pg-cta-paths">
        <div className="pg-cta-path">
          <h3 className="pg-eyebrow">Add it to your project</h3>
          <div className="pg-command">
            <code>{INIT}</code>
            <CopyButton className="pg-command-copy" value={INIT} />
          </div>
          <div className="pg-cta-actions">
            <a className="pg-btn pg-btn--ink" href="/docs/getting-started">
              Get started
            </a>
            <a className="pg-btn pg-btn--quiet" href="/docs">
              Read the docs
            </a>
          </div>
        </div>
        <div className="pg-cta-path">
          <h3 className="pg-eyebrow">Or ship an app to Cloudflare</h3>
          <CodeSnippet
            className="pg-step-code"
            variant="multi"
            language="bash"
            code={CTA_SHIP_COMMANDS}
          />
          <p className="pg-note">
            A public URL with no Cloudflare account, live for an hour unless you claim it into a
            free one. <a href="#ship">Pick what the app does</a>.
          </p>
        </div>
      </div>
    </section>
  )
}
