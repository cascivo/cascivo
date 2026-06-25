'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { AreaChart } from '@cascivo/charts'
import { TRAFFIC } from './data'

const traffic = signal<number[]>([...TRAFFIC])

function nextPoint(window: number[]): number {
  const recent = window.slice(-6)
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length
  const jitter = (Math.random() - 0.5) * 24
  return Math.max(60, Math.round(mean + jitter))
}

export function TrafficRegion() {
  useSignals()

  useSignalEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      if (document.hidden) return
      traffic.value = [...traffic.value.slice(1), nextPoint(traffic.value)]
    }, 2000)
    return () => clearInterval(id)
  })

  const series = [
    { id: 'requests', label: 'Requests/hour', data: traffic.value.map((y, x) => ({ x, y })) },
  ]

  return (
    <section className="region" aria-label="Traffic">
      <div className="traffic-region-head">
        <h3>Traffic</h3>
        <span className="traffic-region-sub">requests/hour · live</span>
      </div>
      <AreaChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Requests per hour over last 24 hours"
        height={140}
        xTicks={6}
        yTicks={4}
        legend={false}
      />
    </section>
  )
}
