import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckboxCard } from '@cascivo/components/checkbox-card'

const meta: Meta<typeof CheckboxCard> = {
  title: 'Inputs/CheckboxCard',
  component: CheckboxCard,
}
export default meta
type Story = StoryObj<typeof CheckboxCard>

export const Primary: Story = {}

export const Default: Story = {
  render: () => (
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
}
