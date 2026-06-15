'use client'
import { useSignal, useSignals, useSignalEffect } from '@cascivo/core'
import { Button } from '@cascivo/components/button'
import { Input } from '@cascivo/components/input'
import { Checkbox } from '@cascivo/components/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@cascivo/components/card'

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
] as const

type Theme = (typeof THEMES)[number]

function SignupCard() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="theme-demo-form">
          <Input label="Email" placeholder="you@example.com" />
          <Input label="Password" type="password" />
          <Checkbox label="Send me product updates" defaultChecked />
          <Button>Sign up</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ThemeDemo() {
  useSignals()
  const activeIdx = useSignal(0)

  useSignalEffect(() => {
    const id = setInterval(() => {
      activeIdx.value = (activeIdx.value + 1) % THEMES.length
    }, 1200)
    return () => clearInterval(id)
  })

  const activeTheme: Theme = THEMES[activeIdx.value] ?? 'light'

  return (
    <section className="section" data-reveal="">
      <h2>One form, ten personalities</h2>
      <p className="section-sub">
        The exact same markup rendered inside ten <code>data-theme</code> containers. Themes
        override only the semantic token layer — no component changes.
      </p>
      <div className="theme-demo-cycler">
        <div className="theme-demo-pane theme-demo-pane--single" data-theme={activeTheme}>
          <div className="theme-demo-label">{activeTheme}</div>
          <SignupCard />
        </div>
      </div>
      <div className="theme-demo-dots" role="group" aria-label="Select theme">
        {THEMES.map((theme, i) => (
          <button
            key={theme}
            type="button"
            className="theme-demo-dot"
            aria-label={theme}
            aria-pressed={activeIdx.value === i}
            data-state={activeIdx.value === i ? 'active' : undefined}
            onClick={() => {
              activeIdx.value = i
            }}
          />
        ))}
      </div>
    </section>
  )
}
