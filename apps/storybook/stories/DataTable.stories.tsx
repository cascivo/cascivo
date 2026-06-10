import type { Meta, StoryObj } from '@storybook/react-vite'
import { DataTable, type Column } from '@cascade-ui/components/data-table'

interface Person {
  id: string
  name: string
  role: string
  age: number
}

const people: Person[] = Array.from({ length: 20 }, (_, i) => ({
  id: `p${i}`,
  name: `Person ${String(i).padStart(2, '0')}`,
  role: ['Engineer', 'Designer', 'PM', 'QA'][i % 4]!,
  age: 22 + ((i * 7) % 40),
}))

const columns: Column<Person>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'age', header: 'Age', sortable: true, align: 'end' },
]

const meta: Meta<typeof DataTable> = {
  component: DataTable,
  args: { columns, rows: people, getRowId: (p: Person) => p.id },
}
export default meta
type Story = StoryObj<typeof DataTable>

export const Default: Story = {}

export const Sorting: Story = { args: { defaultSort: { key: 'name', direction: 'asc' } } }

export const Searchable: Story = { args: { searchable: true, title: 'People' } }

export const Pagination: Story = {
  args: { pagination: { pageSize: 5, pageSizeOptions: [5, 10, 20] } },
}

export const Selection: Story = {
  args: {
    selection: { mode: 'multi' },
    batchActions: [{ label: 'Delete selected', onClick: () => {} }],
  },
}

export const Expandable: Story = {
  args: {
    renderExpandedRow: (p: Person) => (
      <div style={{ padding: '0.5rem' }}>
        Details for {p.name}, age {p.age}
      </div>
    ),
  },
}

export const Loading: Story = { args: { loading: true } }

export const Empty: Story = { args: { rows: [] } }

export const DensityCompact: Story = { args: { density: 'compact' } }

export const DensityRelaxed: Story = { args: { density: 'relaxed' } }

export const Zebra: Story = { args: { zebra: true } }

export const Accessibility: Story = {
  args: { title: 'Team', description: 'All team members' },
  parameters: { a11y: { test: 'error' } },
}
