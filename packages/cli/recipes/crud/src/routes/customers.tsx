import type { Column } from '@cascivo/react'
import {
  Badge,
  Button,
  DataTable,
  Flex,
  Heading,
  Input,
  Modal,
  NumberInput,
  Select,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import { PLANS } from '../customers'
import type { Customer, CustomerInput, Plan } from '../customers'
import {
  PAGE_SIZE,
  load,
  loadError,
  plan,
  remove,
  rows,
  save,
  setPlan,
  total,
} from '../customers-page'

/** The customer in the form: `id` null for a new one. */
const editing = signal<{ id: string | null; draft: CustomerInput } | null>(null)
const formError = signal<string | null>(null)
const saving = signal(false)

void load()

const COLUMNS: Column<Customer>[] = [
  { key: 'name', header: 'Name', sortable: true, filter: 'text' },
  { key: 'email', header: 'Email', sortable: true },
  {
    key: 'plan',
    header: 'Plan',
    sortable: true,
    render: (row) => (
      <Badge variant={row.plan === 'enterprise' ? 'success' : 'secondary'}>{row.plan}</Badge>
    ),
  },
  { key: 'seats', header: 'Seats', sortable: true, align: 'end', filter: 'range' },
  {
    key: 'created_at',
    header: 'Since',
    sortable: true,
    render: (row) => row.created_at.slice(0, 10),
  },
]

function edit(customer: Customer | null) {
  formError.value = null
  editing.value = customer
    ? {
        id: customer.id,
        draft: {
          name: customer.name,
          email: customer.email,
          plan: customer.plan,
          seats: customer.seats,
        },
      }
    : { id: null, draft: { name: '', email: '', plan: 'team', seats: 5 } }
}

function change(patch: Partial<CustomerInput>) {
  if (editing.value)
    editing.value = { ...editing.value, draft: { ...editing.value.draft, ...patch } }
}

async function submit() {
  if (!editing.value) return
  saving.value = true
  formError.value = null
  try {
    await save(editing.value.id, editing.value.draft)
    editing.value = null
  } catch (error) {
    // The Worker's message: "A customer with that email exists", "That is not an email address"…
    formError.value = error instanceof Error ? error.message : 'Could not save'
  } finally {
    saving.value = false
  }
}

function CustomerForm() {
  useSignals()
  const current = editing.value
  if (!current) return null
  const { draft } = current
  return (
    <Modal
      open
      onClose={() => (editing.value = null)}
      title={current.id ? 'Edit customer' : 'New customer'}
      footer={
        <Flex direction="horizontal" gap={2} justify="end">
          <Button variant="ghost" onClick={() => (editing.value = null)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={saving.value}>
            Save
          </Button>
        </Flex>
      }
    >
      <Flex gap={3}>
        <Input label="Name" value={draft.name} onChange={(e) => change({ name: e.target.value })} />
        <Input
          label="Email"
          type="email"
          value={draft.email}
          onChange={(e) => change({ email: e.target.value })}
        />
        <Select
          label="Plan"
          value={draft.plan}
          options={PLANS.map((p) => ({ value: p, label: p }))}
          onChange={(e) => change({ plan: e.target.value as Plan })}
        />
        <NumberInput
          label="Seats"
          min={1}
          value={draft.seats}
          onValueChange={(v) => change({ seats: v ?? 1 })}
        />
        {formError.value ? <Text muted>{formError.value}</Text> : null}
      </Flex>
    </Modal>
  )
}

export default function Customers() {
  useSignals()
  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Customers</Heading>
          <Text muted>
            A D1 table behind DataTable's server mode: sorting, search, filters and paging all run
            as SQL in the Worker.
          </Text>
        </Flex>
        <Flex direction="horizontal" align="center" gap={2}>
          <Select
            ariaLabel="Plan"
            value={plan.value}
            options={[
              { value: '', label: 'Every plan' },
              ...PLANS.map((p) => ({ value: p, label: p })),
            ]}
            onChange={(e) => setPlan(e.target.value as Plan | '')}
          />
          <Button onClick={() => edit(null)}>New customer</Button>
        </Flex>
      </Flex>
      {loadError.value ? <Text muted>{loadError.value}</Text> : null}
      <DataTable
        columns={COLUMNS}
        rows={rows.value}
        getRowId={(row) => row.id}
        searchable
        pagination={{ pageSize: PAGE_SIZE }}
        server={{ totalItems: total.value, onQueryChange: (query) => void load(query) }}
        rowActions={(row) => [
          { id: 'edit', label: 'Edit', onSelect: () => edit(row) },
          { id: 'delete', label: 'Delete', destructive: true, onSelect: () => void remove(row.id) },
        ]}
      />
      <CustomerForm />
    </Flex>
  )
}
