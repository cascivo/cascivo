import { DataTable, Flex, Heading, type Column } from '@cascivo/react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

const USERS: User[] = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' },
  { id: '2', name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor' },
  { id: '3', name: 'Alan Turing', email: 'alan@example.com', role: 'Viewer' },
]

const COLUMNS: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' },
]

export function Users() {
  return (
    <Flex gap={6}>
      <Heading level={1}>Users</Heading>
      <DataTable ariaLabel="Users" columns={COLUMNS} rows={USERS} getRowId={(u) => u.id} />
    </Flex>
  )
}
