// CRUD table canary (cascivo): a searchable, paginated projects table and a dialog that creates a
// project. Search and pagination are the DataTable's own.
import {
  Button,
  DataTable,
  Flex,
  Heading,
  Input,
  Modal,
  useSignalState,
  type Column,
} from '@cascivo/react'
import '@cascivo/themes/light.css'
import { SEED, type Project } from './projects'

const COLUMNS: Column<Project>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'owner', header: 'Owner' },
  { key: 'status', header: 'Status' },
]

export default function App() {
  const [projects, setProjects] = useSignalState<Project[]>(SEED)
  const [creating, setCreating] = useSignalState(false)

  const create = (name: string) => {
    setProjects((list) => [
      { id: String(list.length + 1), name, owner: 'You', status: 'Active' },
      ...list,
    ])
    setCreating(false)
  }

  return (
    <main>
      <Flex gap={6}>
        <Flex direction="horizontal" justify="between" align="center">
          <Heading level={1}>Projects</Heading>
          <Button onClick={() => setCreating(true)}>New project</Button>
        </Flex>
        <DataTable
          ariaLabel="Projects"
          columns={COLUMNS}
          rows={projects.value}
          getRowId={(p) => p.id}
          searchable
          pagination={{ pageSize: 5 }}
        />
      </Flex>
      <Modal
        open={creating.value}
        onClose={() => setCreating(false)}
        title="New project"
        footer={
          <Button type="submit" form="new-project">
            Create project
          </Button>
        }
      >
        <form
          id="new-project"
          onSubmit={(e) => {
            e.preventDefault()
            const name = new FormData(e.currentTarget).get('name')
            if (typeof name === 'string' && name.trim() !== '') create(name.trim())
          }}
        >
          <Input label="Project name" name="name" required />
        </form>
      </Modal>
    </main>
  )
}
