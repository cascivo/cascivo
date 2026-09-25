/**
 * The page behind `ui://cascivo/view.html`: an MCP App that renders the `show_view` tool's
 * result with the real components, inside the chat client that called it.
 *
 * Built into one self-contained HTML file (scripts/build-app.mjs) — the host loads it into a
 * sandboxed iframe with no network, so every script and style is inlined.
 */
import '@cascivo/themes/light-dark.css'
import { App } from '@modelcontextprotocol/ext-apps'
import { CascivoView, type ViewConfig } from '@cascivo/render'
import { createRoot } from 'react-dom/client'

interface ShowViewResult {
  config?: ViewConfig
  data?: Record<string, unknown>
  errors?: { path: string; message: string }[]
}

const root = createRoot(document.getElementById('root')!)

function show(result: ShowViewResult): void {
  if (result.errors?.length || !result.config) {
    root.render(
      <ul>
        {(result.errors ?? []).map((e) => (
          <li key={e.path}>
            <code>{e.path}</code> {e.message}
          </li>
        ))}
      </ul>,
    )
    return
  }
  root.render(
    <CascivoView config={result.config} {...(result.data ? { data: result.data } : {})} />,
  )
}

function applyTheme(theme: string | undefined): void {
  document.documentElement.dataset['theme'] = theme === 'dark' ? 'dark' : 'light'
}

const app = new App({ name: 'cascivo view', version: '1.0.0' })
app.ontoolresult = (result) => {
  show((result.structuredContent ?? {}) as ShowViewResult)
}
app.onhostcontextchanged = (context) => applyTheme(context.theme)
await app.connect()
applyTheme(app.getHostContext()?.theme)
