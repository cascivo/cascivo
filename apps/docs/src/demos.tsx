import { useState } from 'preact/hooks'
import type { ComponentChildren, JSX } from 'preact'
import { Button } from '@cascade-ui/components/button'
import { Input } from '@cascade-ui/components/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@cascade-ui/components/card'
import { Badge } from '@cascade-ui/components/badge'
import { Modal } from '@cascade-ui/components/modal'
import { Spinner } from '@cascade-ui/components/spinner'
import { Separator } from '@cascade-ui/components/separator'
import { Alert } from '@cascade-ui/components/alert'
import { Avatar } from '@cascade-ui/components/avatar'
import { Textarea } from '@cascade-ui/components/textarea'
import { Select } from '@cascade-ui/components/select'
import { Checkbox } from '@cascade-ui/components/checkbox'
import { Radio, RadioGroup } from '@cascade-ui/components/radio'
import { Toggle } from '@cascade-ui/components/toggle'
import { Slider } from '@cascade-ui/components/slider'
import { Tooltip } from '@cascade-ui/components/tooltip'
import { Dropdown } from '@cascade-ui/components/dropdown'
import { ToastProvider, useToast } from '@cascade-ui/components/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@cascade-ui/components/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@cascade-ui/components/accordion'
import { Kbd } from '@cascade-ui/components/kbd'
import { Link } from '@cascade-ui/components/link'
import { Breadcrumb } from '@cascade-ui/components/breadcrumb'
import { SideNav } from '@cascade-ui/components/side-nav'
import { Pagination } from '@cascade-ui/components/pagination'
import { ProgressIndicator } from '@cascade-ui/components/progress-indicator'
import { Tag } from '@cascade-ui/components/tag'
import { Skeleton } from '@cascade-ui/components/skeleton'
import { ProgressBar } from '@cascade-ui/components/progress-bar'
import { EmptyState } from '@cascade-ui/components/empty-state'
import { OverflowMenu } from '@cascade-ui/components/overflow-menu'
import { NumberInput } from '@cascade-ui/components/number-input'
import { DataTable, type Column } from '@cascade-ui/components/data-table'
import { CommandMenu, type CommandGroup } from '@cascade-ui/components/command-menu'
import { Form, useForm } from '@cascade-ui/components/form'
import { Combobox } from '@cascade-ui/components/combobox'
import { TimePicker } from '@cascade-ui/components/time-picker'
import { DatePicker } from '@cascade-ui/components/date-picker'
import { FileUploader, type UploaderFile } from '@cascade-ui/components/file-uploader'

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
    items: [
      { id: 'theme', label: 'Toggle theme', shortcut: ['⌘', 'T'], onSelect: () => {} },
    ],
  },
]

function CommandMenuDemo() {
  const [open, setOpen] = useState(false)
  return (
    <Row>
      <button type="button" onClick={() => setOpen(true)}>
        Open CommandMenu <kbd>⌘K</kbd>
      </button>
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        groups={commandGroups}
        hotkey={false}
      />
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
    <div style={{ height: '240px', display: 'flex' }}>
      <SideNav
        items={[
          { label: 'Dashboard', href: '#', active: true },
          { label: 'Components', href: '#' },
          {
            label: 'Settings',
            items: [
              { label: 'General', href: '#' },
              { label: 'Tokens', href: '#' },
            ],
          },
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

export const demos: Record<string, () => JSX.Element> = {
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
        <AccordionTrigger>What is cascade?</AccordionTrigger>
        <AccordionContent>
          A CSS-native, signal-driven, AI-first React design system.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="how">
        <AccordionTrigger>How do I install it?</AccordionTrigger>
        <AccordionContent>Run npx cascade add &lt;component&gt; to copy it in.</AccordionContent>
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
  'form': () => <FormDemo />,
  'time-picker': () => (
    <Col>
      <TimePicker label="Meeting time" defaultValue="09:00" />
      <TimePicker label="With error" error="Invalid time" />
      <TimePicker label="Disabled" defaultValue="14:00" disabled />
    </Col>
  ),
  'combobox': () => (
    <Col>
      <Combobox label="Country" options={[{ value: 'us', label: 'United States' }, { value: 'de', label: 'Germany' }, { value: 'fr', label: 'France' }]} />
      <Combobox label="Clearable" options={[{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]} defaultValue="a" clearable />
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
