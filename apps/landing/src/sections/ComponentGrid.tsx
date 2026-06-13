import type { ReactNode } from 'react'
import { Button } from '@cascivo/components/button'
import { Input } from '@cascivo/components/input'
import { Badge } from '@cascivo/components/badge'
import { Card } from '@cascivo/components/card'
import { Select } from '@cascivo/components/select'
import { Toggle } from '@cascivo/components/toggle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cascivo/components/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@cascivo/components/accordion'
import registry from '../../../../registry.json'

const componentCount = (registry as { components: unknown[] }).components.length

const THEMES = ['light', 'dark', 'warm', 'flat', 'minimal'] as const
type Theme = (typeof THEMES)[number]

interface Tile {
  name: string
  category: string
  demo: ReactNode
}

interface TileGroup {
  label: string
  tiles: Tile[]
}

const TILE_GROUPS: TileGroup[] = [
  {
    label: 'Inputs',
    tiles: [
      { name: 'Button', category: 'inputs', demo: <Button>Click me</Button> },
      {
        name: 'Input',
        category: 'inputs',
        demo: <Input label="Email" placeholder="you@example.com" />,
      },
      {
        name: 'Select',
        category: 'inputs',
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
    ],
  },
  {
    label: 'Display',
    tiles: [
      {
        name: 'Card',
        category: 'display',
        demo: <Card padding="sm">Grouped content</Card>,
      },
      {
        name: 'Badge',
        category: 'display',
        demo: (
          <div className="tile-row">
            <Badge variant="success">Active</Badge>
            <Badge variant="warning">Pending</Badge>
          </div>
        ),
      },
      {
        name: 'Toggle',
        category: 'display',
        demo: <Toggle label="Dark mode" defaultChecked />,
      },
    ],
  },
  {
    label: 'Overlay',
    tiles: [
      {
        name: 'Modal',
        category: 'overlay',
        demo: <Button variant="secondary">Open dialog…</Button>,
      },
      {
        name: 'Toast',
        category: 'overlay',
        demo: <Button variant="secondary">Show toast</Button>,
      },
    ],
  },
  {
    label: 'Navigation',
    tiles: [
      {
        name: 'Tabs',
        category: 'navigation',
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
        category: 'navigation',
        demo: (
          <Accordion type="single" defaultValue="a">
            <AccordionItem value="a">
              <AccordionTrigger>Details</AccordionTrigger>
              <AccordionContent>Collapsible content.</AccordionContent>
            </AccordionItem>
          </Accordion>
        ),
      },
    ],
  },
  {
    label: 'Feedback',
    tiles: [
      {
        name: 'Alert',
        category: 'feedback',
        demo: <Badge variant="secondary">New release available</Badge>,
      },
      {
        name: 'Progress',
        category: 'feedback',
        demo: (
          <div className="tile-row">
            <Badge variant="success">Done</Badge>
            <Badge variant="warning">In review</Badge>
          </div>
        ),
      },
    ],
  },
]

const ALL_TILES = TILE_GROUPS.flatMap((g) => g.tiles)

function themeForIndex(i: number): Theme {
  return THEMES[i % THEMES.length] as Theme
}

export function ComponentGrid() {
  return (
    <section className="section">
      <h2>{componentCount}+ components, blocks and charts. Ten themes.</h2>
      <p className="section-sub">
        A curated selection — the full set lives in the <a href="/docs">docs</a>.
      </p>
      <div className="component-grid">
        {ALL_TILES.map((tile, i) => (
          <div key={tile.name} className="component-tile" data-theme={themeForIndex(i)}>
            <div className="component-tile-demo">{tile.demo}</div>
            <div className="component-tile-name">{tile.name}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
