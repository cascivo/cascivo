'use client'
import { Badge, Button, type Column, DataTable } from '@cascivo/react'
import { PageHeader } from '../../page-header/page-header'
import { Flex } from '../../flex/flex'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  active: boolean
}

const demoUsers: User[] = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin', active: true },
  { id: '2', name: 'Grace Hopper', email: 'grace@example.com', role: 'member', active: true },
  { id: '3', name: 'Alan Turing', email: 'alan@example.com', role: 'member', active: false },
]

export interface UsersTablePageProps {
  users?: User[]
  onInvite?: () => void
}

export function UsersTablePage({ users = demoUsers, onInvite }: UsersTablePageProps) {
  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>,
    },
    {
      key: 'active',
      header: 'Status',
      render: (u) => (
        <Badge variant={u.active ? 'success' : 'outline'}>{u.active ? 'Active' : 'Inactive'}</Badge>
      ),
    },
  ]

  return (
    <Flex gap={6}>
      <PageHeader
        title="Users"
        description="Manage who has access to this workspace."
        actions={<Button onClick={onInvite}>Invite user</Button>}
      />
      <div style={{ overflowX: 'auto' }}>
        <DataTable
          columns={columns}
          rows={users}
          getRowId={(u) => u.id}
          searchable
          pagination={{ pageSize: 10 }}
        />
      </div>
    </Flex>
  )
}
