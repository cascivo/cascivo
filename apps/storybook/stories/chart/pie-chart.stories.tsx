import type { Meta, StoryObj } from '@storybook/react-vite'
import { PieChart } from '@cascivo/charts'

const data = [
  { id: 'chrome', label: 'Chrome', value: 62 },
  { id: 'safari', label: 'Safari', value: 20 },
  { id: 'firefox', label: 'Firefox', value: 10 },
  { id: 'edge', label: 'Edge', value: 5 },
  { id: 'other', label: 'Other', value: 3 },
]

const meta: Meta<typeof PieChart> = {
  title: 'Charts/PieChart',
  component: PieChart,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 'min(40rem, 90vw)', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof PieChart>

export const Default: Story = {
  args: {
    data,
    title: 'Browser market share',
    legend: true,
  },
}

export const Donut: Story = {
  args: {
    data,
    title: 'Browser market share (donut)',
    donut: true,
    legend: true,
  },
}

const status = [
  { id: 'done', label: 'Done', value: 92, color: 'var(--cascivo-color-success)' },
  { id: 'wip', label: 'In progress', value: 34, color: 'var(--cascivo-color-warning)' },
  { id: 'blocked', label: 'Blocked', value: 16, color: 'var(--cascivo-color-destructive)' },
]

export const DonutWithCenter: Story = {
  args: {
    data: status,
    title: 'Task status',
    donut: true,
    size: 240,
    thickness: 28,
    centerValue: '142',
    centerLabel: 'Total tasks',
    legend: true,
  },
}

export const DonutThickness: Story = {
  args: {
    data,
    title: 'Thin ring donut',
    donut: true,
    size: 240,
    thickness: 12,
    legend: true,
  },
}

export const PercentTooltip: Story = {
  args: {
    data: [
      { id: 'a', label: 'A', value: 60 },
      { id: 'b', label: 'B', value: 40 },
    ],
    title: 'Share — hover for value (pct%)',
    legend: true,
  },
}

export const Empty: Story = {
  args: {
    data: [],
    title: 'No data yet',
  },
}
