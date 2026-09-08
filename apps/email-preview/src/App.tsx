/**
 * The email preview.
 *
 * One structural rule dominates the design: **the email renders inside an `<iframe srcdoc>`,
 * never into this page**. cascivo's own stylesheet uses `@layer` and would otherwise cascade
 * into the preview and make it lie about what a client will show. The iframe is also the
 * exact fixture the visual tests drive, so what CI screenshots and what a developer sees
 * here cannot drift apart.
 */
import { useComputed, useSignals } from '@cascivo/core'
import {
  CASCIVO_ALLOW,
  EMAIL_THEMES,
  indexFeatures,
  lint,
  PasswordReset,
  Receipt,
  renderEmail,
  simulate,
  SIMULATED_CLIENTS,
  Welcome,
  type CanIEmailData,
  type EmailTheme,
} from '@cascivo/email'
import type { ReactElement } from 'react'
import caniemail from '../../../scripts/email/vendor/caniemail.json'
import { CompatibilityPanel } from './CompatibilityPanel.tsx'
import { SizeGauge } from './SizeGauge.tsx'
import {
  clientFor,
  clientLabel,
  darkModeSimulation,
  tab,
  templateId,
  theme,
  viewport,
  VIEWPORTS,
} from './state.ts'

const FEATURES = indexFeatures(caniemail as unknown as CanIEmailData)

const TEMPLATES: { id: string; name: string; element: () => ReactElement }[] = [
  { id: 'welcome', name: 'Welcome', element: () => <Welcome /> },
  { id: 'password-reset', name: 'Password reset', element: () => <PasswordReset /> },
  { id: 'receipt', name: 'Receipt', element: () => <Receipt /> },
]

/**
 * Approximate the forced dark-mode inversion Gmail and Outlook.com apply.
 *
 * Deliberately crude, and labelled as such in the UI. Those clients invert by heuristics
 * nobody outside them has, so the honest thing a preview can offer is "roughly this much
 * changes", not a faithful reproduction.
 */
const DARK_FILTER = 'filter: invert(1) hue-rotate(180deg); background: #111;'

export function App() {
  useSignals()

  const result = useComputed(() => {
    const template = TEMPLATES.find((t) => t.id === templateId.value) ?? TEMPLATES[0]!
    return renderEmail(template.element(), { theme: theme.value, tier: 'strict' })
  })

  const shown = useComputed(() => {
    const client = clientFor(clientLabel.value)
    return client ? simulate(result.value.html, FEATURES, client) : result.value.html
  })

  const findings = useComputed(() => lint(result.value.html, FEATURES, { allow: CASCIVO_ALLOW }))

  const download = () => {
    const { html, text } = result.value
    const boundary = `cascivo-${Date.now().toString(36)}`
    const eml = [
      'MIME-Version: 1.0',
      `Subject: ${templateId.value} (${theme.value})`,
      'From: preview@cascivo.local',
      'To: you@example.com',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      '',
      text,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      html,
      '',
      `--${boundary}--`,
      '',
    ].join('\r\n')

    const url = URL.createObjectURL(new Blob([eml], { type: 'message/rfc822' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateId.value}-${theme.value}.eml`
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
              className={t.id === templateId.value ? 'active' : ''}
              onClick={() => {
                templateId.value = t.id
              }}
            >
              {t.name}
            </button>
          ))}
        </nav>

        <SizeGauge stats={result.value.stats} />
        <CompatibilityPanel findings={findings.value} />
      </aside>

      <main>
        <header className="toolbar">
          <label>
            Theme
            <select
              value={theme.value}
              onChange={(e) => {
                theme.value = e.currentTarget.value as EmailTheme
              }}
            >
              {EMAIL_THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label>
            Width
            <select
              value={String(viewport.value)}
              onChange={(e) => {
                viewport.value = Number(e.currentTarget.value)
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
              value={clientLabel.value ?? ''}
              onChange={(e) => {
                clientLabel.value = e.currentTarget.value || null
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
              checked={darkModeSimulation.value}
              onChange={(e) => {
                darkModeSimulation.value = e.currentTarget.checked
              }}
            />
            Forced dark
          </label>

          <div className="tabs">
            {(['preview', 'html', 'text'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={t === tab.value ? 'active' : ''}
                onClick={() => {
                  tab.value = t
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

        {clientLabel.value ? (
          <p className="approximation">
            <strong>Approximation.</strong> Declarations {clientLabel.value} does not support are
            removed, so you can see whether the layout survives without them. This does not
            reproduce that client&rsquo;s own rendering quirks
            {clientLabel.value.startsWith('Outlook (Windows)')
              ? ' — the Word engine cannot be emulated, and is bought down by construction instead.'
              : '.'}
          </p>
        ) : null}

        <div className="stage">
          {tab.value === 'preview' ? (
            <iframe
              title="Email preview"
              className="frame"
              style={{ width: `${viewport.value}px` }}
              srcDoc={
                darkModeSimulation.value
                  ? shown.value.replace(/<body/i, `<body style="${DARK_FILTER}"`)
                  : shown.value
              }
            />
          ) : (
            <pre className="source">{tab.value === 'html' ? shown.value : result.value.text}</pre>
          )}
        </div>
      </main>
    </div>
  )
}
