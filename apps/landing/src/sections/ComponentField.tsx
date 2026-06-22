import type { ReactNode } from 'react'
import { useMediaQuery, useSignals } from '@cascivo/core'
import { Alert } from '@cascivo/components/alert'
import { Avatar } from '@cascivo/components/avatar'
import { Badge } from '@cascivo/components/badge'
import { Button } from '@cascivo/components/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@cascivo/components/card'
import { Checkbox } from '@cascivo/components/checkbox'
import { Input } from '@cascivo/components/input'
import { Kbd } from '@cascivo/components/kbd'
import { Pagination } from '@cascivo/components/pagination'
import { ProgressBar } from '@cascivo/components/progress-bar'
import { RatingGroup } from '@cascivo/components/rating-group'
import { SegmentedControl } from '@cascivo/components/segmented-control'
import { Select } from '@cascivo/components/select'
import { Slider } from '@cascivo/components/slider'
import { Stat } from '@cascivo/components/stat'
import { Status } from '@cascivo/components/status'
import { Steps } from '@cascivo/components/steps'
import { Tag } from '@cascivo/components/tag'
import { Toggle } from '@cascivo/components/toggle'
import { Textarea } from '@cascivo/components/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@cascivo/components/accordion'
import { Breadcrumb } from '@cascivo/components/breadcrumb'
import { Combobox } from '@cascivo/components/combobox'
import { DatePicker } from '@cascivo/components/date-picker'
import { EmptyState } from '@cascivo/components/empty-state'
import { Link } from '@cascivo/components/link'
import { MultiSelect } from '@cascivo/components/multi-select'
import { NumberInput } from '@cascivo/components/number-input'
import { OtpInput } from '@cascivo/components/otp-input'
import { PasswordInput } from '@cascivo/components/password-input'
import { ProgressIndicator } from '@cascivo/components/progress-indicator'
import { Radio, RadioGroup } from '@cascivo/components/radio'
import { Separator } from '@cascivo/components/separator'
import { Skeleton } from '@cascivo/components/skeleton'
import { Spinner } from '@cascivo/components/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cascivo/components/tabs'
import { TagsInput } from '@cascivo/components/tags-input'
import { TimePicker } from '@cascivo/components/time-picker'
import { AreaChart, BarChart, Kpi, LineChart, PieChart } from '@cascivo/charts'
import { peek } from '../peek'

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

function PlanToggle() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <SegmentedControl
            value="yearly"
            onValueChange={() => {}}
            options={[
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' },
            ]}
          />
          <div>
            <span className="bgc-price">$16</span>
            <span className="bgc-muted"> / mo · billed yearly</span>
          </div>
          <Button>Choose plan</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Alerts() {
  return (
    <Card>
      <CardContent>
        <div className="bgc-stack">
          <Alert variant="success" title="Payment received">
            Your invoice for June is settled.
          </Alert>
          <Alert variant="warning" title="Storage almost full">
            92% of 10 GB used.
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}

function Checkout() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <Steps
            steps={[
              { label: 'Cart', state: 'complete' },
              { label: 'Shipping', state: 'active' },
              { label: 'Payment', state: 'pending' },
            ]}
          />
          <Button>Continue to payment</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Traffic() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic sources</CardTitle>
      </CardHeader>
      <CardContent>
        <PieChart
          donut
          title="Traffic sources"
          height={150}
          data={[
            { id: 'direct', label: 'Direct', value: 48 },
            { id: 'search', label: 'Search', value: 32 },
            { id: 'social', label: 'Social', value: 20 },
          ]}
        />
      </CardContent>
    </Card>
  )
}

function Filters() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-tags">
          <Tag variant="info">status: open</Tag>
          <Tag>label: bug</Tag>
          <Tag variant="success">priority: high</Tag>
          <Tag>assignee: ada</Tag>
          <Badge variant="outline">+2</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function Collaborators() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared with</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <div className="bgc-avatars">
            {['AL', 'AT', 'GH', 'KJ'].map((a) => (
              <Avatar key={a} fallback={a} size="sm" />
            ))}
            <span className="bgc-muted">+3 more</span>
          </div>
          <Button variant="secondary">Invite people</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DeviceSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Display</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <Slider label="Brightness" defaultValue={72} />
          <Slider label="Contrast" defaultValue={48} />
          <div className="bgc-row">
            <span>Night mode</span>
            <Toggle defaultChecked />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SystemStatus() {
  const rows: Array<[string, 'success' | 'warning' | 'error']> = [
    ['API', 'success'],
    ['Database', 'success'],
    ['Webhooks', 'warning'],
    ['CDN', 'success'],
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>System status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          {rows.map(([name, s]) => (
            <div key={name} className="bgc-row">
              <span>{name}</span>
              <Status status={s}>{s === 'success' ? 'Operational' : 'Degraded'}</Status>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SocialLogin() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <Button variant="secondary">Continue with Google</Button>
          <Button variant="secondary">Continue with GitHub</Button>
          <span className="bgc-muted">or</span>
          <Input label="Work email" placeholder="you@company.com" />
          <Button>Continue with email</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CommandSearch() {
  const results = ['Create new project', 'Invite teammate', 'Open settings']
  return (
    <Card>
      <CardContent>
        <div className="bgc-stack">
          <div className="bgc-row">
            <Input placeholder="Type a command…" />
            <Kbd>⌘K</Kbd>
          </div>
          {results.map((r) => (
            <div key={r} className="bgc-row-tight bgc-muted">
              <Badge variant="outline" size="sm">
                ⏎
              </Badge>
              {r}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Inbox() {
  const msgs = [
    { who: 'Ada', text: 'Shipped the new theme', unread: true, initials: 'AL' },
    { who: 'Alan', text: 'Re: benchmark results', unread: false, initials: 'AT' },
    { who: 'Grace', text: 'Compiler review ready', unread: true, initials: 'GH' },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbox</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          {msgs.map((m) => (
            <div key={m.who} className="bgc-row">
              <div className="bgc-row-tight">
                <Avatar fallback={m.initials} size="sm" />
                <span>
                  {m.who} · <span className="bgc-muted">{m.text}</span>
                </span>
              </div>
              {m.unread && <Badge variant="success" size="sm" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Orders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          {[
            ['#1043', 'Paid'],
            ['#1042', 'Pending'],
            ['#1041', 'Paid'],
          ].map(([id, st]) => (
            <div key={id} className="bgc-row">
              <span>{id}</span>
              <Badge variant={st === 'Paid' ? 'success' : 'warning'} size="sm">
                {st}
              </Badge>
            </div>
          ))}
          <Pagination page={2} pageSize={10} totalItems={48} onPageChange={() => {}} />
        </div>
      </CardContent>
    </Card>
  )
}

function FaqAccordion() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>FAQ</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" defaultValue="what">
          <AccordionItem value="what">
            <AccordionTrigger>What is cascivo?</AccordionTrigger>
            <AccordionContent>
              A CSS-native, signal-driven, AI-first React design system.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="how">
            <AccordionTrigger>How do I install it?</AccordionTrigger>
            <AccordionContent>Copy a component in with the CLI and own the code.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

function SettingsTabs() {
  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Manage your account settings and preferences.</TabsContent>
          <TabsContent value="security">Update your password and security options.</TabsContent>
          <TabsContent value="team">Invite teammates and manage their roles.</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function PlanChoice() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a plan</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup name="bg-plan" defaultValue="pro">
          <Radio value="free" label="Free — for hobby projects" />
          <Radio value="pro" label="Pro — $20/mo" />
          <Radio value="team" label="Team — $60/mo" />
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

function PageTrail() {
  return (
    <Card variant="outlined">
      <CardContent>
        <div className="bgc-stack">
          <Breadcrumb
            items={[
              { label: 'Home', href: '#' },
              { label: 'Components', href: '#' },
              { label: 'Breadcrumb' },
            ]}
          />
          <span className="bgc-muted">Navigation · 3 levels deep</span>
        </div>
      </CardContent>
    </Card>
  )
}

function SignupFlow() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set up your account</CardTitle>
      </CardHeader>
      <CardContent>
        <ProgressIndicator
          currentIndex={1}
          steps={[
            { label: 'Account', description: 'Basic info' },
            { label: 'Profile', description: 'Your details' },
            { label: 'Review' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

function LoadingCard() {
  return (
    <Card>
      <CardContent>
        <div className="bgc-stack">
          <div className="bgc-row-tight">
            <Skeleton variant="circle" width="3rem" height="3rem" />
            <Skeleton variant="rect" width="8rem" height="1.5rem" />
          </div>
          <Skeleton variant="text" lines={3} />
        </div>
      </CardContent>
    </Card>
  )
}

function NoMessages() {
  return (
    <Card>
      <CardContent>
        <EmptyState
          icon="📭"
          title="No messages yet"
          description="When you receive messages, they'll appear here."
          action={<Button size="sm">Compose</Button>}
        />
      </CardContent>
    </Card>
  )
}

function NewPassword() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a password</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <PasswordInput showStrengthMeter placeholder="Create password" />
          <Button>Continue</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function VerifyCode() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <span className="bgc-muted">Enter the 6-digit code we sent you.</span>
          <OtpInput value="412" onValueChange={() => {}} />
        </div>
      </CardContent>
    </Card>
  )
}

function SkillsInput() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent>
        <TagsInput
          value={['react', 'typescript', 'css']}
          onValueChange={() => {}}
          placeholder="Add skill…"
        />
      </CardContent>
    </Card>
  )
}

function CountrySelect() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping country</CardTitle>
      </CardHeader>
      <CardContent>
        <Combobox
          label="Country"
          defaultValue="us"
          clearable
          options={[
            { value: 'us', label: 'United States' },
            { value: 'de', label: 'Germany' },
            { value: 'fr', label: 'France' },
            { value: 'jp', label: 'Japan' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

function BookAppointment() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Book a slot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <DatePicker label="Date" defaultValue="2026-07-15" clearable />
          <TimePicker label="Time" defaultValue="09:30" />
          <Button>Confirm</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TechStack() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frameworks</CardTitle>
      </CardHeader>
      <CardContent>
        <MultiSelect
          value={['react', 'svelte']}
          onValueChange={() => {}}
          placeholder="Select frameworks"
          options={[
            { label: 'React', value: 'react' },
            { label: 'Vue', value: 'vue' },
            { label: 'Svelte', value: 'svelte' },
            { label: 'Angular', value: 'angular' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

function QuickLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <Link href="#">Documentation</Link>
          <Link href="#">Component registry</Link>
          <Separator />
          <Link href="https://example.com" external>
            GitHub repository
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function Deploying() {
  return (
    <Card>
      <CardContent>
        <div className="bgc-row-tight">
          <Spinner />
          <div>
            <div>Deploying to production…</div>
            <span className="bgc-muted">Build 248 · 12s elapsed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Uploads() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <ProgressBar label="report.pdf" value={100} status="success" />
          <ProgressBar label="dataset.csv" value={64} helperText="64 of 100 MB" />
          <ProgressBar label="image.png" value={40} status="error" helperText="Network error" />
        </div>
      </CardContent>
    </Card>
  )
}

function CartItem() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your cart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <div className="bgc-row">
            <span>Pro license</span>
            <NumberInput defaultValue={2} min={1} max={10} />
          </div>
          <div className="bgc-row">
            <span className="bgc-muted">Subtotal</span>
            <span className="bgc-price">$40</span>
          </div>
          <Button>Checkout</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ContactForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Get in touch</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <Input label="Name" placeholder="Ada Lovelace" />
          <Input label="Email" placeholder="ada@studio.com" />
          <Textarea label="Message" rows={2} placeholder="How can we help?" />
          <Button>Send message</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Newsletter() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Stay in the loop</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <Input label="Email" placeholder="you@example.com" />
          <Checkbox label="I agree to receive product emails" defaultChecked />
          <Button>Subscribe</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function WeeklyGoals() {
  const goals = [
    ['Ship onboarding', 80],
    ['Close 5 tickets', 60],
    ['Write release notes', 25],
  ] as const
  return (
    <Card>
      <CardHeader>
        <CardTitle>This week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          {goals.map(([label, value]) => (
            <ProgressBar key={label} label={label} value={value} size="sm" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ConnectedApps() {
  const apps = ['Slack', 'GitHub', 'Figma']
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected apps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          {apps.map((a, i) => (
            <div key={a} className="bgc-row">
              <span>{a}</span>
              <Toggle defaultChecked={i !== 2} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ShippingForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping address</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <Input label="Address" placeholder="1 Infinite Loop" />
          <div className="bgc-row">
            <Input label="City" placeholder="Cupertino" />
            <Input label="ZIP" placeholder="95014" />
          </div>
          <Select
            label="Method"
            placeholder="Standard — 3-5 days"
            options={[
              { value: 'standard', label: 'Standard — 3-5 days' },
              { value: 'express', label: 'Express — next day' },
            ]}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SupportTicket() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Open a ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <Select
            label="Topic"
            placeholder="Billing"
            options={[
              { value: 'billing', label: 'Billing' },
              { value: 'bug', label: 'Bug report' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Textarea label="Details" rows={2} placeholder="Describe the issue…" />
          <Button>Submit ticket</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TwoFactor() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor auth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <div className="bgc-row">
            <span>Authenticator app</span>
            <Status status="success">Enabled</Status>
          </div>
          <div className="bgc-row">
            <span>SMS backup</span>
            <Toggle />
          </div>
          <Button variant="secondary">Manage devices</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function InvoiceSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice · June</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          {[
            ['Pro plan', '$20.00'],
            ['Extra seats ×3', '$30.00'],
            ['Tax', '$5.00'],
          ].map(([label, amt]) => (
            <div key={label} className="bgc-row">
              <span className="bgc-muted">{label}</span>
              <span>{amt}</span>
            </div>
          ))}
          <Separator />
          <div className="bgc-row">
            <span>Total</span>
            <span className="bgc-price">$55.00</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectProgress() {
  return (
    <Card>
      <CardHeader>
        <div className="bgc-row">
          <CardTitle>Redesign</CardTitle>
          <Badge variant="warning" size="sm">
            In progress
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <ProgressBar label="14 of 20 tasks" value={70} />
          <div className="bgc-avatars">
            {['AL', 'AT', 'GH'].map((a) => (
              <Avatar key={a} fallback={a} size="sm" />
            ))}
            <span className="bgc-muted">+2</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FeatureVote() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate this release</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bgc-stack">
          <RatingGroup value={5} readOnly />
          <span className="bgc-muted">128 people rated this 4.8 / 5</span>
          <Button variant="secondary">Leave feedback</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Interleaved so charts, forms, and lists alternate down each column. Distinct
// cards only — no card repeats, so the revealed field reads as a real gallery.
const TILES: ReactNode[] = [
  <SignIn key="signin" />,
  <RevenueArea key="area" />,
  <Team key="team" />,
  <SettingsTabs key="settings-tabs" />,
  <PlanToggle key="plan" />,
  <Notifications key="notif" />,
  <Uploads key="uploads" />,
  <Traffic key="traffic" />,
  <CreateAccount key="create" />,
  <RevenueKpi key="kpi" />,
  <FaqAccordion key="faq" />,
  <SystemStatus key="status" />,
  <OrdersBar key="bar" />,
  <ProjectProgress key="project" />,
  <Collaborators key="collab" />,
  <Review key="review" />,
  <NewPassword key="new-password" />,
  <StatsGrid key="stats" />,
  <CommandSearch key="cmd" />,
  <SkillsInput key="skills" />,
  <CookieSettings key="cookie" />,
  <CostLine key="line" />,
  <SignupFlow key="signup-flow" />,
  <Upgrade key="upgrade" />,
  <Checkout key="checkout" />,
  <CountrySelect key="country" />,
  <Profile key="profile" />,
  <Alerts key="alerts" />,
  <PlanChoice key="plan-choice" />,
  <Onboarding key="onboard" />,
  <Deploying key="deploying" />,
  <DeviceSettings key="device" />,
  <BookAppointment key="appointment" />,
  <PaymentMethod key="pay" />,
  <Inbox key="inbox" />,
  <NoMessages key="empty" />,
  <SocialLogin key="social" />,
  <ContactForm key="contact" />,
  <Filters key="filters" />,
  <TechStack key="tech" />,
  <Orders key="orders" />,
  <VerifyCode key="verify" />,
  <WeeklyGoals key="goals" />,
  <PageTrail key="trail" />,
  <Newsletter key="newsletter" />,
  <ConnectedApps key="apps" />,
  <CartItem key="cart" />,
  <ShippingForm key="shipping" />,
  <LoadingCard key="loading" />,
  <SupportTicket key="support" />,
  <TwoFactor key="2fa" />,
  <QuickLinks key="links" />,
  <InvoiceSummary key="invoice" />,
  <FeatureVote key="vote" />,
]

// ~55 distinct cards balance the columns past the fold so the field always fills
// the viewport; the overflow is clipped by the fixed field, and peek mode scrolls
// to reach the rest. Cards inherit the page theme — no per-tile override — so
// switching the theme re-skins the whole backdrop in step with the page.
const FIELD = TILES

export function ComponentField() {
  useSignals()
  // Decorative + inert as a blurred backdrop; on peek it becomes the content the
  // visitor is exploring, so drop inert/aria-hidden — that also makes it
  // scrollable (inert blocks scrolling), letting every card be reached.
  const revealed = peek.value

  // Explicit flex columns (not CSS multi-column) so each column can carry a
  // stretching filler at its foot — that's what lets every column reach the same
  // bottom line despite content-driven card heights. Column count tracks the
  // same breakpoints the old `columns` rule used. All three queries are read
  // unconditionally to keep hook order stable.
  const isLg = useMediaQuery('(min-width: 64rem)').value
  const isMd = useMediaQuery('(min-width: 40rem)').value
  const isSm = useMediaQuery('(min-width: 30rem)').value
  const cols = isLg ? 4 : isMd ? 3 : isSm ? 2 : 1

  const columns: ReactNode[][] = Array.from({ length: cols }, () => [])
  FIELD.forEach((tile, i) => {
    const col = columns[i % cols]
    if (col) col.push(tile)
  })

  return (
    <div
      className="bg-field"
      aria-hidden={revealed ? undefined : true}
      inert={revealed ? undefined : true}
    >
      <div className="bg-field-grid">
        {columns.map((col, ci) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={ci} className="bg-field-col">
            {col.map((tile, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={i} className="bg-field-tile">
                {tile}
              </div>
            ))}
            {/* Stretches to fill the gap so all columns end on one line. Only
                when there's more than one column to align. */}
            {cols > 1 && <div className="bg-field-filler" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  )
}
