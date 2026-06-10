import type { ReactNode } from 'react'
import { Button } from '@cascade-ui/components/button'
import { Input } from '@cascade-ui/components/input'
import { Badge } from '@cascade-ui/components/badge'
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
import { Card, CardContent } from '@cascade-ui/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cascade-ui/components/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@cascade-ui/components/accordion'

const THEMES = ['light', 'dark', 'warm'] as const

interface Tile {
  name: string
  demo: ReactNode
}

const TILES: Tile[] = [
  { name: 'Button', demo: <Button>Click me</Button> },
  { name: 'Input', demo: <Input label="Email" placeholder="you@example.com" /> },
  {
    name: 'Card',
    demo: (
      <Card padding="sm">
        <CardContent>Grouped content</CardContent>
      </Card>
    ),
  },
  {
    name: 'Badge',
    demo: (
      <div className="tile-row">
        <Badge variant="success">Active</Badge>
        <Badge variant="warning">Pending</Badge>
      </div>
    ),
  },
  { name: 'Modal', demo: <Button variant="secondary">Open dialog…</Button> },
  { name: 'Spinner', demo: <Spinner /> },
  {
    name: 'Separator',
    demo: (
      <div className="tile-row">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>API</span>
      </div>
    ),
  },
  {
    name: 'Alert',
    demo: (
      <Alert variant="info" title="Heads up">
        Trial ends soon.
      </Alert>
    ),
  },
  { name: 'Avatar', demo: <Avatar fallback="JD" status="online" /> },
  { name: 'Textarea', demo: <Textarea label="Message" rows={2} placeholder="Say hi…" /> },
  {
    name: 'Select',
    demo: (
      <Select
        label="Role"
        placeholder="Choose"
        options={[
          { value: 'admin', label: 'Admin' },
          { value: 'editor', label: 'Editor' },
        ]}
      />
    ),
  },
  { name: 'Checkbox', demo: <Checkbox label="Subscribe" defaultChecked /> },
  {
    name: 'Radio',
    demo: (
      <RadioGroup name="grid-plan" defaultValue="pro">
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
      </RadioGroup>
    ),
  },
  { name: 'Toggle', demo: <Toggle label="Dark mode" defaultChecked /> },
  { name: 'Slider', demo: <Slider label="Volume" defaultValue={60} /> },
  {
    name: 'Tooltip',
    demo: (
      <Tooltip content="Hello there">
        <Button variant="ghost">Hover me</Button>
      </Tooltip>
    ),
  },
  {
    name: 'Dropdown',
    demo: (
      <Dropdown
        trigger={<Button variant="secondary">Actions ▾</Button>}
        items={[
          { label: 'Edit', value: 'edit' },
          { label: 'Delete', value: 'delete' },
        ]}
      />
    ),
  },
  { name: 'Toast', demo: <Button variant="secondary">Show toast</Button> },
  {
    name: 'Tabs',
    demo: (
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First panel</TabsContent>
        <TabsContent value="two">Second panel</TabsContent>
      </Tabs>
    ),
  },
  {
    name: 'Accordion',
    demo: (
      <Accordion type="single" defaultValue="a">
        <AccordionItem value="a">
          <AccordionTrigger>Details</AccordionTrigger>
          <AccordionContent>Collapsible content.</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
]

export function ComponentGrid() {
  return (
    <section className="section">
      <h2>All 20 components, three themes</h2>
      <p className="section-sub">
        Each tile is a live component — rendered in light, dark, or warm to show how themes scope to
        any container.
      </p>
      <div className="component-grid">
        {TILES.map((tile, i) => (
          <div key={tile.name} className="component-tile" data-theme={THEMES[i % THEMES.length]}>
            <div className="component-tile-demo">{tile.demo}</div>
            <div className="component-tile-name">{tile.name}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
