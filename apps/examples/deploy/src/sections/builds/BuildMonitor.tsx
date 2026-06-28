'use client'
import { createScope, useSignal, useSignalEffect, useStreamBuffer, useSignals } from '@cascivo/core'
import { AreaChart, useStreamSeries } from '@cascivo/charts'
import { t } from '@cascivo/i18n'
import { Button, Card, CardContent, CardHeader, LogViewer, type LogLine } from '@cascivo/react'
import { deployMsg } from '../../i18n'
import styles from './BuildMonitor.module.css'

interface Sample {
  t: number
  v: number
}

// Deterministic mock build-log script (no randomness — stable across reloads/tests).
const SCRIPT: { text: string; level?: LogLine['level'] }[] = [
  { text: 'Cloning github.com/acme/web (branch: main)' },
  { text: 'Resolving dependencies…' },
  { text: 'Installed 482 packages in 6.1s' },
  { text: 'Running build command: pnpm build' },
  { text: 'vite v8 building for production…' },
  { text: 'transforming modules…' },
  { text: 'warning: large chunk (vendor) 612 kB', level: 'warn' },
  { text: 'rendering chunks…' },
  { text: 'build complete in 18.4s' },
  { text: 'Uploading build outputs (24 files)…' },
  { text: 'Assigning preview domain acme-web-7f3.cascivo.app' },
  { text: 'Deployment ready', level: 'info' },
]

function stamp(n: number): string {
  const s = (n * 0.3).toFixed(1).padStart(5, '0')
  return `${s}s`
}

/**
 * Live build monitor — demonstrates the v56 streaming primitives end-to-end:
 * `useStreamBuffer` + `LogViewer` for the build log, `useStreamSeries` + a
 * live `AreaChart` for throughput, and a per-build `createScope` so restarting
 * a build tears down the previous log generator with no leaked timers.
 */
export function BuildMonitor() {
  useSignals()

  const logs = useStreamBuffer<LogLine>({ capacity: 1000 })
  const buildId = useSignal(1)

  // Live throughput metric — its own self-contained mock SSE source.
  const rps = useStreamSeries<Sample>({
    capacity: 120,
    decimate: { to: 120, y: (p) => p.v },
    source: (push) => {
      let i = 0
      const id = setInterval(() => {
        i += 1
        // Smooth deterministic wave — no Math.random.
        push({ t: i, v: 900 + Math.round(450 * Math.abs(Math.sin(i / 7))) })
      }, 250)
      return () => clearInterval(id)
    },
  })

  // Per-build log stream. A fresh scope per buildId owns the generator effect;
  // bumping buildId disposes the old scope (and its interval) before starting.
  useSignalEffect(() => {
    const id = buildId.value
    logs.clear()
    const scope = createScope()
    scope.effect(() => {
      let n = 0
      const timer = setInterval(() => {
        const step = SCRIPT[n % SCRIPT.length]!
        logs.append({
          id: `${id}-${n}`,
          text: `${stamp(n)}  ${step.text}`,
          ...(step.level ? { level: step.level } : {}),
        })
        n += 1
      }, 320)
      return () => clearInterval(timer)
    })
    return () => scope.dispose()
  })

  return (
    <div className={styles['root']}>
      <header className={styles['header']}>
        <div>
          <h1 className={styles['title']}>{t(deployMsg.buildsTitle)}</h1>
          <p className={styles['subtitle']}>{t(deployMsg.buildsSubtitle)}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            buildId.value += 1
          }}
        >
          {t(deployMsg.buildsRestart)}
        </Button>
      </header>

      <Card>
        <CardHeader>{t(deployMsg.buildsThroughput)}</CardHeader>
        <CardContent>
          <AreaChart
            title={t(deployMsg.buildsThroughput)}
            series={[{ id: 'rps', label: t(deployMsg.buildsThroughput), data: rps.value }]}
            x={(s) => s.t}
            y={(s) => s.v}
            height={200}
            tooltipMode="axis"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>{t(deployMsg.buildsLog)}</CardHeader>
        <CardContent>
          <LogViewer lines={logs.signal} maxHeight="22rem" />
        </CardContent>
      </Card>
    </div>
  )
}
