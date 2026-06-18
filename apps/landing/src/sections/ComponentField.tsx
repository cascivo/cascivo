import type { ReactNode } from 'react'
import { Avatar } from '@cascivo/components/avatar'
import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import { Card } from '@cascivo/components/card'
import { Checkbox } from '@cascivo/components/checkbox'
import { Input } from '@cascivo/components/input'
import { Kbd } from '@cascivo/components/kbd'
import { ProgressBar } from '@cascivo/components/progress-bar'
import { ProgressCircle } from '@cascivo/components/progress-circle'
import { RatingGroup } from '@cascivo/components/rating-group'
import { Select } from '@cascivo/components/select'
import { Skeleton } from '@cascivo/components/skeleton'
import { Slider } from '@cascivo/components/slider'
import { Spinner } from '@cascivo/components/spinner'
import { Stat } from '@cascivo/components/stat'
import { Status } from '@cascivo/components/status'
import { Tag } from '@cascivo/components/tag'
import { Toggle } from '@cascivo/components/toggle'

// A field of real components used as the page backdrop: blurred and muted by
// default so the foreground reads, revealed in full by the navbar "peek" toggle.
// The whole layer is decorative (aria-hidden + inert) — it is never in the tab
// order or the accessibility tree, even when revealed.
const TILES: ReactNode[] = [
  <Button key="btn">Deploy</Button>,
  <Badge key="badge" variant="success">
    Passing
  </Badge>,
  <Toggle key="toggle" label="Notifications" defaultChecked />,
  <Avatar key="avatar" fallback="AK" status="online" />,
  <Slider key="slider" label="Budget" defaultValue={62} />,
  <Tag key="tag" variant="info">
    design-system
  </Tag>,
  <Kbd key="kbd">⌘K</Kbd>,
  <Input key="input" label="Email" placeholder="you@studio.com" />,
  <Select
    key="select"
    label="Region"
    placeholder="Frankfurt"
    options={[
      { value: 'fra', label: 'Frankfurt' },
      { value: 'iad', label: 'Washington' },
    ]}
  />,
  <ProgressBar key="progress" label="Build" value={68} />,
  <RatingGroup key="rating" value={4} readOnly />,
  <Status key="status" status="success">
    Operational
  </Status>,
  <Card key="card" padding="sm">
    Grouped content
  </Card>,
  <Checkbox key="check" label="Auto-merge" defaultChecked />,
  <Button key="btn2" variant="secondary">
    View logs
  </Button>,
  <Badge key="badge2" variant="warning">
    In review
  </Badge>,
  <Stat key="stat" label="Revenue · 24h" value="$48.2k" />,
  <ProgressCircle key="ring" value={72} showValue />,
  <Spinner key="spinner" />,
  <Skeleton key="skeleton" lines={3} width="9rem" />,
  <Tag key="tag2">v2.1.0</Tag>,
  <Badge key="badge3" variant="outline">
    RSC-ready
  </Badge>,
]

const THEMES = [
  'light',
  'dark',
  'warm',
  'flat',
  'minimal',
  'midnight',
  'pastel',
  'corporate',
  'terminal',
  'brutalist',
] as const

// Tripled so the (balanced) columns always overflow and fill the viewport,
// even on tall displays; the overflow is clipped by the fixed field.
const FIELD = [...TILES, ...TILES, ...TILES]

export function ComponentField() {
  return (
    <div className="bg-field" aria-hidden="true" inert>
      <div className="bg-field-grid">
        {FIELD.map((tile, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="bg-field-tile" data-theme={THEMES[i % THEMES.length]}>
            {tile}
          </div>
        ))}
      </div>
    </div>
  )
}
