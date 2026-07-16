// Load-bearing: importing the aggregate stylesheet + a theme once. On SSR with
// `ssr.noExternal` (the cascivoSsr() plugin), Vite processes these CSS imports
// during the server build instead of leaving them for the raw Node loader.
import '@cascivo/react/styles.css'
import '@cascivo/themes/all'
import { Button, Card, CardContent, CardHeader, CardTitle, Menubar } from '@cascivo/react'
import './app.css'

const MENUS = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new', label: 'New' },
      { id: 'open', label: 'Open' },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'undo', label: 'Undo' },
      { id: 'redo', label: 'Redo' },
    ],
  },
]

export function App() {
  return (
    // data-theme activates a cascivo theme for this subtree — works on any element.
    <main className="app" data-theme="light">
      <Menubar menus={MENUS} aria-label="Main" />
      <Card className="app-card">
        <CardHeader>
          <CardTitle>Server-rendered cascivo</CardTitle>
        </CardHeader>
        <CardContent className="app-card-content">
          <p>This page was produced by `renderToString` on the server.</p>
          <Button>Get started</Button>
        </CardContent>
      </Card>
    </main>
  )
}
