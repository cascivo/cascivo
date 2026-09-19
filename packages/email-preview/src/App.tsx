/**
 * The email preview.
 *
 * One structural rule dominates the design: **the email renders inside an `<iframe srcdoc>`,
 * never into this page**. cascivo's own stylesheet uses `@layer` and would otherwise cascade
 * into the preview and make it lie about what a client will show. The iframe is also the
 * exact fixture the visual tests drive, so what CI screenshots and what a developer sees
 * here cannot drift apart.
 */
import {
  buildMessage,
  CASCIVO_ALLOW,
  EMAIL_THEMES,
  indexFeatures,
  lint,
  renderEmail,
  simulate,
  SIMULATED_CLIENTS,
  type CanIEmailData,
  type EmailTheme,
  type Finding,
} from '@cascivo/email'
import { createElement, useMemo, useState } from 'react'
// Both supplied by the bin through `src/plugin.mjs`: the templates because their location
// is not known until someone runs the command, the matrix because its path inside this repo
// is not a path a published package has.
import caniemail from 'virtual:cascivo-caniemail'
import extraAllow from 'virtual:cascivo-email-allow'
import { source, templates } from 'virtual:cascivo-email-templates'
import { custom as customThemes } from 'virtual:cascivo-email-themes'
import { CompatibilityPanel } from './CompatibilityPanel.tsx'
import { SizeGauge } from './SizeGauge.tsx'
import { clientFor, VIEWPORTS, type Tab } from './state.ts'

/**
 * `null` when no matrix was supplied.
 *
 * The conformance panel is the most useful thing here, and it is still not worth refusing to
 * render a template over: without the dataset the panel says where to get one and the rest
 * of the preview works.
 */
const FEATURES = caniemail === null ? null : indexFeatures(caniemail as unknown as CanIEmailData)

const TEMPLATES = templates

/**
 * The value the theme control carries when the template's own palette should be used.
 *
 * A sentinel rather than a separate boolean so the whole control stays one `<select>`: the
 * dropdown is what someone reaches for, and "the one this template was designed in" is just
 * another entry in it.
 */
const OWN = '\u0000own'

/** Shipped themes, plus any named palettes from `--theme`. */
const THEME_OPTIONS: { value: string; label: string }[] = [
  ...EMAIL_THEMES.map((t) => ({ value: t, label: t })),
  ...Object.keys(customThemes).map((name) => ({ value: name, label: `${name} (yours)` })),
]

/** Resolve a theme choice to what `renderEmail` wants. */
function resolveTheme(choice: string, template: (typeof TEMPLATES)[number]) {
  if (choice === OWN && template.theme !== null) return template.theme
  return customThemes[choice] ?? (choice as EmailTheme)
}

/**
 * Approximate the forced dark-mode inversion Gmail and Outlook.com apply.
 *
 * Deliberately crude, and labelled as such in the UI. Those clients invert by heuristics
 * nobody outside them has, so the honest thing a preview can offer is "roughly this much
 * changes", not a faithful reproduction.
 */
const DARK_FILTER = 'filter: invert(1) hue-rotate(180deg); background: #111;'

/**
 * What to say when the directory held nothing.
 *
 * The likeliest reason someone sees this is a mistyped path, so it names the path that was
 * actually searched and the convention a file has to follow — a blank sidebar would send
 * them to the issue tracker instead.
 */
function NoTemplates() {
  return (
    <div className="empty">
      <h1>No templates found</h1>
      <p>
        Nothing in <code>{source ?? '(built-in templates)'}</code> looks like a template.
      </p>
      <p>
        A template is a <code>.tsx</code> or <code>.jsx</code> file whose <b>default export</b> is a
        component. Optional named exports: <code>subject</code> (a string) and{' '}
        <code>previewProps</code> (the props to preview it with). Files matching <code>.test.</code>
        , <code>.spec.</code>, <code>.stories.</code> or a leading <code>_</code> are skipped.
      </p>
    </div>
  )
}

/**
 * Which of the two screens to show.
 *
 * A dispatcher rather than an early return inside `Preview`: the check is cheap and always
 * the same, but a conditional return ahead of the hooks below would break the rule that
 * every render calls the same hooks in the same order.
 */
export function App() {
  return TEMPLATES.length === 0 ? <NoTemplates /> : <Preview />
}

function Preview() {
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0]?.id ?? '')
  /**
   * `OWN` while the template's declared palette should win.
   *
   * It resets to `OWN` on every template change rather than persisting a chosen theme,
   * which is the whole point of the template-level export: with a global dropdown and a
   * per-template design the two can disagree, and a wrong render reads as a styling bug in
   * the template rather than as a wrong dropdown. Switching theme by hand is still allowed
   * — comparing a design against `dark` is worth having — it just is not the default.
   */
  const [themeChoice, setThemeChoice] = useState<string>(OWN)
  const [viewport, setViewport] = useState<number>(600)
  /** `null` renders the email untouched; otherwise the named client's support is simulated. */
  const [clientLabel, setClientLabel] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('preview')
  const [darkModeSimulation, setDarkModeSimulation] = useState(false)

  // Memoised because each is a full render or a full lint of the document, and they run on
  // every keystroke in the toolbar otherwise.
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]!
  // With no declared palette there is nothing for `OWN` to mean, so it falls back to light.
  const effectiveChoice = themeChoice === OWN && template.theme === null ? 'light' : themeChoice

  const result = useMemo(
    () =>
      renderEmail(createElement(template.Component, template.props), {
        theme: resolveTheme(effectiveChoice, template),
        subject: template.subject,
        tier: 'strict',
      }),
    [template, effectiveChoice],
  )

  const shown = useMemo(() => {
    const client = clientFor(clientLabel)
    return client && FEATURES ? simulate(result.html, FEATURES, client) : result.html
  }, [result, clientLabel])

  // The panel has to agree with the project's own lint, or it reports findings CI does not
  // and the preview is the one that looks wrong. `--allow` is the project-wide waiver;
  // a template's `allow` export covers one template.
  const allow = useMemo(() => ({ ...CASCIVO_ALLOW, ...extraAllow, ...template.allow }), [template])

  const findings = useMemo<Finding[]>(
    () => (FEATURES ? lint(result.html, FEATURES, { allow }) : []),
    [result, allow],
  )

  const download = () => {
    // `buildMessage` rather than a hand-rolled envelope: this one is tested, orders the
    // alternatives correctly, encodes a non-ASCII subject, and refuses header injection.
    const eml = buildMessage(result, {
      from: 'preview@cascivo.local',
      to: 'you@example.com',
    })
    const url = URL.createObjectURL(new Blob([eml], { type: 'message/rfc822' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateId}-${effectiveChoice === OWN ? 'own' : effectiveChoice}.eml`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>cascivo email</h1>
        <nav>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === templateId ? 'active' : ''}
              onClick={() => {
                setTemplateId(t.id)
                // Back to the new template's own palette. Carrying the previous choice over
                // is exactly the mismatch the `theme` export exists to prevent.
                setThemeChoice(OWN)
              }}
            >
              {t.name}
            </button>
          ))}
        </nav>

        <section className="panel">
          <h2>Message</h2>
          <dl>
            <dt>Subject</dt>
            <dd className="wrap">{result.subject}</dd>
            <dt>Preheader</dt>
            <dd className="wrap">
              {result.preheader ?? <span className="bad">none — the client will invent one</span>}
            </dd>
          </dl>
        </section>

        <SizeGauge stats={result.stats} html={result.html} />
        <CompatibilityPanel findings={findings} available={FEATURES !== null} />
      </aside>

      <main>
        <header className="toolbar">
          <label>
            Theme
            <select
              value={themeChoice === OWN && template.theme === null ? 'light' : themeChoice}
              onChange={(e) => {
                setThemeChoice(e.currentTarget.value)
              }}
            >
              {template.theme === null ? null : (
                <option value={OWN}>
                  {typeof template.theme === 'string'
                    ? `${template.theme} (this template)`
                    : "this template's own palette"}
                </option>
              )}
              {THEME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Width
            <select
              value={String(viewport)}
              onChange={(e) => {
                setViewport(Number(e.currentTarget.value))
              }}
            >
              {VIEWPORTS.map((v) => (
                <option key={v.width} value={v.width}>
                  {v.label} — {v.width}px
                </option>
              ))}
            </select>
          </label>

          <label>
            Client
            <select
              value={clientLabel ?? ''}
              onChange={(e) => {
                setClientLabel(e.currentTarget.value || null)
              }}
            >
              <option value="">No simulation (as sent)</option>
              {SIMULATED_CLIENTS.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={darkModeSimulation}
              onChange={(e) => {
                setDarkModeSimulation(e.currentTarget.checked)
              }}
            />
            Forced dark
          </label>

          <div className="tabs">
            {(['preview', 'html', 'text'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={t === tab ? 'active' : ''}
                onClick={() => {
                  setTab(t)
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <button type="button" className="download" onClick={download}>
            Download .eml
          </button>
        </header>

        {clientLabel ? (
          <p className="approximation">
            <strong>Approximation.</strong> Declarations {clientLabel} does not support are removed,
            so you can see whether the layout survives without them. This does not reproduce that
            client&rsquo;s own rendering quirks
            {clientLabel.startsWith('Outlook (Windows)')
              ? ' — the Word engine cannot be emulated, and is bought down by construction instead.'
              : '.'}
          </p>
        ) : null}

        <div className="stage">
          {tab === 'preview' ? (
            <iframe
              title="Email preview"
              className="frame"
              style={{ width: `${viewport}px` }}
              srcDoc={
                darkModeSimulation ? shown.replace(/<body/i, `<body style="${DARK_FILTER}"`) : shown
              }
            />
          ) : (
            <pre className="source">{tab === 'html' ? shown : result.text}</pre>
          )}
        </div>
      </main>
    </div>
  )
}
