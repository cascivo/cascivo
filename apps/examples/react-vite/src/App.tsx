import { useControllableSignal, useSignals } from '@cascivo/core'
import { Button, Card, CardContent, CardHeader, CardTitle, Toggle } from '@cascivo/react'

const THEMES = ['light', 'dark', 'warm'] as const
type Theme = (typeof THEMES)[number]

export default function App() {
  // Load-bearing line 2: React apps have no signals compiler transform, so any
  // component that reads `signal.value` during render must call useSignals() first.
  useSignals()

  // Writes go through a setter, not `signal.value = …`: the React Compiler refuses to compile a
  // component that assigns to a value returned from a hook. test:compiler runs this app under
  // the compiler to keep that true.
  const [theme, setTheme] = useControllableSignal<Theme>({ defaultValue: 'light' })
  const [notifications, setNotifications] = useControllableSignal({ defaultValue: true })

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
            onValueChange={setNotifications}
          />
          <p>Notifications are {notifications.value ? 'on' : 'off'}.</p>
          <Button
            onClick={() => {
              setNotifications(!notifications.value)
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
              setTheme(name)
            }}
          >
            {name}
          </Button>
        ))}
      </div>
    </main>
  )
}
