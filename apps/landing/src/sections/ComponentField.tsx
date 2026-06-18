import type { ReactNode } from 'react'
import { Avatar } from '@cascivo/components/avatar'
import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@cascivo/components/card'
import { Checkbox } from '@cascivo/components/checkbox'
import { Input } from '@cascivo/components/input'
import { ProgressBar } from '@cascivo/components/progress-bar'
import { RatingGroup } from '@cascivo/components/rating-group'
import { Select } from '@cascivo/components/select'
import { Stat } from '@cascivo/components/stat'
import { Toggle } from '@cascivo/components/toggle'
import { Textarea } from '@cascivo/components/textarea'
import { AreaChart, BarChart, Kpi, LineChart } from '@cascivo/charts'

// The page backdrop: real, composed UI cards — forms, charts, lists, settings —
// the way a design system shows itself off. Blurred + muted by default, revealed
// in full by the navbar "peek" toggle. The whole layer is decorative
// (aria-hidden + inert) and never in the tab order or a11y tree.

const months = Array.from({ length: 8 }, (_, i) => i)
const area = [
  {
    id: 'v',
    label: 'Visits',
    data: months.map((i) => ({ x: i, y: 1200 + i * 240 + (i % 3) * 180 })),
  },
]
const line = [
  {
    id: 'r',
    label: 'Revenue',
    data: months.map((i) => ({ x: i, y: 2000 + i * 320 + (i % 4) * 160 })),
  },
  { id: 'c', label: 'Cost', data: months.map((i) => ({ x: i, y: 1200 + i * 140 + (i % 3) * 90 })) },
]
const bar = [
  {
    id: 'q',
    label: 'Orders',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((m, i) => ({
      x: m,
      y: 40 + i * 18 + (i % 2) * 22,
    })),
  },
]

function SignIn() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <Input label="Email" placeholder="you@studio.com" />
          <Input label="Password" type="password" placeholder="••••••••" />
          <Button>Sign in</Button>
          <Button variant="secondary">Continue with GitHub</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateAccount() {
  return (
    <Card variant="outlined">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <Input label="Name" placeholder="Ada Lovelace" />
          <Input label="Email" placeholder="ada@studio.com" />
          <Checkbox label="Email me product updates" defaultChecked />
          <Button>Sign up</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RevenueArea() {
  return (
    <Card>
      <CardHeader>
        <div className="bgc-row">
          <CardTitle>Visitors</CardTitle>
          <Badge variant="success" size="sm">
            +12.5%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <AreaChart
          series={area}
          x={(d) => d.x}
          y={(d) => d.y}
          title="Visitors this week"
          height={120}
        />
      </CardContent>
    </Card>
  )
}

function CostLine() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs cost</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart
          series={line}
          x={(d) => d.x}
          y={(d) => d.y}
          title="Revenue vs cost"
          height={120}
        />
      </CardContent>
    </Card>
  )
}

function OrdersBar() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart series={bar} x={(d) => d.x} y={(d) => d.y} title="Orders by day" height={120} />
      </CardContent>
    </Card>
  )
}

function RevenueKpi() {
  return (
    <Kpi value="$48.2k" label="Revenue · 24h" delta={12.5} sparkline={[3, 5, 4, 7, 6, 9, 8, 12]} />
  )
}

const TEAM = [
  { name: 'Ada Lovelace', role: 'Owner', initials: 'AL' },
  { name: 'Alan Turing', role: 'Member', initials: 'AT' },
  { name: 'Grace Hopper', role: 'Member', initials: 'GH' },
]

function Team() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          {TEAM.map((m) => (
            <div key={m.name} className="bgc-row">
              <div className="bgc-row-tight">
                <Avatar fallback={m.initials} size="sm" />
                <span>{m.name}</span>
              </div>
              <Badge variant={m.role === 'Owner' ? 'success' : 'outline'} size="sm">
                {m.role}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Notifications() {
  const rows = ['Comments', 'Mentions', 'Weekly digest']
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          {rows.map((r, i) => (
            <div key={r} className="bgc-row">
              <span>{r}</span>
              <Toggle defaultChecked={i !== 1} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Upgrade() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Upgrade to Pro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <div>
            <span className="bgc-price">$20</span>
            <span className="bgc-muted"> / month</span>
          </div>
          {['Unlimited projects', 'Priority support', 'Custom themes'].map((f) => (
            <span key={f} className="bgc-feature">
              <Badge variant="success" size="sm">
                ✓
              </Badge>
              {f}
            </span>
          ))}
          <Button>Upgrade</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Profile() {
  return (
    <Card>
      <CardContent>
        <div className="bgc-stack">
          <div className="bgc-row-tight">
            <Avatar fallback="GH" size="lg" status="online" />
            <div>
              <div>Grace Hopper</div>
              <span className="bgc-muted">Compiler pioneer</span>
            </div>
          </div>
          <div className="bgc-row">
            <Stat label="Followers" value="8.2k" />
            <Stat label="Following" value="312" />
          </div>
          <Button variant="secondary">Follow</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Onboarding() {
  const steps = [
    { label: 'Create your workspace', done: true },
    { label: 'Invite your team', done: true },
    { label: 'Add your first project', done: false },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting started</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <ProgressBar label="2 of 3 complete" value={66} />
          {steps.map((s) => (
            <Checkbox key={s.label} label={s.label} defaultChecked={s.done} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Review() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a review</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <RatingGroup value={4} readOnly />
          <Textarea label="Your review" rows={2} placeholder="Tell us what you think…" />
          <Button>Submit</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StatsGrid() {
  const stats = [
    { label: 'Revenue', value: '$48.2k', delta: '+12.5%', trend: 'up' as const },
    { label: 'Users', value: '2,310', delta: '+4.1%', trend: 'up' as const },
    { label: 'Orders', value: '1,204', delta: '-2.3%', trend: 'down' as const },
    { label: 'Churn', value: '0.8%', delta: '-0.4%', trend: 'down' as const },
  ]
  return (
    <Card>
      <CardContent>
        <div className="bgc-grid">
          {stats.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} delta={s.delta} trend={s.trend} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentMethod() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment method</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <Select
            label="Plan"
            placeholder="Pro — $20/mo"
            options={[
              { value: 'pro', label: 'Pro — $20/mo' },
              { value: 'team', label: 'Team — $60/mo' },
            ]}
          />
          <Input label="Card number" placeholder="4242 4242 4242 4242" />
          <div className="bgc-row">
            <Input label="Expiry" placeholder="04/28" />
            <Input label="CVC" placeholder="123" />
          </div>
          <Button>Pay $20</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CookieSettings() {
  return (
    <Card variant="outlined">
      <CardHeader>
        <CardTitle>Cookie settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          {[
            ['Strictly necessary', true],
            ['Functional', true],
            ['Performance', false],
          ].map(([label, on]) => (
            <div key={label as string} className="bgc-row">
              <span>{label}</span>
              <Toggle defaultChecked={on as boolean} />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="secondary">Save preferences</Button>
      </CardFooter>
    </Card>
  )
}

const TILES: ReactNode[] = [
  <SignIn key="signin" />,
  <RevenueArea key="area" />,
  <Team key="team" />,
  <Upgrade key="upgrade" />,
  <Notifications key="notif" />,
  <CostLine key="line" />,
  <CreateAccount key="create" />,
  <RevenueKpi key="kpi" />,
  <Onboarding key="onboard" />,
  <OrdersBar key="bar" />,
  <Profile key="profile" />,
  <Review key="review" />,
  <StatsGrid key="stats" />,
  <PaymentMethod key="pay" />,
  <CookieSettings key="cookie" />,
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

// Doubled so the (balanced) columns overflow and fill tall viewports; repeats
// land in different themes, so a card reads as "same UI, another skin".
const FIELD = [...TILES, ...TILES]

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
