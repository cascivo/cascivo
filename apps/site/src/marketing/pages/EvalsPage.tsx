import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import {
  dollars,
  type EvalHistoryEntry,
  type EvalLatest,
  headline,
  historyColumns,
  orderArms,
  parseEvals,
  percent,
} from './evals/data'
import evalsJson from '../../../public/evals.json'
import './evals/evals.css'

const REPO = 'https://github.com/cascivo/cascivo'
const TASKS_URL = `${REPO}/tree/main/apps/bench/agent/tasks`
const CLAUDE_CLI_VERSION = '2.1.304'

/** The eight tasks in publication order; the spec's "a changed task gets a new id" keeps this list append-only. */
const TASKS: readonly { id: string; what: string }[] = [
  {
    id: 'admin-console',
    what: 'An overview with KPI figures, a users table and a settings page, with navigation between them.',
  },
  {
    id: 'saas-settings',
    what: 'Profile, billing and notification pages, each reached by navigation.',
  },
  {
    id: 'marketing-site',
    what: 'A hero, features, pricing, testimonials, an FAQ and a footer.',
  },
  {
    id: 'crud-table',
    what: 'A table of projects with search, pagination and a create action.',
  },
  {
    id: 'auth-flow',
    what: 'Sign-in and sign-up forms; signing in leads to a dashboard.',
  },
  {
    id: 'form-validation',
    what: 'A three-field form with an error next to each invalid field and a success message.',
  },
  {
    id: 'delete-confirm',
    what: 'Three projects, each deleted through a confirmation dialog with Cancel and Confirm.',
  },
  {
    id: 'filter-empty-state',
    what: 'A filter that matches nothing shows a message, and a control restores the full list.',
  },
]

const ARMS: readonly { id: string; what: string }[] = [
  {
    id: 'cascivo',
    what: 'The cascivo scaffold with its AI context files (AGENTS.md and CLAUDE.md), plus the 21 read-only tools of the cascivo MCP server.',
  },
  {
    id: 'cascivo-bare',
    what: 'The same scaffold without the AI context files and without MCP. The gap to cascivo is the value of that context.',
  },
  {
    id: 'shadcn',
    what: 'The shadcn 4.22.1 Vite starter with every component added, plus the 3 read-only tools of the shadcn MCP server.',
  },
]

const REPRODUCE = `pnpm install
pnpm build
npm i -g @anthropic-ai/claude-code@${CLAUDE_CLI_VERSION}
pnpm --filter @cascivo/site exec playwright install chromium --with-deps

export ANTHROPIC_API_KEY=…
pnpm --filter bench-agent eval generate --out ./gen --models claude-sonnet-5-5 --attempts 3 --max-usd 20
pnpm --filter bench-agent eval score --in ./gen --out results.json
pnpm --filter bench-agent eval publish --results results.json`

const DRY_RUN = 'pnpm --filter bench-agent eval dry'

export function EvalsPage() {
  return <EvalsView data={evalsJson} />
}

/** The page for a document; split from the route component so a test can hand over a fixture. */
export function EvalsView({ data }: { data: unknown }) {
  const { latest, history } = parseEvals(data)
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main className="evals-page">
          <EvalsHero />
          <HeadlineSection latest={latest} />
          {latest && <TaskTables latest={latest} />}
          <MethodSection />
          <ReproduceSection />
          {history.length > 0 && <HistorySection history={history} />}
          <NoteSection />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}

function EvalsHero() {
  return (
    <section className="proof-hero" aria-label="Agent evals summary">
      <h1>
        Can an agent build a working app with <span className="proof-hero-accent">cascivo</span>?
      </h1>
      <p className="proof-hero-sub">
        A published, re-runnable eval. Claude builds eight small apps with cascivo, with cascivo
        minus its AI context, and with shadcn/ui. Hidden Playwright tests decide pass or fail; no
        model judges the result.
      </p>
    </section>
  )
}

const attemptsLabel = (n: number) => `${n} ${n === 1 ? 'attempt' : 'attempts'}`

function HeadlineSection({ latest }: { latest: EvalLatest | null }) {
  if (!latest) {
    return (
      <section className="section" data-reveal="">
        <h2>Latest run</h2>
        <p className="perf-note">
          No published run yet. The method, the tasks and the steps to run it yourself are below.
        </p>
      </section>
    )
  }
  const arms = orderArms(latest.rows.map((r) => r.arm))
  return (
    <section className="section" data-reveal="">
      <h2>Latest run</h2>
      <p className="section-sub">
        pass@1 is the mean of the attempt outcomes over the tasks, per arm and model. cascivo{' '}
        {latest.cascivoVersion}, run {latest.date}. The runs behind these numbers cost{' '}
        {dollars(latest.costUsd)} in total.
      </p>
      {latest.models.map((m) => (
        <div key={m.model} className="evals-model">
          <h3>
            <code>{m.model}</code>
            <span className="evals-model-meta">
              {' '}
              run {m.date}, {attemptsLabel(m.attempts)} per task and arm
            </span>
          </h3>
          <ul className="evals-headline" aria-label={`pass@1 per arm, ${m.model}`}>
            {arms.map((arm) => {
              const h = headline(latest.rows, m.model, arm)
              return (
                <li key={arm} className="evals-stat" data-headline={`${m.model}:${arm}`}>
                  <span className="evals-stat-arm">{arm}</span>
                  <strong className="evals-stat-value">{h ? percent(h.passAt1) : '—'}</strong>
                  <span className="evals-stat-meta">
                    {h ? `pass@1 over ${attemptsLabel(h.attempts)}` : 'not run'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}

function TaskTables({ latest }: { latest: EvalLatest }) {
  const arms = orderArms(latest.rows.map((r) => r.arm))
  return (
    <section className="section" data-reveal="">
      <h2>Per task</h2>
      <p className="section-sub">
        pass@1 is the share of attempts that passed; pass@3 is whether any of three attempts did.
        Axe counts critical and serious violations, summed over the attempts. Cost is the median per
        session in USD. Axe and cost never affect pass or fail.
      </p>
      {latest.models.map((m) => {
        const rows = latest.rows.filter((r) => r.model === m.model)
        const tasks = [...new Set(rows.map((r) => r.task))]
        return (
          <div key={m.model} className="evals-model">
            <div
              className="pg-scroll"
              role="region"
              aria-label={`Per-task results, ${m.model}`}
              tabIndex={0}
            >
              <table className="perf-table evals-table" data-eval-table={m.model}>
                <caption>
                  <code>{m.model}</code>, per task and arm
                </caption>
                <thead>
                  <tr>
                    <th scope="col" rowSpan={2}>
                      Task
                    </th>
                    {arms.map((arm) => (
                      <th key={arm} scope="colgroup" colSpan={4} className="evals-arm-head">
                        {arm}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {arms.flatMap((arm) => [
                      <th key={`${arm}:1`} scope="col">
                        pass@1
                      </th>,
                      <th key={`${arm}:3`} scope="col">
                        pass@3
                      </th>,
                      <th key={`${arm}:axe`} scope="col">
                        axe
                      </th>,
                      <th key={`${arm}:cost`} scope="col">
                        cost
                      </th>,
                    ])}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task}>
                      <th scope="row">
                        <a href={`${TASKS_URL}/${task}`}>{task}</a>
                      </th>
                      {arms.flatMap((arm) => {
                        const r = rows.find((row) => row.task === task && row.arm === arm)
                        const ran = r !== undefined && r.attempts > 0
                        return [
                          <td key={`${arm}:1`} data-cell={`${arm}:pass1`}>
                            {ran ? percent(r.passAt1) : '—'}
                          </td>,
                          <td key={`${arm}:3`} data-cell={`${arm}:pass3`}>
                            {r?.passAt3 == null ? '—' : r.passAt3 ? 'yes' : 'no'}
                          </td>,
                          <td key={`${arm}:axe`} data-cell={`${arm}:axe`}>
                            {ran ? r.axeSerious : '—'}
                          </td>,
                          <td key={`${arm}:cost`} data-cell={`${arm}:cost`}>
                            {r?.medianCostUsd == null ? '—' : dollars(r.medianCostUsd)}
                          </td>,
                        ]
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {m.attempts < 3 && (
              <p className="perf-note" data-note="few-attempts">
                <code>{m.model}</code> ran {attemptsLabel(m.attempts)} per task and arm, so it
                reports pass@1 only: pass@3 needs three attempts and shows —.
              </p>
            )}
          </div>
        )
      })}
    </section>
  )
}

function MethodSection() {
  return (
    <section className="section" data-reveal="">
      <h2>Method</h2>

      <h3>Arms</h3>
      <dl className="evals-defs">
        {ARMS.map((arm) => (
          <div key={arm.id}>
            <dt>
              <code>{arm.id}</code>
            </dt>
            <dd>{arm.what}</dd>
          </div>
        ))}
      </dl>
      <p className="evals-prose">
        Every arm runs the same <code>claude -p</code> session with only the <code>Read</code> and{' '}
        <code>Edit</code> file tools, confined to its own directory (
        <code>--bare --restricted</code>
        ); no arm has a shell. Each gets the same task text, one sentence naming its design system,
        and the same kind of list of the project&apos;s files. The MCP tools left out are the ones
        that start a process, because the job that holds the API key must not run anything an agent
        chose.
      </p>

      <h3>Tasks</h3>
      <ol className="evals-tasks">
        {TASKS.map((task) => (
          <li key={task.id}>
            <a href={`${TASKS_URL}/${task.id}`}>
              <code>{task.id}</code>
            </a>{' '}
            {task.what}
          </li>
        ))}
      </ol>
      <p className="evals-prose">
        Each folder holds the prompt the agent sees and the hidden <code>EVAL.ts</code>. A published
        task never changes; a changed task gets a new id, so older results stay comparable.
      </p>

      <h3>Scoring</h3>
      <ul className="evals-prose-list">
        <li>
          An attempt passes when <code>vite build</code> succeeds, <code>tsc --noEmit</code> reports
          no errors, and the task&apos;s hidden Playwright <code>EVAL.ts</code> passes against the
          built app served by <code>vite preview</code>.
        </li>
        <li>
          Each attempt gets one status: <code>pass</code>, <code>fail-build</code>,{' '}
          <code>fail-types</code>, <code>fail-eval</code> or <code>infra-error</code>. The first
          that applies wins, in the order <code>infra-error</code>, <code>fail-build</code>,{' '}
          <code>fail-types</code>, <code>fail-eval</code>. An <code>infra-error</code> is a CLI
          crash, a session over the 10-minute timeout, or a harness failure; it counts as a failed
          attempt.
        </li>
        <li>
          <code>EVAL.ts</code> uses role, label and text locators only, never class names, so every
          arm can pass. The agent&apos;s directory never contains it. It is in the repository, so it
          is hidden from the agent, not from you.
        </li>
        <li>
          pass@1, the headline, is the mean of the attempt outcomes. pass@3 is whether at least one
          of three attempts passed.
        </li>
        <li>
          Secondary, and never part of pass or fail: axe violations on the pages the eval visited (
          <code>@axe-core/playwright</code>) and the cost of each session.
        </li>
        <li>
          A run stops starting sessions once its spend reaches the cap, and is then incomplete. A
          run with more than 10% <code>infra-error</code> attempts is invalid. Neither is published.
        </li>
      </ul>

      <h3>Not measured</h3>
      <ul className="evals-prose-list">
        <li>Models other than Claude.</li>
        <li>Quality judged by a model; only the hidden tests decide.</li>
        <li>Multi-turn work, such as an agent extending its own app.</li>
        <li>Visual or screenshot scoring.</li>
        <li>Leaderboards for third parties.</li>
      </ul>
    </section>
  )
}

function ReproduceSection() {
  return (
    <section className="section" data-reveal="">
      <h2>Run it yourself</h2>
      <p className="section-sub">
        Needs Node 22.18 or later (the harness runs TypeScript files directly), Linux or macOS (it
        starts the MCP servers through POSIX <code>env -u</code>), and Claude CLI{' '}
        {CLAUDE_CLI_VERSION}, the version the published runs use. Use a dedicated Anthropic key with
        a low spend limit: <code>generate</code> is the only step that sees it, and the cap is{' '}
        <code>--max-usd</code>.
      </p>
      <div className="pg-scroll" role="region" aria-label="Reproduction commands" tabIndex={0}>
        <pre className="evals-code">
          <code>{REPRODUCE}</code>
        </pre>
      </div>
      <p className="perf-note">
        <code>publish</code> writes the results file, <code>apps/site/public/evals.json</code> and{' '}
        <code>docs/AGENT-BENCHMARKS.md</code>, and refuses an incomplete or invalid run. To check
        the harness with no key and no model, scoring a hand-built canary app per task:
      </p>
      <div className="pg-scroll" role="region" aria-label="Dry run command" tabIndex={0}>
        <pre className="evals-code">
          <code>{DRY_RUN}</code>
        </pre>
      </div>
      <p className="perf-note">
        Source and full notes: <a href={`${REPO}/tree/main/apps/bench/agent`}>apps/bench/agent</a> ·
        workflow: <a href={`${REPO}/blob/main/.github/workflows/evals.yml`}>evals.yml</a>.
      </p>
    </section>
  )
}

function HistorySection({ history }: { history: EvalHistoryEntry[] }) {
  const columns = historyColumns(history)
  return (
    <section className="section" data-reveal="">
      <h2>History</h2>
      <p className="section-sub">pass@1 per arm and model, one row per published run.</p>
      <div className="pg-scroll" role="region" aria-label="pass@1 history" tabIndex={0}>
        <table className="perf-table evals-table" data-eval-history="">
          <caption>pass@1 per run</caption>
          <thead>
            <tr>
              <th scope="col">Run</th>
              <th scope="col">cascivo version</th>
              {columns.map(([model, arm]) => (
                <th key={`${model}:${arm}`} scope="col">
                  <code>{model}</code> {arm}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={`${entry.date}:${entry.cascivoVersion}`}>
                <th scope="row">{entry.date}</th>
                <td>{entry.cascivoVersion}</td>
                {columns.map(([model, arm]) => {
                  const share = entry.passAt1.get(model)?.get(arm)
                  return (
                    <td key={`${model}:${arm}`}>{share === undefined ? '—' : percent(share)}</td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function NoteSection() {
  return (
    <section className="section" data-reveal="">
      <p className="perf-note">
        Only complete, valid runs are published: incomplete and invalid runs are not shown here.
      </p>
    </section>
  )
}
