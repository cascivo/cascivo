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
}
