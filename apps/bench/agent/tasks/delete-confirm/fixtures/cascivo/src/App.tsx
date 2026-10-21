// Delete confirm canary (cascivo): three projects, each with a Delete button that asks first in
// cascivo's AlertDialog (role alertdialog, named by its title).
import {
  AlertDialog,
  Button,
  Card,
  Flex,
  Heading,
  List,
  ListItem,
  Text,
  useSignalState,
} from '@cascivo/react'
import '@cascivo/themes/light.css'

interface Project {
  id: string
  name: string
  owner: string
}

const SEED: Project[] = [
  { id: 'atlas', name: 'Atlas', owner: 'Mara Lind' },
  { id: 'beacon', name: 'Beacon', owner: 'Theo Park' },
  { id: 'cinder', name: 'Cinder', owner: 'Ivy Okafor' },
]

export default function App() {
  const [projects, setProjects] = useSignalState<Project[]>(SEED)
  const [pending, setPending] = useSignalState<Project | null>(null)

  const remove = (id: string) => setProjects((list) => list.filter((p) => p.id !== id))

  return (
    <main>
      <Flex gap={6}>
        <Heading level={1}>Projects</Heading>
        <List marker="none">
          {projects.value.map((project) => (
            <ListItem key={project.id}>
              <Card>
                <Flex direction="horizontal" justify="between" align="center">
                  <Flex gap={1}>
                    <Heading level={2}>{project.name}</Heading>
                    <Text muted>Owned by {project.owner}</Text>
                  </Flex>
                  <Button
                    variant="destructive"
                    aria-label={`Delete ${project.name}`}
                    onClick={() => setPending(project)}
                  >
                    Delete
                  </Button>
                </Flex>
              </Card>
            </ListItem>
          ))}
        </List>
      </Flex>
      <AlertDialog
        open={pending.value !== null}
        title={`Delete ${pending.value?.name ?? 'project'}?`}
        description="The project and its history are removed for everyone. This cannot be undone."
        variant="destructive"
        labels={{ confirm: 'Delete project', cancel: 'Cancel' }}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const target = pending.value
          if (target !== null) remove(target.id)
          setPending(null)
        }}
      />
    </main>
  )
}
