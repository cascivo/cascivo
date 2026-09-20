/**
 * Machine mode over the real catalog.
 *
 * `@cascivo/text`'s own tests assert the rules against hand-written HTML. They cannot catch
 * the failure that actually matters here: a component changing what it renders, and the
 * document quietly losing a heading, a value or a state. These assertions are written
 * against real component output for that reason, and they are exact — a diff is the signal.
 *
 * One case is load-bearing beyond itself. A chart serializes to a Markdown table with no
 * chart-specific code anywhere in the serializer, because `LineChart` already builds an
 * accessible data table for screen readers and machine mode reads the accessibility tree.
 * If that ever stops being true, the serializer has lost the contract it is built on, and
 * this is where it shows up.
 *
 * Not a full catalog sweep: `enhancement-renders.test.tsx` owns "every component renders
 * something perceivable", and duplicating its 72 fixtures here would be a second list to
 * keep in step for a weaker claim. These cover one component per serializer path.
 */
import type { ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LineChart } from '../../charts/src/index'
import { toMarkdown } from '../../text/src/index.ts'
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  DataTable,
  Dropdown,
  EmptyState,
  Input,
  Pagination,
  Select,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from './index'

const doc = (el: ReactElement): string => toMarkdown(renderToString(el))

describe('machine mode — the catalog as a document', () => {
  it('names a button and reports the states that matter, not the FSM at rest', () => {
    expect(doc(<Badge variant="success">Active</Badge>)).toBe('Active')
    expect(doc(<Checkbox label="Remember me" defaultChecked />)).toBe(
      '[checkbox: Remember me = checked]',
    )
  })

  it('keeps an alert title and body apart', () => {
    expect(
      doc(
        <Alert variant="destructive" title="Payment failed">
          Your card was declined.
        </Alert>,
      ),
    ).toBe('> [alert] Payment failed\n>\n> Your card was declined.')
  })

  it('renders a card as its heading and body', () => {
    expect(
      doc(
        <Card>
          <CardHeader>Revenue</CardHeader>
          <CardContent>€12,400 this month</CardContent>
        </Card>,
      ),
    ).toBe('Revenue\n\n€12,400 this month')
  })

  it('reports a field value next to its label, without printing the label twice', () => {
    expect(doc(<Input label="Email" defaultValue="ada@example.com" />)).toBe(
      'Email [input = "ada@example.com"]',
    )
    expect(doc(<Textarea label="Notes" defaultValue="Called on Tuesday." />)).toBe(
      'Notes [textarea = "Called on Tuesday."]',
    )
  })

  it('reports the selected option rather than every option concatenated', () => {
    expect(
      doc(
        <Select
          label="Plan"
          options={[
            { value: 'free', label: 'Free' },
            { value: 'pro', label: 'Pro' },
          ]}
          defaultValue="pro"
        />,
      ),
    ).toBe('Plan\n\n[select = Pro]')
  })

  it('reports a toggle as its value, not as a duplicate state', () => {
    expect(doc(<Switch label="Email alerts" defaultChecked />)).toBe(
      '[switch: Email alerts = checked]',
    )
  })

  it('lists a composite widget one item per line and marks the selection', () => {
    expect(
      doc(
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Overview</TabsTrigger>
            <TabsTrigger value="b">Usage</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Overview body</TabsContent>
        </Tabs>,
      ),
    ).toBe('[tab: Overview (selected)]\n[tab: Usage]\n\nOverview body')
  })

  it('surfaces a closed menu’s items — a document cannot be clicked open', () => {
    expect(
      doc(
        <Dropdown
          trigger={<span>Account</span>}
          items={[
            { label: 'Settings', value: 's' },
            { label: 'Sign out', value: 'o', disabled: true },
          ]}
        />,
      ),
    ).toBe('Account\n\n[menuitem: Settings]\n[menuitem: Sign out (disabled)]')
  })

  it('names a landmark that has a name, and renders a nav as a list', () => {
    expect(doc(<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Billing' }]} />)).toBe(
      '[nav: Breadcrumb]\n\n1. [Home](/)\n2. Billing',
    )
  })

  it('renders a data table as a Markdown table', () => {
    expect(
      doc(
        <DataTable
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'plan', header: 'Plan' },
          ]}
          rows={[
            { name: 'Ada', plan: 'Pro' },
            { name: 'Linus', plan: 'Free' },
          ]}
        />,
      ),
    ).toBe('| Name | Plan |\n| --- | --- |\n| Ada | Pro |\n| Linus | Free |')
  })

  it('renders an empty state as a heading and a description', () => {
    expect(
      doc(
        <EmptyState
          title="No invoices"
          description="Invoices appear here once you bill someone."
        />,
      ),
    ).toBe('### No invoices\n\nInvoices appear here once you bill someone.')
  })

  it('keeps a pagination summary and its controls legible', () => {
    expect(doc(<Pagination page={2} totalItems={48} pageSize={10} onPageChange={() => {}} />)).toBe(
      '[nav: Pagination]\n\n11–20 of 48 items\n\n[select: Page 2 of 5 = 2]\n\n' +
        '[button: Previous page] [button: Next page]',
    )
  })

  it('renders a chart as its data table, with no chart-specific code in the serializer', () => {
    const points = [
      { q: 0, v: 12 },
      { q: 1, v: 19 },
    ]
    expect(
      doc(
        <LineChart
          series={[{ id: 'revenue', label: 'Revenue (€k)', data: points }]}
          x={(d) => d.q}
          y={(d) => d.v}
          title="Revenue"
          description="Up 58% over two quarters"
          height={200}
        />,
      ),
    ).toBe(
      '![Revenue] Up 58% over two quarters\n\nRevenue\n\n' +
        '| X | Revenue (€k) |\n| --- | --- |\n| 0 | 12 |\n| 1 | 19 |',
    )
  })
})
