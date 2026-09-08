import { useComputed, useSignal, useSignals } from '@cascivo/core'
import { CodeSnippet } from '@cascivo/components/code-snippet'
import { ToggleGroup } from '@cascivo/components/toggle-group'
import { EMAIL_OUTLOOK, EMAIL_SAMPLES, EMAIL_TEMPLATES } from '../marketing/email-samples.generated'

/*
 * Every frame on this page is real `@cascivo/email` output, rendered at build time and
 * dropped into an `<iframe srcdoc>`. Not a screenshot, not a styled div pretending — the
 * bytes an adopter would send.
 *
 * The iframe is load-bearing: an email is a whole document with its own `<body>`, and this
 * site's stylesheet must not reach into it. A preview that inherited the docs CSS would show
 * something no recipient will ever see, which is the one thing an email preview must not do.
 */

const THEMES = [
  'light',
  'dark',
  'warm',
  'flat',
  'minimal',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
  'cyberpunk',
  'arcade',
] as const

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const THEME_ITEMS = THEMES.map((t) => ({ value: t, label: titleCase(t) }))
const TEMPLATE_ITEMS = EMAIL_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))

const SEND = `import { assertSendable, renderEmail, PasswordReset, passwordResetSubject } from '@cascivo/email'

const message = renderEmail(<PasswordReset resetHref={link} />, {
  theme: 'midnight',
  subject: passwordResetSubject(),
  tier: 'strict',
})

assertSendable(message)
await mailer.send({ to, ...message })`

const COMPOSE = `import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@cascivo/email'

export function Invite({ href, team }: { href: string; team: string }) {
  return (
    <Html>
      <Head title={\`Join \${team}\`} />
      <Body>
        <Preview>{\`You have been invited to join \${team}\`}</Preview>
        <Container>
          <Section padding={32}>
            <Heading level={1}>{\`Join \${team}\`}</Heading>
            <Text>A teammate invited you. The link expires in seven days.</Text>
            <Button href={href}>Accept the invitation</Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}`

const ANALYZE = `import { analyze, formatAnalysis } from '@cascivo/email'

console.log(formatAnalysis(analyze(message.html)))
// total          6.85 KB
//   inline CSS   2.84 KB  41%
//   markup       3.09 KB  45%
//   text         0.77 KB  11%`

export function EmailPage() {
  useSignals()
  const theme = useSignal<string>('light')
  const templateId = useSignal<string>('password-reset')

  const sample = useComputed(() => EMAIL_SAMPLES[templateId.value]![theme.value]!)

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Transactional email</div>
        <h1>Email</h1>
        <p class="doc-lede">
          Render cascivo-themed email with <code>@cascivo/email</code>. Your product and the mail it
          sends share one design system — the same twelve themes, the same tokens, resolved for
          clients that have never heard of <code>oklch()</code>. Table-based layout, inline styles,
          no client JavaScript, and a plain-text part derived for you.
        </p>
      </header>

      <section class="doc-section">
        <h2>Live output</h2>
        <p>
          Real output, not a screenshot. Pick a template and a theme — the frame below is the HTML
          an adopter would send, rendered at build time and shown in an isolated iframe.
        </p>
        <ToggleGroup
          className="doc-email-chips"
          type="single"
          items={TEMPLATE_ITEMS}
          value={templateId.value}
          onValueChange={(next) => {
            if (typeof next === 'string') templateId.value = next
          }}
          aria-label="Template"
        />
        <ToggleGroup
          className="doc-email-chips"
          type="single"
          items={THEME_ITEMS}
          value={theme.value}
          onValueChange={(next) => {
            if (typeof next === 'string') theme.value = next
          }}
          aria-label="Theme"
        />
        <div class="doc-email-grid">
          <figure class="doc-email-figure">
            <iframe
              class="doc-email-frame"
              title={`${sample.value.subject} — as sent`}
              srcDoc={sample.value.html}
              loading="lazy"
            />
            <figcaption>
              <strong>As sent</strong> — {(sample.value.encodedBytes / 1024).toFixed(1)} KB encoded
            </figcaption>
          </figure>
          <figure class="doc-email-figure">
            <iframe
              class="doc-email-frame"
              title={`${sample.value.subject} — Outlook (Windows)`}
              srcDoc={EMAIL_OUTLOOK[templateId.value]!}
              loading="lazy"
            />
            <figcaption>
              <strong>Outlook (Windows)</strong> — every declaration it does not support removed
            </figcaption>
          </figure>
        </div>
        <p class="doc-note">
          The right-hand frame is not a mock-up of Outlook. It is the same email with each
          declaration the Can I email support matrix reports as unsupported in Outlook Windows
          stripped out, then rendered. Square button corners are the genuine degradation; that
          nothing else moves is the point. It cannot reproduce the Word engine&rsquo;s own quirks —
          no offline tool can — which is why the primitive set is built so it cannot emit what
          Outlook lacks in the first place.
        </p>
        <p class="doc-note">
          Subject: <code>{sample.value.subject}</code>
          <br />
          Inbox preview: <code>{sample.value.preheader}</code>
        </p>
      </section>

      <section class="doc-section">
        <h2>Send one</h2>
        <p>
          <code>renderEmail</code> returns the whole message — <code>subject</code>,{' '}
          <code>html</code>, <code>text</code> and <code>preheader</code> — not just a document. The
          subject comes from the template rather than the call site, because the subject, the{' '}
          <code>&lt;title&gt;</code> and the inbox preview are three facets of one message.
        </p>
        <CodeSnippet variant="multi" language="ts" code={SEND} title="Sending" />
        <p>
          <code>assertSendable</code> catches the four failures that only reveal themselves once the
          mail has arrived: no subject, no text part, no inbox preview, and a body over the clip
          threshold.
        </p>
      </section>

      <section class="doc-section">
        <h2>Write one</h2>
        <p>Templates are ordinary compositions of the primitives.</p>
        <CodeSnippet variant="multi" language="ts" code={COMPOSE} title="A template" />
      </section>

      <section class="doc-section">
        <h2>Rules that are enforced, not advised</h2>
        <ul>
          <li>
            <strong>Layout is tables.</strong> Flexbox, Grid and <code>gap</code> are all
            unsupported in Outlook Windows.
          </li>
          <li>
            <strong>Padding goes on a cell.</strong> Padding on a <code>&lt;div&gt;</code> is
            dropped there.
          </li>
          <li>
            <strong>
              No <code>rem</code>, no custom properties.
            </strong>{' '}
            Both are converted or resolved at render time.
          </li>
          <li>
            <strong>
              Images need <code>alt</code> and <code>width</code>, and must be raster.
            </strong>{' '}
            Inline SVG renders in no floor client but Apple Mail.
          </li>
          <li>
            <strong>No client JavaScript.</strong> There is no interactive primitive and there will
            not be one.
          </li>
        </ul>
        <p>
          A conformance lint reads the rendered document — not the components — and checks every
          declaration, element and at-rule against the vendored Can I email matrix. It fails the
          build on anything a floor client cannot render. See{' '}
          <a href="https://github.com/cascivo/cascivo/blob/main/docs/EMAIL-CLIENT-SUPPORT.md">
            the generated support matrix
          </a>
          .
        </p>
      </section>

      <section class="doc-section">
        <h2>Size</h2>
        <p>
          Gmail truncates a message past roughly 102 KB, mobile lower, and iOS Gmail around 20 KB —
          measured on the <strong>encoded</strong> body, not the raw string. Watch{' '}
          <code>stats.encodedBytes</code>; <code>stats.bytes</code> under-reports by up to a third.
          When something is too big, ask where the bytes went rather than guessing.
        </p>
        <CodeSnippet variant="multi" language="ts" code={ANALYZE} title="Byte attribution" />
      </section>

      <section class="doc-section">
        <h2>Preview locally</h2>
        <p>
          <code>pnpm --filter @cascivo/email-preview dev</code> gives you viewport switching, all
          twelve themes, per-client simulation, a live byte gauge with the clip thresholds drawn on
          it, and an <code>.eml</code> download — the cheapest way to see the mail in a{' '}
          <em>real</em> client, with no service involved: download it and drag it into Outlook or
          Apple Mail.
        </p>
      </section>

      <section class="doc-section">
        <h2>Coming from React Email</h2>
        <p>
          Most primitives map one to one, and <code>planMigration</code> will tell you which. The
          gaps are deliberate: no <code>Font</code> (web fonts do not load in Gmail or Outlook), no{' '}
          <code>Markdown</code> (arbitrary Markdown produces HTML the lint cannot vouch for), no{' '}
          <code>Tailwind</code> (cascivo emits resolved tokens directly, so there is no
          class-to-inline-style step to perform).
        </p>
      </section>
    </article>
  )
}
