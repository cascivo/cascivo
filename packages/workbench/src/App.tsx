/**
 * The workbench: a sidebar of entries, a stage, and the panels that read the manifest.
 *
 * Entries render into this page, not an iframe: unlike an email, a component is meant to live
 * in an app's cascade, and the themes are `data-theme` on any element, so the stage carries
 * the theme and the chrome's own styles stay under a `wb-` prefix that no component uses.
 *
 * Plain React state, as in `@cascivo/email-preview`: the signals rule governs cascivo
 * components, not a dev tool's chrome, and depending on `@cascivo/core` would tie this tool's
 * releases to the runtime's.
 */
import {
  cloneElement,
  Component,
  createElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { components as found, previews, source } from 'virtual:cascivo-workbench-entries'
import { missing } from 'virtual:cascivo-workbench-styles'
import { elementToMarkdown } from 'virtual:cascivo-workbench-text'
import { agentContext, controlsFor, parseManifest, THEMES, VIEWPORTS } from './model.ts'
import type { Control, Manifest } from './model.ts'

/**
 * `?embed` renders the stage alone, in `?theme=`: the page a test or an axe sweep opens, so
 * what it checks is the entry and nothing of the workbench's own chrome.
 */
const params = new URLSearchParams(location.search)
const EMBED = params.has('embed')
const INITIAL_THEME = params.get('theme') ?? 'light'

type Tab = 'code' | 'props' | 'controls' | 'tokens' | 'markdown'
const TABS: Tab[] = ['code', 'props', 'controls', 'tokens', 'markdown']

const components = found
  .flatMap((c) => {
    const meta = parseManifest(c.meta)
    return meta ? [{ ...c, meta }] : []
  })
  .sort((a, b) => a.meta.name.localeCompare(b.meta.name, 'en', { sensitivity: 'base' }))

type Selection =
  | { kind: 'component'; id: string; example: number }
  | { kind: 'preview'; id: string }

/** `#component/<id>/<n>` or `#preview/<id>`, so every entry has a URL a test can open. */
function fromHash(hash: string): Selection | null {
  const [kind, ...rest] = decodeURIComponent(hash.replace(/^#/, '')).split('/')
  if (kind === 'component' && rest.length >= 2) {
    const example = Number(rest.at(-1))
    const id = rest.slice(0, -1).join('/')
    if (Number.isInteger(example) && components.some((c) => c.id === id)) {
      return { kind, id, example }
    }
  }
  if (kind === 'preview' && previews.some((p) => p.id === rest.join('/'))) {
    return { kind, id: rest.join('/') }
  }
  return null
}

function toHash(selection: Selection): string {
  return selection.kind === 'component'
    ? `#component/${selection.id}/${selection.example}`
    : `#preview/${selection.id}`
}

function initial(): Selection | null {
  const first = components[0]
  if (first) return { kind: 'component', id: first.id, example: 0 }
  const page = previews[0]
  return page ? { kind: 'preview', id: page.id } : null
}

/** One entry failing to render is that entry's problem, not the workbench's. */
class Boundary extends Component<
  { children: ReactNode; unresolved?: string[] | undefined },
  { error: Error | null }
> {
  override state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  override render() {
    if (!this.state.error) return this.props.children
    // Missing code from the host app (a free identifier, a component nobody copied) is the
    // example's nature, not a bug; `cascivo-workbench test` skips those and fails the rest.
    const needsHost =
      (this.props.unresolved?.length ?? 0) > 0 || this.state.error.name === 'ReferenceError'
    return (
      <div className="wb-error" role="alert" data-needs-host={needsHost}>
        <strong>This entry did not render.</strong>
        <p>
          {this.props.unresolved?.length
            ? `It uses ${this.props.unresolved.join(', ')}, which none of the copied components export.`
            : this.state.error.message}
        </p>
        <p>
          An example that uses state or a component you have not copied needs code from your app:
          write a <code>*.preview.tsx</code> for it instead.
        </p>
      </div>
    )
  }
}

/**
 * Runs the example inside the boundary, so a free identifier in it is caught there. Control
 * values are applied to the element the example returns, which is the component itself.
 */
function Example({
  render,
  overrides,
}: {
  render: () => unknown
  overrides: Record<string, unknown>
}) {
  const element = render()
  if (isValidElement(element) && Object.keys(overrides).length > 0) {
    return cloneElement(element, overrides)
  }
  return element as ReactNode
}

export function App() {
  const [selection, setSelection] = useState<Selection | null>(
    () => fromHash(location.hash) ?? initial(),
  )
  const [theme, setTheme] = useState<string>(INITIAL_THEME)
  const [width, setWidth] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('code')
  const [copied, setCopied] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, unknown>>({})
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sync = () => {
      const next = fromHash(location.hash)
      if (next) {
        setSelection(next)
        setOverrides({})
      }
    }
    addEventListener('hashchange', sync)
    return () => removeEventListener('hashchange', sync)
  }, [])

  const select = (next: Selection) => {
    history.replaceState(null, '', toHash(next))
    setSelection(next)
    setCopied(false)
    setOverrides({})
  }

  const component =
    selection?.kind === 'component' ? components.find((c) => c.id === selection.id) : undefined
  const preview =
    selection?.kind === 'preview' ? previews.find((p) => p.id === selection.id) : undefined
  const exampleIndex = selection?.kind === 'component' ? selection.example : 0
  const example = component?.meta.examples[exampleIndex]
  const render = component?.render[exampleIndex]

  let content: ReactNode = null
  if (render) content = <Example render={render} overrides={overrides} />
  else if (example) {
    content = (
      <p>
        This example is a snippet to read, not one JSX expression to render: see its code below.
      </p>
    )
  } else if (preview) content = createElement(preview.Component, preview.props)

  const stageView = (
    <div
      ref={stage}
      className="wb-stage"
      data-theme={theme}
      data-testid="stage"
      data-hash={selection ? toHash(selection) : ''}
      data-entry={example && !render ? 'snippet' : content === null ? 'empty' : 'rendered'}
      style={width === null ? undefined : { inlineSize: `${width}px` }}
    >
      {content === null ? (
        <p>
          Nothing selected. Copy a component with <code>npx cascivo add</code>.
        </p>
      ) : (
        <Boundary
          key={`${selection?.kind}:${selection?.id}:${exampleIndex}`}
          unresolved={component?.unresolved[exampleIndex]}
        >
          {content}
        </Boundary>
      )}
    </div>
  )

  if (EMBED) return <div className="wb-embed">{stageView}</div>

  return (
    <div className="wb">
      <nav className="wb-sidebar" aria-label="Entries">
        <p className="wb-source" title={source}>
          {components.length} components · {previews.length} previews
        </p>
        {components.map((c) => (
          <details key={c.id} open={c.id === component?.id}>
            <summary>{c.meta.name}</summary>
            <ul>
              {c.meta.examples.map((ex, i) => (
                <li key={i}>
                  <a
                    href={toHash({ kind: 'component', id: c.id, example: i })}
                    aria-current={c.id === component?.id && i === exampleIndex ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      select({ kind: 'component', id: c.id, example: i })
                    }}
                  >
                    {ex.title}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ))}
        {previews.length > 0 && <h2>Previews</h2>}
        <ul>
          {previews.map((p) => (
            <li key={p.id}>
              <a
                href={toHash({ kind: 'preview', id: p.id })}
                aria-current={p.id === preview?.id ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  select({ kind: 'preview', id: p.id })
                }}
              >
                {p.id}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main className="wb-main">
        <div className="wb-toolbar">
          <label>
            Theme{' '}
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              {THEMES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Width{' '}
            <select
              value={width ?? ''}
              onChange={(e) => setWidth(e.target.value === '' ? null : Number(e.target.value))}
            >
              {VIEWPORTS.map((v) => (
                <option key={v.label} value={v.width ?? ''}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          {component && (
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard
                  .writeText(agentContext(component.meta, exampleIndex))
                  .then(() => setCopied(true))
              }}
            >
              {copied ? 'Copied' : 'Copy as agent context'}
            </button>
          )}
        </div>

        {missing.length > 0 && (
          <p className="wb-warning" role="status">
            Not installed in this project: {missing.join(', ')}. Components render unstyled; run{' '}
            <code>npx cascivo init</code>.
          </p>
        )}

        <div className="wb-canvas">{stageView}</div>

        {component && example && (
          <section className="wb-panels" aria-label="Manifest">
            <div role="tablist">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {tab === 'code' && (
              <div role="tabpanel">
                {example.description && <p>{example.description}</p>}
                <pre>
                  <code>{example.code}</code>
                </pre>
              </div>
            )}
            {tab === 'props' && <PropsTable meta={component.meta} />}
            {tab === 'controls' && (
              <Controls
                controls={controlsFor(component.meta.props)}
                values={overrides}
                onChange={setOverrides}
                disabled={!render}
              />
            )}
            {tab === 'tokens' && <Tokens meta={component.meta} stage={stage} theme={theme} />}
            {tab === 'markdown' && (
              <MarkdownPanel stage={stage} entry={JSON.stringify([selection, overrides, theme])} />
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function PropsTable({ meta }: { meta: Manifest }) {
  return (
    <div role="tabpanel">
      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {meta.props.map((p) => (
            <tr key={p.name}>
              <td>
                <code>{p.name}</code>
                {p.required ? ' *' : ''}
              </td>
              <td>
                <code>{p.type}</code>
              </td>
              <td>{p.default ?? '—'}</td>
              <td>{p.description ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The custom properties the component reads, resolved on the stage in the current theme. */
function Tokens({
  meta,
  stage,
  theme,
}: {
  meta: Manifest
  stage: { current: HTMLElement | null }
  theme: string
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const style = getComputedStyle(el)
    setValues(Object.fromEntries(meta.tokens.map((t) => [t, style.getPropertyValue(t).trim()])))
  }, [meta, stage, theme])
  return (
    <div role="tabpanel">
      <table>
        <tbody>
          {meta.tokens.map((t) => (
            <tr key={t}>
              <td>
                <code>{t}</code>
              </td>
              <td>{values[t] ? <code>{values[t]}</code> : <em>set by the component</em>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Edit the example's simple props; a cleared control falls back to what the example sets. */
function Controls({
  controls,
  values,
  onChange,
  disabled,
}: {
  controls: Control[]
  values: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  disabled: boolean
}) {
  if (disabled) return <div role="tabpanel">A snippet has no element to control.</div>
  if (controls.length === 0) {
    return <div role="tabpanel">No prop of this component has a type a control can edit.</div>
  }
  const set = (name: string, value: unknown) => {
    const next = { ...values }
    if (value === undefined) delete next[name]
    else next[name] = value
    onChange(next)
  }
  return (
    <div role="tabpanel" className="wb-controls">
      {controls.map((c) => (
        <label key={c.name}>
          <code>{c.name}</code>
          {c.kind === 'select' && (
            <select
              value={typeof values[c.name] === 'string' ? (values[c.name] as string) : ''}
              onChange={(e) => set(c.name, e.target.value === '' ? undefined : e.target.value)}
            >
              <option value="">(as in the example)</option>
              {c.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          )}
          {c.kind === 'boolean' && (
            <select
              value={values[c.name] === undefined ? '' : String(values[c.name])}
              onChange={(e) =>
                set(c.name, e.target.value === '' ? undefined : e.target.value === 'true')
              }
            >
              <option value="">(as in the example)</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          )}
          {(c.kind === 'text' || c.kind === 'number') && (
            <input
              type={c.kind}
              value={values[c.name] === undefined ? '' : String(values[c.name])}
              placeholder="(as in the example)"
              onChange={(e) => {
                const raw = e.target.value
                set(c.name, raw === '' ? undefined : c.kind === 'number' ? Number(raw) : raw)
              }}
            />
          )}
        </label>
      ))}
      <button type="button" onClick={() => onChange({})}>
        Reset
      </button>
    </div>
  )
}

/**
 * The stage as Markdown, through `@cascivo/text`'s `elementToMarkdown`: what an agent reading
 * the rendered component would get (machine mode), including the current state of controls.
 */
function MarkdownPanel({
  stage,
  entry,
}: {
  stage: { current: HTMLElement | null }
  /** Changes whenever what is on the stage does, so the Markdown is re-read. */
  entry: string
}) {
  const [markdown, setMarkdown] = useState('')
  useEffect(() => {
    if (!elementToMarkdown || !stage.current) return
    setMarkdown(elementToMarkdown(stage.current))
  }, [stage, entry])
  if (!elementToMarkdown) {
    return (
      <div role="tabpanel">
        Install <code>@cascivo/text</code> in this project to see the entry as Markdown.
      </div>
    )
  }
  return (
    <div role="tabpanel">
      <pre>
        <code>{markdown}</code>
      </pre>
    </div>
  )
}
