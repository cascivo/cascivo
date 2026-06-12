'use client'
import { Profiler, useState, type ReactNode } from 'react'
import { useSignal, useSignals } from '@cascade-ui/core'
import { Badge } from '@cascade-ui/components/badge'
import { Button } from '@cascade-ui/components/button'
import { Card } from '@cascade-ui/components/card'
import { Checkbox } from '@cascade-ui/components/checkbox'
import { Input } from '@cascade-ui/components/input'

/* The useState twin below is the comparison subject — the one sanctioned hook
   exception on this page (v7 master plan, decision 9). */

function Counter({
  id,
  children,
  onCommit,
}: {
  id: string
  children: ReactNode
  onCommit: () => void
}) {
  return (
    <Profiler id={id} onRender={onCommit}>
      {children}
    </Profiler>
  )
}

function SignalForm() {
  useSignals()
  const name = useSignal('')
  const email = useSignal('')
  const newsletter = useSignal(false)
  return (
    <form className="twin-form" aria-label="cascade form">
      <Input
        label="Name"
        value={name.value}
        onChange={(e) => {
          name.value = e.currentTarget.value
        }}
      />
      <Input
        label="Email"
        value={email.value}
        onChange={(e) => {
          email.value = e.currentTarget.value
        }}
      />
      <Checkbox
        label="Subscribe to changelog"
        checked={newsletter.value}
        onChange={() => {
          newsletter.value = !newsletter.value
        }}
      />
      <Button type="button">Save</Button>
    </form>
  )
}

function StateForm() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [name, setName] = useState('')
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [email, setEmail] = useState('')
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [newsletter, setNewsletter] = useState(false)
  return (
    <form className="twin-form" aria-label="useState form">
      <Input label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
      <Input label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
      <Checkbox
        label="Subscribe to changelog"
        checked={newsletter}
        onChange={() => setNewsletter(!newsletter)}
      />
      <Button type="button">Save</Button>
    </form>
  )
}

type BenchResults = {
  meta: { date: string; cpu: string }
  renders?: Record<string, Record<string, number>>
}

const benchModules = import.meta.glob<{ default: BenchResults }>(
  '../../../bench/results/results.json',
  { eager: true },
)
const bench = Object.values(benchModules)[0]?.default

export function SignalsDemo() {
  useSignals()
  const signalCommits = useSignal(0)
  const stateCommits = useSignal(0)

  const renderingData = bench?.renders?.['type-20-chars']

  return (
    <section className="signals" id="signals" data-reveal="">
      <h2>Count the re-renders</h2>
      <p className="signals-sub">
        The same form, twice. Left: cascade signals. Right: the usual useState wiring. Type in both
        — the counters are live React Profiler commits, on this page, right now. Open DevTools and
        count along.
      </p>
      <div className="signals-grid">
        <Card padding="md">
          <header className="twin-head">
            <span>signals</span>
            <Badge variant="outline">
              <span className="twin-count">{signalCommits.value}</span> commits
            </Badge>
          </header>
          <Counter
            id="signal-form"
            onCommit={() => {
              signalCommits.value++
            }}
          >
            <SignalForm />
          </Counter>
        </Card>
        <Card padding="md">
          <header className="twin-head">
            <span>useState</span>
            <Badge variant="outline">
              <span className="twin-count">{stateCommits.value}</span> commits
            </Badge>
          </header>
          <Counter
            id="state-form"
            onCommit={() => {
              stateCommits.value++
            }}
          >
            <StateForm />
          </Counter>
        </Card>
      </div>
      <p className="signals-fineprint">
        Counters exclude themselves: the badges live outside the profiled trees. Signal writes
        update the DOM without re-running the form component; useState re-runs it on every
        keystroke. Same components, same markup — the difference is the state layer.
      </p>
      {renderingData && (
        <p className="bench-teaser">
          Measured: typing 20 characters — cascade {renderingData['cascade'] ?? '?'} root commits,{' '}
          shadcn {renderingData['shadcn'] ?? '?'}, carbon {renderingData['carbon'] ?? '?'} ·{' '}
          {bench?.meta.date} <a href="/docs/benchmarks">Full benchmarks →</a>
        </p>
      )}
    </section>
  )
}
