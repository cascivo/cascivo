// CRUD table canary (shadcn): a projects table with a search box, pagination and a dialog that
// creates a project, wired by hand as shadcn/ui leaves state to the app.
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SEED, type Project } from '@/projects'

const PAGE_SIZE = 5

export function App() {
  const [projects, setProjects] = useState<Project[]>(SEED)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)

  const matches = projects.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = matches.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = new FormData(event.currentTarget).get('name')
    if (typeof name !== 'string' || name.trim() === '') return
    setProjects((list) => [
      { id: String(list.length + 1), name: name.trim(), owner: 'You', status: 'Active' },
      ...list,
    ])
    setOpen(false)
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New project</Button>
          </DialogTrigger>
          <DialogContent>
            <form className="flex flex-col gap-4" onSubmit={create}>
              <DialogHeader>
                <DialogTitle>New project</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input id="project-name" name="name" required />
              </div>
              <DialogFooter>
                <Button type="submit">Create project</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Input
        type="search"
        aria-label="Search projects"
        placeholder="Search projects…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setPage(1)
        }}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No projects match “{query}”.
              </TableCell>
            </TableRow>
          ) : (
            visible.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.owner}</TableCell>
                <TableCell>{p.status}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={current === 1}
              onClick={(e) => {
                e.preventDefault()
                setPage(Math.max(1, current - 1))
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="px-3 text-sm text-muted-foreground">
              Page {current} of {pages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={current === pages}
              onClick={(e) => {
                e.preventDefault()
                setPage(Math.min(pages, current + 1))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </main>
  )
}

export default App
