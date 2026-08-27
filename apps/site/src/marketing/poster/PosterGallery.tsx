'use client'
import { useComputed, useSignal, useSignals } from '@cascivo/core'
import { BarChart, Sparkline } from '@cascivo/charts'
import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import { DataTable, type Column } from '@cascivo/components/data-table'
import { Field } from '@cascivo/components/field'
import { IconButton } from '@cascivo/components/icon-button'
import { Input } from '@cascivo/components/input'
import { RelativeTime } from '@cascivo/components/relative-time'
import { SegmentedControl } from '@cascivo/components/segmented-control'
import { Status } from '@cascivo/components/status'
import { Toggle } from '@cascivo/components/toggle'
import { Search, Trash } from '@cascivo/icons'
import { componentCount } from './figures'

/*
 * Six tiles of real, working components — not screenshots. The input validates
 * on keystroke, the toggle toggles, the segmented control switches, and every
 * surface takes its radius, rule weight and shadow from the active theme.
 */

const SEGMENTS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
]

interface Deploy {
  id: string
  status: 'success' | 'warning' | 'danger'
  statusLabel: string
  duration: string
  at: number
}

const MINUTE = 60_000
const DEPLOYS: Deploy[] = [
  { id: 'dpl_9f2a1c', status: 'success', statusLabel: 'live', duration: '42s', at: 4 * MINUTE },
  { id: 'dpl_71b0e4', status: 'warning', statusLabel: 'queued', duration: '—', at: 26 * MINUTE },
  { id: 'dpl_3c88da', status: 'success', statusLabel: 'live', duration: '39s', at: 95 * MINUTE },
  { id: 'dpl_02e517', status: 'danger', statusLabel: 'failed', duration: '11s', at: 210 * MINUTE },
]

const COLUMNS: Column<Deploy>[] = [
  { key: 'id', header: 'Deployment' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Status status={row.status}>{row.statusLabel}</Status>,
  },
  { key: 'duration', header: 'Duration', align: 'end' },
  {
    key: 'at',
    header: 'When',
    render: (row) => <RelativeTime date={Date.now() - row.at} sync={false} />,
  },
]

const TRAFFIC = [
  { x: 'Mon', y: 62 },
  { x: 'Tue', y: 78 },
  { x: 'Wed', y: 55 },
  { x: 'Thu', y: 91 },
  { x: 'Fri', y: 84 },
  { x: 'Sat', y: 38 },
  { x: 'Sun', y: 46 },
]

const SPARK = [12, 19, 14, 22, 27, 21, 33, 29, 38, 44, 41, 52]

export function PosterGallery() {
  useSignals()
  const email = useSignal('')
  const alerts = useSignal(true)
  const range = useSignal('week')

  // Validates on keystroke, with no error shouted at an untouched field.
  const emailError = useComputed(() =>
    email.value.length > 0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)
      ? 'Enter a valid email address'
      : undefined,
  )

  return (
    <section className="pg-section" id="gallery" aria-label="Component gallery">
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">Real components, live</h2>
        <p className="pg-eyebrow">06 / gallery</p>
      </div>
      <p className="pg-pad pg-body pg-gallery-lede">
        Everything below is a cascivo component under the active theme — zero radius, hard shadows,
        acid accent — swapped by one <code>data-theme</code> attribute. {componentCount} more in the
        docs.
      </p>

      <div className="pg-tiles pg-tiles--3">
        <div className="pg-pad pg-tile">
          <p className="pg-tile-label">button · icon-button</p>
          <div className="pg-tile-row">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Delete</Button>
            <IconButton label="Search" variant="outline" icon={<Search size={18} />} />
            <IconButton label="Discard" variant="ghost" icon={<Trash size={18} />} />
          </div>
        </div>

        <div className="pg-pad pg-tile">
          <p className="pg-tile-label">input · field · badge</p>
          <Field label="Email" error={emailError.value} required>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email.value}
              onChange={(e) => {
                email.value = (e.currentTarget as HTMLInputElement).value
              }}
            />
          </Field>
          <div className="pg-tile-row pg-tile-row--tight">
            <Badge variant="outline">required</Badge>
            <Badge
              variant={
                email.value.length === 0 ? 'neutral' : emailError.value ? 'danger' : 'success'
              }
            >
              {email.value.length === 0 ? 'empty' : emailError.value ? 'invalid' : 'valid'}
            </Badge>
          </div>
        </div>

        <div className="pg-pad pg-tile">
          <p className="pg-tile-label">toggle · segmented-control</p>
          <Toggle
            label="Email alerts"
            checked={alerts.value}
            onValueChange={(next) => {
              alerts.value = next
            }}
          />
          <SegmentedControl
            className="pg-tile-segmented"
            options={SEGMENTS}
            value={range.value}
            onValueChange={(next) => {
              range.value = next
            }}
          />
        </div>

        <div className="pg-pad pg-tile pg-tile--wide">
          <p className="pg-tile-label">data-table · status · relative-time</p>
          <div className="pg-scroll">
            <DataTable
              columns={COLUMNS}
              rows={DEPLOYS}
              getRowId={(row) => row.id}
              density="compact"
              ariaLabel="Recent deployments"
            />
          </div>
        </div>

        <div className="pg-pad pg-tile">
          <p className="pg-tile-label">chart/bar-chart · sparkline</p>
          <BarChart
            title={`Requests per day — this ${range.value}`}
            series={[{ id: 'traffic', label: 'Requests', data: TRAFFIC }]}
            x={(d) => d.x}
            y={(d) => d.y}
            height={140}
          />
          <Sparkline data={SPARK} label="Requests trend, twelve points, rising" width={180} />
        </div>
      </div>
    </section>
  )
}
