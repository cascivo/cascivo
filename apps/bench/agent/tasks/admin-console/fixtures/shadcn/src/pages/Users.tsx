import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const USERS = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' },
  { id: '2', name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor' },
  { id: '3', name: 'Alan Turing', email: 'alan@example.com', role: 'Viewer' },
]

export function Users() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {USERS.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="secondary">{user.role}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
