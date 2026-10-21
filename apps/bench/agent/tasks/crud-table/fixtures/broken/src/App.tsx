// BROKEN canary: removes creating a project. The dialog opens and submits, then closes without
// adding the project, so the new name never reaches the table. Everything else matches the
// cascivo canary.
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
  const [projects] = useSignalState<Project[]>(SEED)
  const [creating, setCreating] = useSignalState(false)

  const create = (_name: string) => {
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
