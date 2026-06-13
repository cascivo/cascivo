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
  return (
    <section className="section" data-reveal="">
      <h2>One form, ten personalities</h2>
      <p className="section-sub">
        The exact same markup rendered inside ten <code>data-theme</code> containers. Themes
        override only the semantic token layer — no component changes.
      </p>
      <div className="theme-demo-grid">
        {THEMES.map((theme) => (
          <div key={theme} className="theme-demo-pane" data-theme={theme}>
            <div className="theme-demo-label">{theme}</div>
            <SignupCard />
          </div>
        ))}
      </div>
    </section>
  )
}
