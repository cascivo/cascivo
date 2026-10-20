// Delete confirm canary (shadcn): three projects in a table, each row with a Delete button that
// opens one shared confirmation Dialog (role dialog, named by its DialogTitle).
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Project {
  id: number
  name: string
  status: string
}

const SEED: Project[] = [
  { id: 1, name: 'Website redesign', status: 'Active' },
  { id: 2, name: 'Mobile app', status: 'Paused' },
  { id: 3, name: 'Data warehouse', status: 'Active' },
]

export function App() {
  const [projects, setProjects] = useState<Project[]>(SEED)
  const [pending, setPending] = useState<Project | null>(null)

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>{project.status}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => setPending(project)}>
                  <Trash2 aria-hidden="true" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              {pending?.name} will be permanently deleted. You cannot undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setProjects((list) => list.filter((p) => p.id !== pending?.id))
                setPending(null)
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default App
