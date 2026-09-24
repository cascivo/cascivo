import { useSignalState } from '@cascivo/core'
import { Button, Card, CardContent, CardHeader, CardTitle, Toggle } from '@cascivo/react'

const THEMES = ['light', 'dark', 'warm'] as const
type Theme = (typeof THEMES)[number]

export default function App() {
  // Load-bearing line 2: hold state with useSignalState and write through its setter. The
  // hook subscribes this component (no useSignals() needed), and the setter — unlike
  // `signal.value = …` — compiles under the React Compiler; test:compiler keeps that true.
  const [theme, setTheme] = useSignalState<Theme>('light')
  const [notifications, setNotifications] = useSignalState(true)

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
