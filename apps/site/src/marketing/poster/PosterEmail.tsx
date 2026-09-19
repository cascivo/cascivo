'use client'
import { useComputed, useSignal, useSignals } from '@cascivo/core'
import { Checkbox } from '@cascivo/components/checkbox'
import { ToggleGroup } from '@cascivo/components/toggle-group'
import { EMAIL_OUTLOOK, EMAIL_SAMPLES, EMAIL_TEMPLATES } from '../email-samples.generated'
import { EMAIL_SHOWCASE, EMAIL_SHOWCASE_OUTLOOK } from '../email-showcase.generated'

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
 *
 * "All primitives" is a fourth chip in the same picker rather than a second frame: one
 * message built from nearly every primitive the package exports, so the section answers both
 * "what does it look like" and "what is in the box" without growing a second control.
 */

const THEMES = ['light', 'dark', 'warm', 'midnight', 'corporate', 'cyberpunk'] as const
type PreviewTheme = (typeof THEMES)[number]

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const THEME_ITEMS = THEMES.map((t) => ({ value: t, label: titleCase(t) }))

/** The composed every-primitive message, alongside the three shipped templates. */
const SHOWCASE_ID = 'showcase'
const TEMPLATE_ITEMS = [
  ...EMAIL_TEMPLATES.map((t) => ({ value: t.id, label: t.name })),
  { value: SHOWCASE_ID, label: 'All primitives' },
]

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

  const showcase = useComputed(() => templateId.value === SHOWCASE_ID)
  const sample = useComputed(() =>
    showcase.value ? EMAIL_SHOWCASE[theme.value]! : EMAIL_SAMPLES[templateId.value]![theme.value]!,
  )
  const srcDoc = useComputed(() => {
    if (!outlook.value) return sample.value.html
    return showcase.value ? EMAIL_SHOWCASE_OUTLOOK : EMAIL_OUTLOOK[templateId.value]!
  })

  // The frame is sized from the mail it holds. One height tall enough for the
  // longest of the thirty-six samples left ~140px of dead panel under the short
  // ones; measuring on load costs nothing (an `srcdoc` document is same-origin)
  // and re-fires whenever the template, theme or Outlook toggle swaps the doc.
  // Zero means "not measured yet" — the stylesheet's own block-size stands.
  const frameHeight = useSignal(0)

  return (
    <section className="pg-section pg-cols pg-cols--4-8" id="email" aria-label="Email">
      <div className="pg-pad">
        <p className="pg-eyebrow">15 / email</p>
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
        {/* JSX drops the newline between two inline-block links, so they need an
            explicit gap rather than the word space they would have in HTML. */}
        <div className="pg-email-links">
          <a className="pg-link" href="/docs/email">
            See the email docs →
          </a>
          <a className="pg-link" href="/docs/email/components">
            Preview every component →
          </a>
        </div>
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
              {...(frameHeight.value > 0 ? { style: { blockSize: `${frameHeight.value}px` } } : {})}
              onLoad={(e) => {
                const doc = e.currentTarget.contentDocument
                if (!doc) return
                frameHeight.value = Math.max(
                  doc.documentElement.scrollHeight,
                  doc.body?.scrollHeight ?? 0,
                )
              }}
            />
            <figcaption className="pg-email-caption pg-mono">
              {outlook.value ? 'Outlook (Windows) — unsupported CSS removed' : 'As sent'}
            </figcaption>
          </figure>
        </div>

        {/* The page's own Checkbox, not a browser default — this sits four bands
            below a gallery that demos the styled one. */}
        <Checkbox
          className="pg-email-toggle"
          label="Show what Outlook (Windows) supports — the client that fails the most modern CSS, and the one nobody can emulate offline"
          checked={outlook.value}
          onChange={(e) => {
            outlook.value = e.currentTarget.checked
          }}
        />

        <p className="pg-email-meta pg-mono">
          <span>Subject: {sample.value.subject}</span>
          <span>Preview: {sample.value.preheader}</span>
        </p>
      </div>
    </section>
  )
}
