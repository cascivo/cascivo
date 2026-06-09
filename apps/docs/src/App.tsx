import { useState } from 'preact/hooks'
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

type Theme = 'light' | 'dark' | 'warm'

export function App() {
  const [theme, setTheme] = useState<Theme>('light')
  const [modalOpen, setModalOpen] = useState(false)
  const [sizeModalOpen, setSizeModalOpen] = useState(false)
  const [loadingBtn, setLoadingBtn] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  const handleTheme = (t: Theme) => {
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
  }

  const handleLoadingDemo = () => {
    setLoadingBtn(true)
    setTimeout(() => setLoadingBtn(false), 2000)
  }

  return (
    <ToastProvider>
      <div class="docs-root">
        <header class="docs-header">
          <div class="docs-logo">
            <span>cascade</span> ui
          </div>
          <div class="theme-switcher">
            {(['light', 'dark', 'warm'] as Theme[]).map((t) => (
              <button
                key={t}
                class={`theme-btn ${theme === t ? 'active' : ''}`}
                onClick={() => handleTheme(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        <main class="docs-main">
          {/* ── Button ─────────────────────────────────────── */}
          <section>
            <h2 class="section-title">Button</h2>
            <p class="section-desc">
              Triggers an action or event. Signal-driven loading state via micro-FSM.
            </p>

            <div class="demo-label">Variants</div>
            <div class="demo-row">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>

            <div class="demo-label">Sizes</div>
            <div class="demo-row">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>

            <div class="demo-label">States</div>
            <div class="demo-row">
              <Button disabled>Disabled</Button>
              <Button loading={loadingBtn} onClick={handleLoadingDemo}>
                {loadingBtn ? 'Saving…' : 'Click to load'}
              </Button>
            </div>
          </section>

          {/* ── Input ──────────────────────────────────────── */}
          <section>
            <h2 class="section-title">Input</h2>
            <p class="section-desc">Text input field with label, hint, and error states.</p>
            <div class="input-demo-col">
              <Input label="Email address" placeholder="you@example.com" />
              <Input
                label="With hint"
                placeholder="Enter username"
                hint="Must be 3–20 characters"
              />
              <Input
                label="With error"
                placeholder="Enter email"
                error="Invalid email address"
                defaultValue="not-an-email"
              />
              <Input label="Disabled" placeholder="Can't touch this" disabled />
            </div>
          </section>

          {/* ── Card ───────────────────────────────────────── */}
          <section>
            <h2 class="section-title">Card</h2>
            <p class="section-desc">Container for grouping related content. Three variants.</p>
            <div class="demo-grid">
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Default card</CardTitle>
                </CardHeader>
                <CardContent>
                  Standard bordered card. Good for dashboards and content sections.
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="ghost">
                    Learn more
                  </Button>
                </CardFooter>
              </Card>
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Elevated card</CardTitle>
                </CardHeader>
                <CardContent>
                  Shadow-elevated card. No border — the shadow defines the boundary.
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="ghost">
                    Learn more
                  </Button>
                </CardFooter>
              </Card>
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle>Outlined card</CardTitle>
                </CardHeader>
                <CardContent>Strong border, no shadow. Clear boundary without depth.</CardContent>
                <CardFooter>
                  <Button size="sm" variant="ghost">
                    Learn more
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          {/* ── Badge ──────────────────────────────────────── */}
          <section>
            <h2 class="section-title">Badge</h2>
            <p class="section-desc">Small status labels and category indicators.</p>

            <div class="demo-label">Variants</div>
            <div class="demo-row">
              <Badge variant="default">New</Badge>
              <Badge variant="secondary">Draft</Badge>
              <Badge variant="success">Active</Badge>
              <Badge variant="warning">Pending</Badge>
              <Badge variant="destructive">Deprecated</Badge>
              <Badge variant="outline">Beta</Badge>
            </div>

            <div class="demo-label">Sizes</div>
            <div class="demo-row">
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
            </div>

            <div class="demo-label">In context</div>
            <div class="demo-row">
              <Card variant="default" padding="sm">
                <CardContent>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>API Documentation</span>
                    <Badge variant="success" size="sm">
                      Live
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Modal ──────────────────────────────────────── */}
          <section>
            <h2 class="section-title">Modal</h2>
            <p class="section-desc">
              Accessible dialog using the native &lt;dialog&gt; element. Backdrop blur, Esc to
              close.
            </p>

            <div class="modal-trigger-row">
              <Button onClick={() => setModalOpen(true)}>Open modal</Button>
              <Button variant="secondary" onClick={() => setSizeModalOpen(true)}>
                Large modal
              </Button>
            </div>

            <Modal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Confirm action"
              description="This action cannot be undone. All associated data will be permanently removed."
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => setModalOpen(false)}>
                  Delete
                </Button>
              </div>
            </Modal>

            <Modal
              open={sizeModalOpen}
              onClose={() => setSizeModalOpen(false)}
              title="Large modal"
              size="lg"
            >
              <Input label="Your name" placeholder="Jane Smith" />
              <div
                style={{
                  marginBlockStart: '1rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                }}
              >
                <Button variant="secondary" onClick={() => setSizeModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setSizeModalOpen(false)}>Save</Button>
              </div>
            </Modal>
          </section>

          {/* ── Form controls ──────────────────────────────── */}
          <section>
            <h2 class="section-title">Form controls</h2>
            <p class="section-desc">
              Textarea, Select, Checkbox, Radio, Toggle, and Slider — native elements styled with
              tokens.
            </p>

            <div class="input-demo-col">
              <Textarea
                label="Message"
                placeholder="Tell us what you think…"
                hint="Up to 500 chars"
              />
              <Select
                label="Role"
                placeholder="Choose a role"
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'editor', label: 'Editor' },
                  { value: 'viewer', label: 'Viewer' },
                ]}
              />
              <Slider label="Volume" defaultValue={60} />
            </div>

            <div class="demo-label">Checkbox &amp; Radio</div>
            <div class="demo-row" style={{ gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Checkbox label="Email notifications" defaultChecked />
                <Checkbox label="SMS notifications" />
                <Checkbox label="Select all" indeterminate />
              </div>
              <RadioGroup name="plan" defaultValue="pro">
                <Radio value="free" label="Free" />
                <Radio value="pro" label="Pro" />
                <Radio value="team" label="Team" />
              </RadioGroup>
            </div>

            <div class="demo-label">Toggle</div>
            <div class="demo-row">
              <Toggle label="Dark mode" checked={darkMode} onChange={setDarkMode} />
              <Toggle label="Compact" size="sm" defaultChecked />
            </div>
          </section>

          {/* ── Feedback & display ─────────────────────────── */}
          <section>
            <h2 class="section-title">Feedback &amp; display</h2>
            <p class="section-desc">Alert, Avatar, Spinner, and Separator.</p>

            <div class="input-demo-col">
              <Alert variant="info" title="Heads up">
                Your trial ends in 3 days.
              </Alert>
              <Alert variant="success" title="Saved" dismissible>
                Your changes have been saved.
              </Alert>
              <Alert variant="destructive" title="Something went wrong" dismissible>
                We couldn't process your request.
              </Alert>
            </div>

            <div class="demo-label">Avatar</div>
            <div class="demo-row" style={{ alignItems: 'center' }}>
              <Avatar fallback="JD" status="online" />
              <Avatar fallback="AB" size="lg" status="busy" />
              <Avatar src="https://invalid.example/x.png" alt="Broken" fallback="CD" size="xl" />
              <Separator orientation="vertical" style={{ blockSize: '2rem' }} />
              <Spinner />
              <Spinner size="lg" />
            </div>
          </section>

          {/* ── Overlays ───────────────────────────────────── */}
          <section>
            <h2 class="section-title">Overlays</h2>
            <p class="section-desc">Tooltip, Dropdown, and Toast — signal-driven, CSS-animated.</p>

            <div class="demo-row" style={{ alignItems: 'center' }}>
              <Tooltip content="Copied to clipboard">
                <Button variant="secondary">Hover for tooltip</Button>
              </Tooltip>

              <Dropdown
                trigger={<Button>Actions ▾</Button>}
                items={[
                  { label: 'Edit', value: 'edit' },
                  { label: 'Duplicate', value: 'duplicate' },
                  { separator: true, label: '', value: 'sep' },
                  { label: 'Delete', value: 'delete' },
                ]}
                onSelect={(value) => console.log('selected', value)}
              />

              <ToastDemo />
            </div>
          </section>

          {/* ── Navigation ─────────────────────────────────── */}
          <section>
            <h2 class="section-title">Navigation</h2>
            <p class="section-desc">
              Tabs and Accordion — compound components sharing signal state.
            </p>

            <Tabs defaultValue="account">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                Manage your account settings and preferences.
              </TabsContent>
              <TabsContent value="password">Update your password and security options.</TabsContent>
              <TabsContent value="team">Invite teammates and manage their roles.</TabsContent>
            </Tabs>

            <div class="demo-label">Accordion</div>
            <Accordion type="single" defaultValue="what">
              <AccordionItem value="what">
                <AccordionTrigger>What is cascade?</AccordionTrigger>
                <AccordionContent>
                  A CSS-native, signal-driven, AI-first React design system.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how">
                <AccordionTrigger>How do I install it?</AccordionTrigger>
                <AccordionContent>
                  Run npx cascade add &lt;component&gt; to copy it in.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </main>
      </div>
    </ToastProvider>
  )
}

function ToastDemo() {
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
