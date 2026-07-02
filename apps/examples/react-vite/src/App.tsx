import { useSignal, useSignals } from '@cascivo/core'
import { Button, Card, CardContent, CardHeader, CardTitle, Toggle } from '@cascivo/react'

const THEMES = ['light', 'dark', 'warm'] as const
type Theme = (typeof THEMES)[number]

export default function App() {
  // Load-bearing line 2: React apps have no signals compiler transform, so any
  // component that reads `signal.value` during render must call useSignals() first.
  useSignals()

  const theme = useSignal<Theme>('light')
  const notifications = useSignal(true)

  return (
    // Load-bearing line 3: data-theme activates a cascivo theme for this subtree.
    // It works on any element, so themes can be scoped to a single container.
    <main className="app" data-theme={theme.value}>
      <Card className="app-card">
        <CardHeader>
          <CardTitle>Hello cascivo</CardTitle>
        </CardHeader>
        <CardContent className="app-card-content">
          <Toggle
            label="Notifications"
            checked={notifications.value}
            onChange={(checked) => {
              notifications.value = checked
            }}
          />
          <p>Notifications are {notifications.value ? 'on' : 'off'}.</p>
          <Button
            onClick={() => {
              notifications.value = !notifications.value
            }}
          >
            Toggle notifications
          </Button>
        </CardContent>
      </Card>

      <div className="app-themes" role="group" aria-label="Theme">
        {THEMES.map((name) => (
          <Button
            key={name}
            variant={theme.value === name ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              theme.value = name
            }}
          >
            {name}
          </Button>
        ))}
      </div>
    </main>
  )
}
