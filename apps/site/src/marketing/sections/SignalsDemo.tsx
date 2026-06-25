'use client'
import { useRef, useState } from 'react'
import { signal, useSignals, type Signal } from '@cascivo/core'
import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import { Card } from '@cascivo/components/card'
import { Checkbox } from '@cascivo/components/checkbox'
import { Input } from '@cascivo/components/input'

/* The useState twin below is the comparison subject — the one sanctioned hook
   exception on this page (v7 master plan, decision 9). */

// Module-level — neither form re-renders when these signals update
const signalFormRenders = signal(0)
const stateFormRenders = signal(0)

// Module-level field signals — SignalForm itself never reads them
const sigName = signal('')
const sigEmail = signal('')
const sigNewsletter = signal(false)

function RenderBadge({ count }: { count: Signal<number> }) {
  useSignals()
  return (
    <Badge variant="outline">
      <span className="twin-count">{count.value}</span> renders
    </Badge>
  )
}

// Isolated field components: only the changed field re-renders, not SignalForm
function SigInput({ sig, label }: { sig: Signal<string>; label: string }) {
  useSignals()
  return (
    <Input
      label={label}
      value={sig.value}
      onChange={(e) => {
        sig.value = (e.currentTarget as HTMLInputElement).value
      }}
    />
  )
}

function SigCheckbox({ sig, label }: { sig: Signal<boolean>; label: string }) {
  useSignals()
  return (
    <Checkbox
      label={label}
      checked={sig.value}
      onChange={() => {
        sig.value = !sig.value
      }}
    />
  )
}

function SignalForm() {
  // No useSignals() — this component renders once (on mount) and never again
  const mounted = useRef(false)
  const renders = useRef(0)
  if (mounted.current) {
    renders.current++
    queueMicrotask(() => {
      signalFormRenders.value = renders.current
    })
  } else {
    mounted.current = true
  }
  return (
    <form className="twin-form" aria-label="cascivo form">
      <SigInput sig={sigName} label="Name" />
      <SigInput sig={sigEmail} label="Email" />
      <SigCheckbox sig={sigNewsletter} label="Subscribe to changelog" />
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
  const mounted = useRef(false)
  const renders = useRef(0)
  if (mounted.current) {
    renders.current++
    queueMicrotask(() => {
      stateFormRenders.value = renders.current
    })
  } else {
    mounted.current = true
  }
  return (
    <form className="twin-form" aria-label="useState form">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName((e.currentTarget as HTMLInputElement).value)}
      />
      <Input
        label="Email"
        value={email}
        onChange={(e) => setEmail((e.currentTarget as HTMLInputElement).value)}
      />
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
  const renderingData = bench?.renders?.['type-20-chars']

  return (
    <section className="signals" id="signals" data-reveal="">
      <h2>Count the re-renders</h2>
      <p className="signals-sub">
        The same form, twice. Left: cascivo signals. Right: the usual useState wiring. Type in both
        — the counters show how many times each <em>form component</em> has re-rendered, on this
        page, right now.
      </p>
      <div className="signals-grid">
        <Card padding="md">
          <header className="twin-head">
            <span>signals</span>
            <RenderBadge count={signalFormRenders} />
          </header>
          <SignalForm />
        </Card>
        <Card padding="md">
          <header className="twin-head">
            <span>useState</span>
            <RenderBadge count={stateFormRenders} />
          </header>
          <StateForm />
        </Card>
      </div>
      <p className="signals-fineprint">
        The signals form renders once on mount — field updates are isolated to each individual field
        component. The useState form re-runs the entire component on every keystroke. Same
        components, same markup; the difference is the state layer.
      </p>
      {renderingData && (
        <p className="bench-teaser">
          Measured: typing 20 characters — cascivo {renderingData['cascivo'] ?? '?'} root commits,{' '}
          shadcn {renderingData['shadcn'] ?? '?'}, carbon {renderingData['carbon'] ?? '?'} ·{' '}
          {bench?.meta.date} <a href="/docs/benchmarks">Full benchmarks →</a>
        </p>
      )}
    </section>
  )
}
