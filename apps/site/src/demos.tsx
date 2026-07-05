import { useState } from 'preact/hooks'
import type { ComponentChildren, JSX } from 'preact'
import { Button } from '@cascivo/components/button'
import { Input } from '@cascivo/components/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@cascivo/components/card'
import { Badge } from '@cascivo/components/badge'
import { Modal } from '@cascivo/components/modal'
import { Spinner } from '@cascivo/components/spinner'
import { Separator } from '@cascivo/components/separator'
import { Alert } from '@cascivo/components/alert'
import { Avatar } from '@cascivo/components/avatar'
import { Textarea } from '@cascivo/components/textarea'
import { Select } from '@cascivo/components/select'
import { Checkbox } from '@cascivo/components/checkbox'
import { Radio, RadioGroup } from '@cascivo/components/radio'
import { Toggle } from '@cascivo/components/toggle'
import { Slider } from '@cascivo/components/slider'
import { Tooltip } from '@cascivo/components/tooltip'
import { Dropdown } from '@cascivo/components/dropdown'
import { ToastProvider, useToast } from '@cascivo/components/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@cascivo/components/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@cascivo/components/accordion'
import { Kbd } from '@cascivo/components/kbd'
import { Link } from '@cascivo/components/link'
import { Breadcrumb } from '@cascivo/components/breadcrumb'
import { SideNav } from '@cascivo/components/side-nav'
import { Pagination } from '@cascivo/components/pagination'
import { ProgressIndicator } from '@cascivo/components/progress-indicator'
import { Tag } from '@cascivo/components/tag'
import { Skeleton } from '@cascivo/components/skeleton'
import { ProgressBar } from '@cascivo/components/progress-bar'
import { EmptyState } from '@cascivo/components/empty-state'
import { OverflowMenu } from '@cascivo/components/overflow-menu'
import { NumberInput } from '@cascivo/components/number-input'
import { DataTable, type Column } from '@cascivo/components/data-table'
import { CommandMenu, type CommandGroup } from '@cascivo/components/command-menu'
import { Form, useForm } from '@cascivo/components/form'
import { Combobox } from '@cascivo/components/combobox'
import { TimePicker } from '@cascivo/components/time-picker'
import { DatePicker } from '@cascivo/components/date-picker'
import { FileUploader, type UploaderFile } from '@cascivo/components/file-uploader'
import { Popover, PopoverContent, PopoverTrigger } from '@cascivo/components/popover'
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from '@cascivo/components/menu'
import { AlertDialog } from '@cascivo/components/alert-dialog'
import { Sheet } from '@cascivo/components/sheet'
import { ContextMenu, ContextMenuItem } from '@cascivo/components/context-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@cascivo/components/hover-card'
import { PasswordInput } from '@cascivo/components/password-input'
import { MultiSelect } from '@cascivo/components/multi-select'
import { TagsInput } from '@cascivo/components/tags-input'
import { OtpInput } from '@cascivo/components/otp-input'
import { SegmentedControl } from '@cascivo/components/segmented-control'
import { InputGroup, ButtonGroup, InputGroupAddon } from '@cascivo/components/input-group'
import { RatingGroup } from '@cascivo/components/rating-group'
import { ShellHeader } from '@cascivo/components/shell-header'
import { HeaderPanel } from '@cascivo/components/header-panel'
import { Switcher } from '@cascivo/components/switcher'
import { Editable } from '@cascivo/components/editable'
import { RadioCard, RadioCardGroup } from '@cascivo/components/radio-card'
import { CheckboxCard } from '@cascivo/components/checkbox-card'
import { Home, BarChart, Settings, Users, Server, Grid, Edit, Plus } from '@cascivo/icons'
import { Blockquote } from '@cascivo/components/blockquote'
import { Code } from '@cascivo/components/code'
import { CodeSnippet } from '@cascivo/components/code-snippet'
import { Heading } from '@cascivo/components/heading'
import { Text } from '@cascivo/components/text'
import { Prose } from '@cascivo/components/prose'
import { Label } from '@cascivo/components/label'
import { IconButton } from '@cascivo/components/icon-button'
import { Status } from '@cascivo/components/status'
import { Stat } from '@cascivo/components/stat'
import { Notification } from '@cascivo/components/notification'
import { Item } from '@cascivo/components/item'
import { List, ListItem } from '@cascivo/components/list'
import { ContainedList, ContainedListItem } from '@cascivo/components/contained-list'
import { DataList } from '@cascivo/components/data-list'
import { StructuredList } from '@cascivo/components/structured-list'
import { NativeSelect } from '@cascivo/components/native-select'
import { Search } from '@cascivo/components/search'
import { Field } from '@cascivo/components/field'
import { InlineLoading } from '@cascivo/components/inline-loading'
import { CopyButton } from '@cascivo/components/copy-button'
import { Progress } from '@cascivo/components/progress'
import { ProgressCircle } from '@cascivo/components/progress-circle'
import { RadialProgress } from '@cascivo/components/radial-progress'
import { ChatBubble } from '@cascivo/components/chat-bubble'
import { Steps } from '@cascivo/components/steps'
import { Filter } from '@cascivo/components/filter'
import { Timeline } from '@cascivo/components/timeline'
import { Tile } from '@cascivo/components/tile'
import { MenuButton } from '@cascivo/components/menu-button'
import { ButtonGroup as StandaloneButtonGroup } from '@cascivo/components/button-group'
import { Calendar } from '@cascivo/components/calendar'
import { Carousel } from '@cascivo/components/carousel'
import { Collapsible } from '@cascivo/components/collapsible'
import { ColorPicker } from '@cascivo/components/color-picker'
import { DateRangePicker } from '@cascivo/components/date-range-picker'
import { Swap } from '@cascivo/components/swap'
import { ToggleGroup } from '@cascivo/components/toggle-group'
import { TreeView } from '@cascivo/components/tree-view'
import { AvatarGroup } from '@cascivo/components/avatar-group'
import { User } from '@cascivo/components/user'
import { QrCode } from '@cascivo/components/qr-code'
import { RelativeTime } from '@cascivo/components/relative-time'
import { Toggletip } from '@cascivo/components/toggletip'
import { Info } from '@cascivo/icons'

function Row({ children }: { children: ComponentChildren }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
      {children}
    </div>
  )
}

function Col({ children }: { children: ComponentChildren }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '24rem' }}>
      {children}
    </div>
  )
}

interface DemoRow {
  id: string
  name: string
  role: string
  status: string
}

const demoRows: DemoRow[] = [
  { id: '1', name: 'Alice Chen', role: 'Engineer', status: 'Active' },
  { id: '2', name: 'Bob Smith', role: 'Designer', status: 'Active' },
  { id: '3', name: 'Carol Davis', role: 'PM', status: 'Away' },
  { id: '4', name: 'Dan Wilson', role: 'Engineer', status: 'Active' },
  { id: '5', name: 'Eve Johnson', role: 'QA', status: 'Inactive' },
  { id: '6', name: 'Frank Lee', role: 'DevOps', status: 'Active' },
  { id: '7', name: 'Grace Kim', role: 'Designer', status: 'Active' },
  { id: '8', name: 'Henry Brown', role: 'Engineer', status: 'Away' },
]

const demoColumns: Column<DemoRow>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status' },
]

function DataTableDemo() {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <DataTable
      columns={demoColumns}
      rows={demoRows}
      getRowId={(r) => r.id}
      searchable
      selection={{ mode: 'multi', selected, onChange: setSelected }}
      pagination={{ pageSize: 5 }}
      zebra
      title="Team members"
      description="8 members"
    />
  )
}

const commandGroups: CommandGroup[] = [
  {
    heading: 'Components',
    items: [
      { id: 'button', label: 'Button', keywords: ['click'], onSelect: () => {} },
      { id: 'input', label: 'Input', keywords: ['form', 'text'], onSelect: () => {} },
      { id: 'modal', label: 'Modal', onSelect: () => {} },
    ],
  },
  {
    heading: 'Actions',
    items: [{ id: 'theme', label: 'Toggle theme', shortcut: ['⌘', 'T'], onSelect: () => {} }],
  },
]

function CommandMenuDemo() {
  const [open, setOpen] = useState(false)
  return (
    <Row>
      <button type="button" onClick={() => setOpen(true)}>
        Open CommandMenu <kbd>⌘K</kbd>
      </button>
      <CommandMenu open={open} onOpenChange={setOpen} groups={commandGroups} hotkey={false} />
    </Row>
  )
}

function FormDemo() {
  const form = useForm<{ email: string; name: string }>({
    initialValues: { email: '', name: '' },
    validate: (v) => {
      const errs: { email?: string; name?: string } = {}
      if (!v.name) errs.name = 'Name is required'
      if (!v.email.includes('@')) errs.email = 'Enter a valid email'
      return errs
    },
  })
  const name = form.field('name')
  const email = form.field('email')
  return (
    <Col>
      <Form form={form} onValid={() => {}}>
        <Input
          label="Name"
          value={name.value}
          onChange={(e) => name.onChange((e.currentTarget as HTMLInputElement).value)}
          onBlur={name.onBlur}
          {...(name.error ? { error: name.error } : {})}
        />
        <Input
          label="Email"
          type="email"
          value={email.value}
          onChange={(e) => email.onChange((e.currentTarget as HTMLInputElement).value)}
          onBlur={email.onBlur}
          {...(email.error ? { error: email.error } : {})}
        />
        <button type="submit">Submit</button>
      </Form>
    </Col>
  )
}

function PaginationDemo() {
  const [page, setPage] = useState(1)
  return <Pagination page={page} pageSize={25} totalItems={103} onPageChange={setPage} />
}

function NumberInputDemo() {
  const [val, setVal] = useState<number | null>(42)
  return (
    <Col>
      <NumberInput label="Quantity" value={val} onChange={setVal} min={0} max={100} />
      <NumberInput label="Price" defaultValue={9.99} step={0.01} precision={2} hint="USD" />
      <NumberInput label="Disabled" defaultValue={5} disabled />
    </Col>
  )
}

function SideNavDemo() {
  return (
    <div style={{ height: '280px', display: 'flex', gap: '1rem' }}>
      <SideNav
        items={[
          { label: 'Home', href: '#', icon: <Home size={16} />, active: true },
          { label: 'Analytics', href: '#', icon: <BarChart size={16} /> },
          {
            label: 'Resources',
            icon: <Server size={16} />,
            items: [
              { label: 'Databases', href: '#' },
              { label: 'Servers', href: '#' },
            ],
          },
          { label: 'Users', href: '#', icon: <Users size={16} /> },
          {
            label: 'Settings',
            icon: <Settings size={16} />,
            items: [
              { label: 'General', href: '#' },
              { label: 'Security', href: '#' },
            ],
          },
        ]}
      />
      <SideNav
        collapsed
        items={[
          { label: 'Home', href: '#', icon: <Home size={16} />, active: true },
          { label: 'Analytics', href: '#', icon: <BarChart size={16} /> },
          { label: 'Users', href: '#', icon: <Users size={16} /> },
          { label: 'Ungrouped', href: '#' },
        ]}
      />
    </div>
  )
}

function ModalDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm action"
        description="This action cannot be undone."
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => setOpen(false)}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}

function ToggleDemo() {
  const [on, setOn] = useState(true)
  return (
    <Row>
      <Toggle label="Dark mode" checked={on} onChange={setOn} />
      <Toggle label="Compact" size="sm" defaultChecked />
    </Row>
  )
}

function ToastInner() {
  const { toast } = useToast()
  return (
    <Button
      variant="secondary"
      onClick={() =>
        toast({ title: 'Saved', description: 'Your changes are safe.', variant: 'success' })
      }
    >
      Show toast
    </Button>
  )
}

function ToastDemo() {
  return (
    <ToastProvider>
      <ToastInner />
    </ToastProvider>
  )
}

function ButtonGroupDemo() {
  return (
    <Col>
      <StandaloneButtonGroup roving>
        <Button variant="secondary">Bold</Button>
        <Button variant="secondary">Italic</Button>
        <Button variant="secondary">Underline</Button>
      </StandaloneButtonGroup>
      <StandaloneButtonGroup orientation="vertical">
        <Button variant="secondary">Option A</Button>
        <Button variant="secondary">Option B</Button>
        <Button variant="secondary">Option C</Button>
      </StandaloneButtonGroup>
    </Col>
  )
}

function CalendarDemo() {
  const [date, setDate] = useState<Date | null>(null)
  return (
    <Col>
      <Calendar value={date} onValueChange={setDate} />
    </Col>
  )
}

function CarouselDemo() {
  const [index, setIndex] = useState(0)
  return (
    <Carousel
      slides={[
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--cascivo-color-bg-subtle)',
            borderRadius: 'var(--cascivo-radius-md)',
          }}
        >
          Slide 1 of 3
        </div>,
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--cascivo-color-bg-subtle)',
            borderRadius: 'var(--cascivo-radius-md)',
          }}
        >
          Slide 2 of 3
        </div>,
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--cascivo-color-bg-subtle)',
            borderRadius: 'var(--cascivo-radius-md)',
          }}
        >
          Slide 3 of 3
        </div>,
      ]}
      index={index}
      onIndexChange={setIndex}
      loop
    />
  )
}

function CollapsibleDemo() {
  return (
    <Col>
      <Collapsible trigger="Advanced options" defaultOpen>
        <Col>
          <Input label="Custom endpoint" placeholder="https://api.example.com" />
          <Toggle label="Enable debug logging" />
        </Col>
      </Collapsible>
    </Col>
  )
}

function ColorPickerDemo() {
  const [color, setColor] = useState('#3b82f6')
  return (
    <ColorPicker
      value={color}
      onValueChange={setColor}
      label="Brand color"
      presets={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
    />
  )
}

function DateRangePickerDemo() {
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null)
  return (
    <Col>
      <DateRangePicker value={range} onValueChange={setRange} placeholder="Select date range" />
    </Col>
  )
}

function SwapDemo() {
  const [checked, setChecked] = useState(false)
  return (
    <Row>
      <Swap checked={checked} onChange={setChecked} on="Light" off="Dark" mode="rotate" />
      <span
        style={{ fontSize: 'var(--cascivo-text-sm)', color: 'var(--cascivo-color-text-subtle)' }}
      >
        {checked ? 'Light mode' : 'Dark mode'}
      </span>
    </Row>
  )
}

function ToggleGroupDemo() {
  const [value, setValue] = useState<string>('week')
  return (
    <Col>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => {
          if (typeof v === 'string') setValue(v)
        }}
        items={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
      />
    </Col>
  )
}

function TreeViewDemo() {
  return (
    <TreeView
      items={[
        {
          id: 'src',
          label: 'src',
          children: [
            {
              id: 'components',
              label: 'components',
              children: [
                { id: 'button', label: 'button.tsx' },
                { id: 'input', label: 'input.tsx' },
              ],
            },
            { id: 'main', label: 'main.tsx' },
          ],
        },
      ]}
      defaultExpanded={['src', 'components']}
    />
  )
}

export const demos: Record<string, () => JSX.Element> = {
  'avatar-group': () => (
    <AvatarGroup max={3} total={5}>
      <Avatar fallback="AC" />
      <Avatar fallback="BS" />
      <Avatar fallback="CD" />
      <Avatar fallback="DW" />
    </AvatarGroup>
  ),
  user: () => <User name="Jane Doe" description="jane@acme.com" avatarProps={{ fallback: 'JD' }} />,
  'qr-code': () => <QrCode value="https://cascivo.com" size={120} />,
  'relative-time': () => <RelativeTime date={Date.now() - 3600_000} />,
  toggletip: () => (
    <Toggletip trigger={<Info />}>Your password must contain at least 12 characters.</Toggletip>
  ),
  button: () => (
    <Row>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </Row>
  ),
  input: () => (
    <Col>
      <Input label="Email address" placeholder="you@example.com" />
      <Input label="With hint" placeholder="Enter username" hint="Must be 3–20 characters" />
      <Input label="With error" error="Invalid email" defaultValue="not-an-email" />
    </Col>
  ),
  card: () => (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Elevated card</CardTitle>
      </CardHeader>
      <CardContent>Shadow-elevated card. The shadow defines the boundary.</CardContent>
      <CardFooter>
        <Button size="sm" variant="ghost">
          Learn more
        </Button>
      </CardFooter>
    </Card>
  ),
  badge: () => (
    <Row>
      <Badge variant="default">New</Badge>
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="destructive">Deprecated</Badge>
      <Badge variant="outline">Beta</Badge>
    </Row>
  ),
  modal: () => <ModalDemo />,
  spinner: () => (
    <Row>
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </Row>
  ),
  separator: () => (
    <Col>
      <span>Above</span>
      <Separator />
      <span>Below</span>
    </Col>
  ),
  alert: () => (
    <Col>
      <Alert variant="info" title="Heads up">
        Your trial ends in 3 days.
      </Alert>
      <Alert variant="success" title="Saved" dismissible>
        Your changes have been saved.
      </Alert>
      <Alert variant="destructive" title="Something went wrong" dismissible>
        We couldn't process your request.
      </Alert>
    </Col>
  ),
  avatar: () => (
    <Row>
      <Avatar fallback="JD" status="online" />
      <Avatar fallback="AB" size="lg" status="busy" />
      <Avatar src="https://invalid.example/x.png" alt="Broken" fallback="CD" size="xl" />
    </Row>
  ),
  textarea: () => (
    <Col>
      <Textarea label="Message" placeholder="Tell us what you think…" hint="Up to 500 chars" />
    </Col>
  ),
  select: () => (
    <Col>
      <Select
        label="Role"
        placeholder="Choose a role"
        options={[
          { value: 'admin', label: 'Admin' },
          { value: 'editor', label: 'Editor' },
          { value: 'viewer', label: 'Viewer' },
        ]}
      />
    </Col>
  ),
  checkbox: () => (
    <Col>
      <Checkbox label="Email notifications" defaultChecked />
      <Checkbox label="SMS notifications" />
      <Checkbox label="Select all" indeterminate />
    </Col>
  ),
  radio: () => (
    <RadioGroup name="plan" defaultValue="pro">
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
      <Radio value="team" label="Team" />
    </RadioGroup>
  ),
  toggle: () => <ToggleDemo />,
  slider: () => (
    <Col>
      <Slider label="Volume" defaultValue={60} />
    </Col>
  ),
  tooltip: () => (
    <Tooltip content="Copied to clipboard">
      <Button variant="secondary">Hover for tooltip</Button>
    </Tooltip>
  ),
  dropdown: () => (
    <Dropdown
      trigger={<Button>Actions ▾</Button>}
      items={[
        { label: 'Edit', value: 'edit' },
        { label: 'Duplicate', value: 'duplicate' },
        { separator: true, label: '', value: 'sep' },
        { label: 'Delete', value: 'delete' },
      ]}
    />
  ),
  toast: () => <ToastDemo />,
  tabs: () => (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Manage your account settings and preferences.</TabsContent>
      <TabsContent value="password">Update your password and security options.</TabsContent>
      <TabsContent value="team">Invite teammates and manage their roles.</TabsContent>
    </Tabs>
  ),
  accordion: () => (
    <Accordion type="single" defaultValue="what">
      <AccordionItem value="what">
        <AccordionTrigger>What is cascivo?</AccordionTrigger>
        <AccordionContent>
          A CSS-native, signal-driven, AI-first React design system.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="how">
        <AccordionTrigger>How do I install it?</AccordionTrigger>
        <AccordionContent>Run npx cascivo add &lt;component&gt; to copy it in.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  kbd: () => (
    <Row>
      <span>
        Press <Kbd>⌘</Kbd> + <Kbd>K</Kbd> to search
      </span>
      <Kbd size="sm">Esc</Kbd>
    </Row>
  ),
  link: () => (
    <Row>
      <Link href="#">Standalone link</Link>
      <span>
        Inline text with an{' '}
        <Link variant="inline" href="#">
          inline link
        </Link>{' '}
        inside.
      </span>
      <Link href="https://example.com" external>
        External link
      </Link>
    </Row>
  ),
  breadcrumb: () => (
    <Col>
      <Breadcrumb
        items={[
          { label: 'Home', href: '#' },
          { label: 'Components', href: '#' },
          { label: 'Breadcrumb' },
        ]}
      />
      <Breadcrumb
        maxVisible={3}
        items={[
          { label: 'Home', href: '#' },
          { label: 'Design', href: '#' },
          { label: 'Tokens', href: '#' },
          { label: 'Color' },
        ]}
      />
    </Col>
  ),
  'side-nav': () => <SideNavDemo />,
  pagination: () => <PaginationDemo />,
  'progress-indicator': () => (
    <Col>
      <ProgressIndicator
        currentIndex={1}
        steps={[
          { label: 'Account', description: 'Basic info' },
          { label: 'Profile', description: 'Your details' },
          { label: 'Review' },
        ]}
      />
      <ProgressIndicator
        vertical
        currentIndex={2}
        steps={[{ label: 'Select plan' }, { label: 'Payment' }, { label: 'Confirm' }]}
      />
    </Col>
  ),
  tag: () => (
    <Row>
      <Tag>Default</Tag>
      <Tag variant="info">Info</Tag>
      <Tag variant="success">Success</Tag>
      <Tag variant="warning">Warning</Tag>
      <Tag variant="error">Error</Tag>
      <Tag variant="info" onDismiss={() => {}}>
        Dismissible
      </Tag>
      <Tag size="sm">Small</Tag>
    </Row>
  ),
  skeleton: () => (
    <Col>
      <Skeleton variant="text" lines={3} />
      <Row>
        <Skeleton variant="circle" width="3rem" height="3rem" />
        <Skeleton variant="rect" width="8rem" height="3rem" />
      </Row>
    </Col>
  ),
  'progress-bar': () => (
    <Col>
      <ProgressBar label="Uploading" value={65} helperText="65 of 100 MB" />
      <ProgressBar label="Complete" value={100} status="success" />
      <ProgressBar label="Failed" value={40} status="error" helperText="Network error" />
      <ProgressBar label="Loading" size="sm" />
    </Col>
  ),
  'empty-state': () => (
    <Col>
      <EmptyState
        icon="📭"
        title="No messages yet"
        description="When you receive messages, they'll appear here."
        action={<Button size="sm">Compose</Button>}
      />
      <EmptyState size="lg" title="No results" description="Try adjusting your search filters." />
    </Col>
  ),
  'overflow-menu': () => (
    <Row>
      <OverflowMenu
        items={[
          { label: 'Edit', value: 'edit' },
          { label: 'Duplicate', value: 'duplicate' },
          { label: 'Delete', value: 'delete', destructive: true },
        ]}
        onSelect={() => {}}
      />
      <OverflowMenu
        size="sm"
        items={[
          { label: 'View', value: 'view' },
          { label: 'Archive', value: 'archive' },
        ]}
        onSelect={() => {}}
      />
    </Row>
  ),
  'number-input': () => <NumberInputDemo />,
  'data-table': () => <DataTableDemo />,
  'command-menu': () => <CommandMenuDemo />,
  form: () => <FormDemo />,
  'time-picker': () => (
    <Col>
      <TimePicker label="Meeting time" defaultValue="09:00" />
      <TimePicker label="With error" error="Invalid time" />
      <TimePicker label="Disabled" defaultValue="14:00" disabled />
    </Col>
  ),
  combobox: () => (
    <Col>
      <Combobox
        label="Country"
        options={[
          { value: 'us', label: 'United States' },
          { value: 'de', label: 'Germany' },
          { value: 'fr', label: 'France' },
        ]}
      />
      <Combobox
        label="Clearable"
        options={[
          { value: 'a', label: 'Apple' },
          { value: 'b', label: 'Banana' },
        ]}
        defaultValue="a"
        clearable
      />
      <Combobox label="With error" options={[{ value: 'x', label: 'Option X' }]} error="Required" />
    </Col>
  ),
  'date-picker': () => (
    <Col>
      <DatePicker label="Appointment" />
      <DatePicker label="Clearable" defaultValue="2024-06-15" clearable />
      <DatePicker label="With error" error="Date required" />
      <DatePicker label="Disabled" defaultValue="2024-01-01" disabled />
    </Col>
  ),
  'file-uploader': () => <FileUploaderDemo />,
  popover: () => (
    <Popover>
      <PopoverTrigger>
        <Button variant="secondary">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p style={{ margin: 0 }}>Anchored floating panel via CSS Anchor Positioning.</p>
      </PopoverContent>
    </Popover>
  ),
  menu: () => (
    <Menu>
      <MenuTrigger>
        <Button variant="secondary">Actions ▾</Button>
      </MenuTrigger>
      <MenuItem onSelect={() => {}}>Edit</MenuItem>
      <MenuItem onSelect={() => {}}>Duplicate</MenuItem>
      <MenuSeparator />
      <MenuItem onSelect={() => {}}>Delete</MenuItem>
    </Menu>
  ),
  'alert-dialog': () => <AlertDialogDemo />,
  sheet: () => <SheetDemo />,
  'context-menu': () => (
    <ContextMenu>
      <div
        style={{
          padding: '2rem',
          border: '2px dashed',
          borderRadius: '0.5rem',
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        Right-click anywhere here
      </div>
      <ContextMenuItem onSelect={() => {}}>Copy</ContextMenuItem>
      <ContextMenuItem onSelect={() => {}}>Paste</ContextMenuItem>
    </ContextMenu>
  ),
  'hover-card': () => (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger>
        <a href="#" style={{ textDecoration: 'underline' }}>
          @cascivo
        </a>
      </HoverCardTrigger>
      <HoverCardContent>
        <div>
          <strong>cascivo</strong>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            CSS-native, signal-driven, AI-first React design system.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
  'password-input': () => (
    <Col>
      <PasswordInput placeholder="Enter password" />
      <PasswordInput showStrengthMeter placeholder="Create password" />
    </Col>
  ),
  'multi-select': () => (
    <MultiSelect
      options={[
        { label: 'React', value: 'react' },
        { label: 'Vue', value: 'vue' },
        { label: 'Svelte', value: 'svelte' },
        { label: 'Angular', value: 'angular' },
      ]}
      value={['react']}
      onValueChange={() => {}}
      placeholder="Select frameworks"
    />
  ),
  'tags-input': () => (
    <TagsInput value={['react', 'typescript']} onValueChange={() => {}} placeholder="Add tag…" />
  ),
  'otp-input': () => <OtpInput value="123" onValueChange={() => {}} />,
  'segmented-control': () => (
    <SegmentedControl
      options={[
        { label: 'Day', value: 'day' },
        { label: 'Week', value: 'week' },
        { label: 'Month', value: 'month' },
      ]}
      value="week"
      onValueChange={() => {}}
    />
  ),
  'input-group': () => (
    <Col>
      <InputGroup prefix="https://">
        <Input placeholder="example.com" />
      </InputGroup>
      <InputGroup suffix=".com">
        <Input placeholder="Enter domain" />
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <svg viewBox="0 0 16 16" width="16" height="16">
            <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </InputGroupAddon>
        <Input placeholder="Search…" aria-label="Search" />
      </InputGroup>
      <ButtonGroup>
        <Button variant="secondary">Left</Button>
        <Button variant="secondary">Center</Button>
        <Button variant="secondary">Right</Button>
      </ButtonGroup>
    </Col>
  ),
  'rating-group': () => (
    <Col>
      <RatingGroup value={3} onValueChange={() => {}} />
      <RatingGroup value={4} readOnly size="lg" />
    </Col>
  ),
  editable: () => (
    <Col>
      <Editable value="Click to edit this text" onValueChange={() => {}} />
      <Editable value="" onValueChange={() => {}} placeholder="Add a title…" />
    </Col>
  ),
  switcher: () => (
    <Switcher
      items={[
        { label: 'Console', href: '#', active: true, icon: <Grid size={16} /> },
        { label: 'Billing', href: '#' },
        { divider: true },
        { label: 'Documentation', href: '#' },
      ]}
    />
  ),
  'radio-card': () => (
    <RadioCardGroup name="plan-demo" defaultValue="pro" label="Plan">
      <RadioCard value="free" title="Free" description="2 projects, community support" />
      <RadioCard value="pro" title="Pro" description="Unlimited projects, email support" />
      <RadioCard value="team" title="Team" description="SSO, audit log, priority support" />
    </RadioCardGroup>
  ),
  'checkbox-card': () => (
    <div style={{ display: 'grid', gap: 12 }}>
      <CheckboxCard
        title="Automated backups"
        description="Daily snapshots, 30-day retention"
        defaultChecked
      />
      <CheckboxCard title="Monitoring" description="Metrics + alerting" />
      <CheckboxCard title="Audit log" description="Requires Team plan" disabled />
    </div>
  ),
  'header-panel': () => <HeaderPanelDemo />,
  // ShellHeader is the console application header. Header is the marketing/landing header.
  // Use ShellHeader for console apps; use Header for landing pages.
  'shell-header': () => (
    <ShellHeader
      brand={{ prefix: 'cascivo', name: 'Console', href: '#' }}
      nav={[
        { label: 'Overview', href: '#', active: true },
        {
          label: 'Resources',
          items: [
            { label: 'Instances', href: '#' },
            { label: 'Volumes', href: '#' },
          ],
        },
      ]}
      actions={[
        {
          id: 'help',
          label: 'Help',
          icon: (
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M6.5 6a1.5 1.5 0 0 1 3 .5c0 .8-.8 1.2-1.5 2M8 11.5v.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ),
        },
      ]}
    />
  ),
  blockquote: () => (
    <Blockquote>
      The heart of software is its ability to solve domain-related problems for its user.
    </Blockquote>
  ),
  code: () => (
    <Row>
      <Code>const x = signal(42)</Code>
      <Code size="sm">npm install</Code>
    </Row>
  ),
  'code-snippet': () => (
    <Col>
      <CodeSnippet variant="single" code={`import { Button } from '@cascivo/components/button'`} />
      <CodeSnippet
        variant="multi"
        code={`export function App() {\n  return <Button>Get started</Button>\n}`}
        showLineNumbers
      />
    </Col>
  ),
  heading: () => (
    <Col>
      <Heading level={1} size="xl">
        Heading 1
      </Heading>
      <Heading level={2} size="lg">
        Heading 2
      </Heading>
      <Heading level={3}>Heading 3</Heading>
      <Heading level={4} size="sm">
        Heading 4
      </Heading>
    </Col>
  ),
  text: () => (
    <Col>
      <Text>Body text at default size — readable at paragraph scale.</Text>
      <Text size="sm" muted>
        Small subtle text for captions or helper hints.
      </Text>
    </Col>
  ),
  prose: () => (
    <Prose>
      <h2>Design principles</h2>
      <p>
        cascivo is CSS-native, signal-driven, and AI-first. Every component is owned by your
        project.
      </p>
      <ul>
        <li>No Tailwind required</li>
        <li>Copy-paste via CLI</li>
      </ul>
    </Prose>
  ),
  label: () => (
    <Col>
      <Label>Email address</Label>
      <Label required>Required field</Label>
      <Label disabled>Disabled field</Label>
    </Col>
  ),
  'icon-button': () => (
    <Row>
      <IconButton label="Edit" icon={<Edit size={16} />} />
      <IconButton label="Add" icon={<Plus size={16} />} variant="outline" />
      <IconButton label="Settings" icon={<Settings size={16} />} size="sm" />
    </Row>
  ),
  status: () => (
    <Col>
      <Status status="success">Operational</Status>
      <Status status="warning">Degraded</Status>
      <Status status="error">Outage</Status>
      <Status status="neutral" pulse>
        Checking
      </Status>
    </Col>
  ),
  stat: () => (
    <Row>
      <Stat label="Revenue" value="$12,400" delta="+8.2%" trend="up" />
      <Stat label="Uptime" value="99.9%" />
      <Stat label="Errors" value="3" delta="-1" trend="down" />
    </Row>
  ),
  notification: () => (
    <Col>
      <Notification
        title="Deployment complete"
        description="v2.1.0 shipped to production."
        variant="success"
      />
      <Notification
        title="High memory usage"
        description="Instance memory exceeds 90%."
        variant="warning"
        dismissible
      />
    </Col>
  ),
  item: () => (
    <Col>
      <Item>First item</Item>
      <Item>Second item</Item>
      <Item>Third item</Item>
    </Col>
  ),
  list: () => (
    <Col>
      <List>
        <ListItem>Alpha</ListItem>
        <ListItem>Beta</ListItem>
        <ListItem>Gamma</ListItem>
      </List>
      <List as="ol" marker="decimal">
        <ListItem>First step</ListItem>
        <ListItem>Second step</ListItem>
      </List>
    </Col>
  ),
  'contained-list': () => (
    <ContainedList label="Team members">
      <ContainedListItem>Alice Chen</ContainedListItem>
      <ContainedListItem>Bob Smith</ContainedListItem>
      <ContainedListItem>Carol Davis</ContainedListItem>
    </ContainedList>
  ),
  'data-list': () => (
    <DataList
      items={[
        { label: 'Plan', value: 'Pro' },
        { label: 'Region', value: 'us-east-1' },
        { label: 'Status', value: 'Active' },
      ]}
    />
  ),
  'structured-list': () => (
    <StructuredList
      headers={['Name', 'Role', 'Status']}
      items={[
        { id: '1', cells: ['Alice Chen', 'Engineer', 'Active'] },
        { id: '2', cells: ['Bob Smith', 'Designer', 'Away'] },
      ]}
    />
  ),
  'native-select': () => (
    <Col>
      <NativeSelect
        aria-label="Country"
        placeholder="Choose a country"
        options={[
          { value: 'us', label: 'United States' },
          { value: 'de', label: 'Germany' },
          { value: 'fr', label: 'France' },
        ]}
      />
      <NativeSelect
        aria-label="Size"
        size="sm"
        options={[
          { value: 'xs', label: 'Extra small' },
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
        ]}
      />
    </Col>
  ),
  search: () => (
    <Col>
      <Search placeholder="Search components…" />
      <Search placeholder="Search files…" size="sm" />
    </Col>
  ),
  field: () => (
    <Col>
      <Field label="Username" description="3–20 characters, letters and numbers only">
        <Input placeholder="your-username" />
      </Field>
      <Field label="Email" required>
        <Input type="email" placeholder="you@example.com" />
      </Field>
      <Field label="API key" error="Invalid format — must start with sk-">
        <Input defaultValue="not-valid" />
      </Field>
    </Col>
  ),
  'inline-loading': () => (
    <Col>
      <InlineLoading status="active" label="Loading data…" />
      <InlineLoading status="finished" label="Data loaded" />
      <InlineLoading status="error" label="Failed to load" />
    </Col>
  ),
  'copy-button': () => (
    <Row>
      <CopyButton value="npx cascivo add button" />
      <CopyButton value="npm install @cascivo/core" size="sm" />
    </Row>
  ),
  progress: () => (
    <Col>
      <Progress value={65} aria-label="Uploading" />
      <Progress value={100} variant="success" aria-label="Complete" />
      <Progress variant="error" aria-label="Failed" />
      <Progress size="sm" value={40} aria-label="Loading" />
    </Col>
  ),
  'progress-circle': () => (
    <Row>
      <ProgressCircle value={75} />
      <ProgressCircle value={45} size="sm" />
      <ProgressCircle value={90} size="lg" />
    </Row>
  ),
  'radial-progress': () => (
    <Row>
      <RadialProgress value={65}>65%</RadialProgress>
      <RadialProgress value={90} variant="success" size="sm" />
      <RadialProgress value={30} variant="error">
        30%
      </RadialProgress>
    </Row>
  ),
  'chat-bubble': () => (
    <Col>
      <ChatBubble side="start" name="Alice" time="2:14 PM">
        Hey, have you seen the new cascivo docs?
      </ChatBubble>
      <ChatBubble side="end" time="2:15 PM">
        Yes! The component previews are looking great.
      </ChatBubble>
    </Col>
  ),
  steps: () => (
    <Col>
      <Steps
        steps={[
          { label: 'Account', state: 'complete' },
          { label: 'Profile', state: 'active' },
          { label: 'Review', state: 'pending' },
        ]}
      />
    </Col>
  ),
  filter: () => (
    <Filter
      defaultValue={['react']}
      options={[
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
        { value: 'svelte', label: 'Svelte' },
        { value: 'angular', label: 'Angular' },
      ]}
    />
  ),
  timeline: () => (
    <Timeline
      items={[
        { id: '1', title: 'Deployment started', time: '2:00 PM', status: 'complete' },
        { id: '2', title: 'Tests passed', time: '2:03 PM', status: 'current' },
        { id: '3', title: 'Deploy to production', status: 'upcoming' },
      ]}
    />
  ),
  tile: () => (
    <Row>
      <Tile value="free">Free plan</Tile>
      <Tile value="pro" defaultSelected>
        Pro plan
      </Tile>
      <Tile value="team">Team plan</Tile>
    </Row>
  ),
  'menu-button': () => (
    <MenuButton
      label="Actions"
      items={[
        { id: 'edit', label: 'Edit' },
        { id: 'duplicate', label: 'Duplicate' },
        { id: 'delete', label: 'Delete' },
      ]}
    />
  ),
  'button-group': () => <ButtonGroupDemo />,
  calendar: () => <CalendarDemo />,
  carousel: () => <CarouselDemo />,
  collapsible: () => <CollapsibleDemo />,
  'color-picker': () => <ColorPickerDemo />,
  'date-range-picker': () => <DateRangePickerDemo />,
  swap: () => <SwapDemo />,
  'toggle-group': () => <ToggleGroupDemo />,
  'tree-view': () => <TreeViewDemo />,
}

function HeaderPanelDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ minBlockSize: '120px' }}>
      <Button onClick={() => setOpen((v) => !v)}>Toggle panel</Button>
      <HeaderPanel open={open} onClose={() => setOpen(false)} label="Notifications">
        <p style={{ margin: 0 }}>3 unread notifications</p>
      </HeaderPanel>
    </div>
  )
}

function AlertDialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete item
      </Button>
      <AlertDialog
        open={open}
        title="Delete item"
        description="This cannot be undone. The item will be permanently deleted."
        variant="destructive"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

function SheetDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open settings
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Settings">
        <p>Configure your preferences here.</p>
      </Sheet>
    </>
  )
}

function FileUploaderDemo() {
  const [files, setFiles] = useState<UploaderFile[]>([
    { id: '1', name: 'report.pdf', size: 1024 * 102, status: 'complete' },
    { id: '2', name: 'data.csv', size: 1024 * 5, status: 'uploading' },
  ])
  return (
    <FileUploader
      files={files}
      multiple
      onFilesAdded={(added) => {
        const next: UploaderFile[] = added.map((f) => ({
          id: crypto.randomUUID(),
          name: f.name,
          size: f.size,
          status: 'uploading' as const,
        }))
        setFiles((prev) => [...prev, ...next])
      }}
      onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
    />
  )
}
