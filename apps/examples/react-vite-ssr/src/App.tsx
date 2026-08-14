// Themes only — tokens, the reset floor, base typography, light and dark.
//
// Component CSS is deliberately NOT imported: @cascivo/react ships a `.css`
// side-effect import beside every component chunk, so the client build pulls in
// exactly the stylesheets the components below need and tree-shakes the rest.
// Vite emits them as one render-blocking <link> in the generated index.html, which
// is what styles the server-rendered first paint. Importing the aggregate
// '@cascivo/react/styles.css' on top of this replaces ~3 KB of used component CSS
// with all 197 components' worth (measured: 357 KB → 29 KB when dropped).
import '@cascivo/themes/light-dark.css'
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
