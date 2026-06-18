import type { ReactNode } from 'react'
import { Avatar } from '@cascivo/components/avatar'
import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import { Card } from '@cascivo/components/card'
import { Checkbox } from '@cascivo/components/checkbox'
import { Input } from '@cascivo/components/input'
import { Kbd } from '@cascivo/components/kbd'
import { ProgressBar } from '@cascivo/components/progress-bar'
import { RatingGroup } from '@cascivo/components/rating-group'
import { Select } from '@cascivo/components/select'
import { Slider } from '@cascivo/components/slider'
import { Status } from '@cascivo/components/status'
import { Tag } from '@cascivo/components/tag'
import { Toggle } from '@cascivo/components/toggle'
import { VisuallyHidden } from '@cascivo/components/visually-hidden'

// Each tile renders a real component in a different theme — the river shows the
// library's breadth and its theming in one glance, no prose required. The whole
// strip is decorative (inert): the controls move, so they must never take focus.
const ROW_ONE: ReactNode[] = [
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
]

const ROW_TWO: ReactNode[] = [
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

function Row({ tiles, direction }: { tiles: ReactNode[]; direction: 'ltr' | 'rtl' }) {
  // Duplicate the tiles so the -50% translate loops seamlessly.
  const doubled = [...tiles, ...tiles]
  return (
    <div className={`marquee-row marquee-row--${direction}`}>
      {doubled.map((tile, i) => (
        <div key={i} className="marquee-tile" data-theme={THEMES[i % THEMES.length]}>
          {tile}
        </div>
      ))}
    </div>
  )
}

export function ComponentMarquee() {
  return (
    <section className="marquee-section" aria-label="Component library preview">
      <VisuallyHidden>
        <h2>A live sample of the component library, rendered across ten themes.</h2>
      </VisuallyHidden>
      <div className="marquee" inert>
        <Row tiles={ROW_ONE} direction="ltr" />
        <Row tiles={ROW_TWO} direction="rtl" />
      </div>
    </section>
  )
}
