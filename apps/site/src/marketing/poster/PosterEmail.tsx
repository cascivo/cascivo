'use client'
import { useComputed, useSignal, useSignals } from '@cascivo/core'
import { ToggleGroup } from '@cascivo/components/toggle-group'
import { EMAIL_OUTLOOK, EMAIL_SAMPLES, EMAIL_TEMPLATES } from '../email-samples.generated'

/*
 * The email target demonstrating itself.
 *
 * The frames below are not screenshots and not a mock — they are `@cascivo/email` output,
 * rendered at build time and dropped into an `<iframe srcdoc>`. An iframe rather than a div
 * because an email is a whole document with its own `<body>`, and because this page's own
 * stylesheet must not reach it: the whole claim is that the mail carries its styling with
 * it, and a preview that borrowed the site's CSS would be lying.
 *
 * The second frame is the same email with every declaration Outlook Windows cannot support
 * removed, derived from the Can I email matrix. Square button corners are the real
 * degradation; that nothing else moves is the point.
 */

const THEMES = ['light', 'dark', 'warm', 'midnight', 'corporate', 'cyberpunk'] as const
type PreviewTheme = (typeof THEMES)[number]

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const THEME_ITEMS = THEMES.map((t) => ({ value: t, label: titleCase(t) }))
const TEMPLATE_ITEMS = EMAIL_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))

const SNIPPET = `import { renderEmail, PasswordReset } from '@cascivo/email'

const { html, text, subject } = renderEmail(
  <PasswordReset resetHref={link} />,
  { theme: 'midnight' },
)`

export function PosterEmail() {
  useSignals()
  const theme = useSignal<PreviewTheme>('midnight')
  const templateId = useSignal<string>('password-reset')
  const outlook = useSignal(false)

  const sample = useComputed(() => EMAIL_SAMPLES[templateId.value]![theme.value]!)
  const srcDoc = useComputed(() =>
    outlook.value ? EMAIL_OUTLOOK[templateId.value]! : sample.value.html,
  )

  return (
    <section className="pg-section pg-cols pg-cols--4-8" id="email" aria-label="Email">
      <div className="pg-pad">
        <p className="pg-eyebrow">13 / email</p>
        <h2 className="pg-display pg-display--section pg-email-head">
          The same system
          <br />
          in the inbox
        </h2>
        <p className="pg-body pg-email-body">
          Your product and the mail it sends share one design system. Twelve themes resolve to
          literal sRGB at build time, because no email client supports a custom property — and the
          layout is tables, because Outlook Windows still renders with Microsoft Word.
        </p>
        <pre className="pg-pre pg-pre--tight">
          <code>{SNIPPET}</code>
        </pre>
        <p className="pg-email-facts pg-mono">
          {(sample.value.encodedBytes / 1024).toFixed(1)} KB encoded · no client JS · plain-text
          part included
        </p>
        <a className="pg-link" href="/docs/email">
          See the email docs →
        </a>
      </div>

      <div className="pg-email-stage">
        <ToggleGroup
          className="pg-theme-chips"
          type="single"
          items={TEMPLATE_ITEMS}
          value={templateId.value}
          onValueChange={(next) => {
            if (typeof next === 'string') templateId.value = next
          }}
          aria-label="Preview template"
        />
        <ToggleGroup
          className="pg-theme-chips"
          type="single"
          items={THEME_ITEMS}
          value={theme.value}
          onValueChange={(next) => {
            if (typeof next === 'string') theme.value = next as PreviewTheme
          }}
          aria-label="Preview theme"
        />

        <div className="pg-email-frames">
          <figure className="pg-email-figure">
            <iframe
              className="pg-email-frame"
              title={`${sample.value.subject} — as sent`}
              srcDoc={srcDoc.value}
              loading="lazy"
            />
            <figcaption className="pg-email-caption pg-mono">
              {outlook.value ? 'Outlook (Windows) — unsupported CSS removed' : 'As sent'}
            </figcaption>
          </figure>
        </div>

        <label className="pg-email-toggle">
          <input
            type="checkbox"
            checked={outlook.value}
            onChange={(e) => {
              outlook.value = e.currentTarget.checked
            }}
          />
          <span>
            Show what Outlook (Windows) supports — the client that fails the most modern CSS, and
            the one nobody can emulate offline
          </span>
        </label>

        <p className="pg-email-meta pg-mono">
          <span>Subject: {sample.value.subject}</span>
          <span>Preview: {sample.value.preheader}</span>
        </p>
      </div>
    </section>
  )
}
