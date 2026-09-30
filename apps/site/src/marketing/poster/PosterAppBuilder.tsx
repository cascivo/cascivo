import { Suspense, lazy } from 'react'
import { CodeSnippet } from '@cascivo/components/code-snippet'
import { useComputed, useSignal, useSignals } from '@cascivo/core'
import data from '../app-builder.json'
import { PREVIEWABLE } from './ship'

type Example = (typeof data.examples)[number]
type AuthChoice = 'none' | 'email' | 'access'

const GROUPS = ['Realtime', 'AI', 'Data', 'Operations'] as const

const PRESETS: { label: string; examples: string[]; auth: AuthChoice }[] = [
  { label: 'Realtime SaaS', examples: ['board', 'live'], auth: 'email' },
  { label: 'AI product', examples: ['agent', 'search', 'voice'], auth: 'email' },
  { label: 'Internal tool', examples: ['crud', 'import', 'export'], auth: 'access' },
  { label: 'Publishing', examples: ['publish', 'digest', 'usage'], auth: 'none' },
]

/** How a service runs in vite dev, in words. */
const LOCAL_LABEL = new Map([
  ['simulated', 'runs locally'],
  ['stand-in', 'stand-in locally'],
  ['account', 'needs an account'],
])

const SERVICES = new Map(Object.entries(data.services))

const byId = new Map(data.examples.map((e) => [e.id, e]))

/**
 * The live Worker's room (apps/live), set at build time once it is deployed:
 * `VITE_CASCIVO_LIVE_URL=wss://…/room`. Unset, the section has no live strip at all.
 */
const LIVE_URL = import.meta.env.VITE_CASCIVO_LIVE_URL
const PosterLiveStrip = lazy(() =>
  import('./PosterLiveStrip').then((m) => ({ default: m.PosterLiveStrip })),
)

/** Files grouped under their folder, for the tree. */
function tree(files: string[]): string {
  const folders = new Map<string, string[]>()
  for (const file of files) {
    const cut = file.lastIndexOf('/')
    const folder = cut === -1 ? '' : file.slice(0, cut + 1)
    folders.set(folder, [...(folders.get(folder) ?? []), file.slice(cut + 1)])
  }
  return [...folders.keys()]
    .sort()
    .map((folder) =>
      folder
        ? `${folder}\n${folders
            .get(folder)!
            .map((name) => `  ${name}`)
            .join('\n')}`
        : folders.get(folder)!.join('\n'),
    )
    .join('\n')
}

/**
 * The app builder: pick what the app does, and see the one command that scaffolds it, the
 * pages, the Cloudflare services it binds and the files it writes. Everything shown is
 * generated from the CLI itself (scripts/site/app-builder.ts), so it cannot promise what
 * `cascivo create` does not do.
 */
export function PosterAppBuilder() {
  useSignals()
  const chosen = useSignal<readonly string[]>(PRESETS[0]!.examples)
  const auth = useSignal<AuthChoice>(PRESETS[0]!.auth)

  /** What was picked, plus what it brings along (the digest brings the report page). */
  const included = useComputed(() => {
    const ids = new Set(chosen.value)
    for (const id of chosen.value)
      for (const brought of byId.get(id)?.brings ?? []) ids.add(brought)
    return data.examples.filter((e) => ids.has(e.id))
  })
  const plan = useComputed(() => {
    const parts: { files: string[]; pages: string[]; services: string[]; react: boolean }[] = [
      ...included.value,
      ...data.auth.filter((a) => a.id === auth.value),
    ]
    const unique = (list: string[]) => [...new Set(list)]
    const services = unique(parts.flatMap((p) => p.services))
    const picked = data.examples.filter((e) => chosen.value.includes(e.id)).map((e) => e.id)
    const command = [
      'npx cascivo create acme --framework cloudflare',
      ...(picked.length > 0 ? [`--example ${picked.join(',')}`] : []),
      ...(auth.value !== 'none' ? [`--auth ${auth.value}`] : []),
    ].join(' ')
    return {
      command,
      files: unique(parts.flatMap((p) => p.files)).sort(),
      pages: unique(parts.flatMap((p) => p.pages)).sort(),
      services,
      react: parts.some((p) => p.react),
      previewable: services.every((s) => PREVIEWABLE.has(s)),
      standIns: services.filter((s) => SERVICES.get(s)?.local === 'stand-in'),
    }
  })

  const toggle = (example: Example, on: boolean) => {
    chosen.value = on
      ? [...chosen.value, example.id]
      : chosen.value.filter((id) => id !== example.id)
  }
  const broughtBy = (id: string) =>
    included.value.find((e) => e.brings.includes(id) && chosen.value.includes(e.id))
  const p = plan.value
  const serviceName = (id: string) => SERVICES.get(id)

  return (
    <section className="pg-section" id="ship" aria-label="Ship an app">
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">Then ship the whole app</h2>
        <p className="pg-eyebrow">09 / on cloudflare</p>
      </div>
      <div className="pg-cols pg-cols--5-7">
        <div className="pg-pad pg-builder-picks">
          <div className="pg-builder-presets" role="group" aria-label="Start from">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="pg-btn pg-btn--quiet pg-btn--mono"
                onClick={() => {
                  chosen.value = preset.examples
                  auth.value = preset.auth
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {GROUPS.map((group) => (
            <fieldset key={group} className="pg-builder-group">
              <legend className="pg-eyebrow">{group}</legend>
              {data.examples
                .filter((e) => e.group === group)
                .map((example) => {
                  const bringer = broughtBy(example.id)
                  const checked = chosen.value.includes(example.id) || Boolean(bringer)
                  return (
                    <label key={example.id} className="pg-builder-option" title={example.blurb}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={Boolean(bringer) && !chosen.value.includes(example.id)}
                        onChange={(event) => toggle(example, event.currentTarget.checked)}
                      />
                      <span className="pg-builder-option-label">{example.label}</span>
                      <span className="pg-builder-option-blurb">
                        {bringer ? `Comes with ${bringer.label}.` : example.blurb}
                      </span>
                    </label>
                  )
                })}
            </fieldset>
          ))}
          <fieldset className="pg-builder-group">
            <legend className="pg-eyebrow">Who can sign in</legend>
            {(
              [
                { id: 'none', label: 'Anyone', blurb: 'No accounts.' },
                ...data.auth.map((a) => ({
                  id: a.id as AuthChoice,
                  label: a.label,
                  blurb: a.blurb,
                })),
              ] as const
            ).map((option) => (
              <label key={option.id} className="pg-builder-option">
                <input
                  type="radio"
                  name="builder-auth"
                  checked={auth.value === option.id}
                  onChange={() => {
                    auth.value = option.id
                  }}
                />
                <span className="pg-builder-option-label">{option.label}</span>
                <span className="pg-builder-option-blurb">{option.blurb}</span>
              </label>
            ))}
          </fieldset>
        </div>

        <div className="pg-pad pg-builder-result">
          <div className="pg-builder-sticky">
            <p className="pg-lede">
              The same components, as a full-stack app on Cloudflare: one command writes the pages,
              the API and the Worker, and <code>vite dev</code> runs all of it offline.
            </p>
            <CodeSnippet variant="multi" language="bash" code={p.command} />
            {/* Announced on each change: the counts, not the whole file tree. */}
            <dl className="pg-builder-stats" aria-live="polite">
              <div>
                <dt>pages added</dt>
                <dd>{p.pages.length}</dd>
              </div>
              <div>
                <dt>cloudflare services</dt>
                <dd>{p.services.length}</dd>
              </div>
              <div>
                <dt>files written</dt>
                <dd>{p.files.length}</dd>
              </div>
            </dl>
            {p.services.length > 0 ? (
              <ul className="pg-builder-services" aria-label="Cloudflare services">
                {p.services.map((id) => {
                  const service = serviceName(id)
                  return service ? (
                    <li key={id} className="pg-chip" data-local={service.local}>
                      {service.name}
                      <span className="pg-builder-local">{LOCAL_LABEL.get(service.local)}</span>
                    </li>
                  ) : null
                })}
              </ul>
            ) : null}
            {p.pages.length > 0 ? (
              <p className="pg-note">
                Pages: <span className="pg-mono">{p.pages.join('  ')}</span>
              </p>
            ) : null}
            {p.files.length > 0 ? (
              <pre className="pg-pre pg-pre--tight pg-builder-tree" aria-label="Files written">
                {tree(p.files)}
              </pre>
            ) : null}
            <ul className="pg-builder-facts">
              <li>
                {p.react
                  ? 'Runs on React: the assistant uses React 19 hooks.'
                  : 'Runs on Preact: about a third of the JavaScript React needs.'}
              </li>
              <li>
                {p.standIns.length > 0
                  ? `${p.standIns.map((s) => serviceName(s)?.name).join(' and ')} ${p.standIns.length > 1 ? 'run' : 'runs'} on labelled stand-ins in vite dev, and for real once deployed.`
                  : 'Every service runs in vite dev, in the same runtime as production.'}
              </li>
              <li>
                {p.previewable
                  ? 'Deploys with no account: npm run deploy:preview gives a public URL for an hour.'
                  : 'Needs a Cloudflare account to deploy: a temporary one only has Workers, KV, D1 and Durable Objects.'}
              </li>
            </ul>
          </div>
        </div>
      </div>
      {LIVE_URL ? (
        <Suspense fallback={null}>
          <PosterLiveStrip url={LIVE_URL} />
        </Suspense>
      ) : null}
    </section>
  )
}
