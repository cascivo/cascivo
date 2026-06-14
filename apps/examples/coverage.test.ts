import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies that no top-tier @cascivo/react component and no @cascivo/charts chart
 * is entirely undemoed across the five example apps.
 *
 * The kit is included in the scan because AppShell (in kit/src/app-shell.tsx)
 * is the implementation site for CommandMenu — apps import AppShell, not CommandMenu directly.
 */

const APPS = ['deploy', 'pay', 'flow', 'track', 'pulse', 'kit']
const ROOT = resolve(import.meta.dirname, '../..')

// Collect all TypeScript source from the 5 apps + kit
function collectSource(): string {
  const parts: string[] = []
  for (const app of APPS) {
    const srcDir = resolve(ROOT, 'apps/examples', app, 'src')
    try {
      const files = getAllFiles(srcDir)
      for (const f of files) {
        parts.push(readFileSync(f, 'utf8'))
      }
    } catch {
      // App may not exist yet
    }
  }
  return parts.join('\n')
}

function getAllFiles(dir: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) result.push(...getAllFiles(full))
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) result.push(full)
  }
  return result
}

// Charts that should be demonstrated (from @cascivo/charts)
// Each must appear in at least one app's imports
const REQUIRED_CHARTS = [
  'AreaChart',
  'BarChart',
  'LineChart',
  'Kpi', // exported as 'Kpi' from @cascivo/charts
  'Sparkline',
  'Heatmap',
  'Meter',
  'Bullet',
  // Allowed to be undemoed (more specialized):
  // PieChart, ScatterChart, Histogram, Boxplot, BubbleChart, ComboChart, Treemap, Radar
]

// Top-tier @cascivo/react components that should be demonstrated
const REQUIRED_REACT = [
  'DataTable',
  'Drawer',
  'Status',
  'Badge',
  'Stat',
  'Toast',
  'CommandMenu', // used in AppShell (kit/src/app-shell.tsx), consumed by pay/flow/track/pulse
  'Timeline',
  'TreeView',
  'SegmentedControl',
  'ProgressBar', // used in deploy PipelineList for running pipeline progress
  'Skeleton',
  'EmptyState',
  'Alert',
]

describe('v21 coverage', () => {
  const source = collectSource()

  it('all required charts are used in at least one app', () => {
    const missing = REQUIRED_CHARTS.filter((c) => !source.includes(c))
    assert.deepEqual(missing, [], `Missing chart coverage: ${missing.join(', ')}`)
  })

  it('all required @cascivo/react components are used in at least one app', () => {
    const missing = REQUIRED_REACT.filter((c) => !source.includes(c))
    assert.deepEqual(missing, [], `Missing component coverage: ${missing.join(', ')}`)
  })
})
