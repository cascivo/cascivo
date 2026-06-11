import { createRoot } from 'react-dom/client'
import '@cascade-ui/themes/light'
import { DataTable } from '@cascade-ui/react'
import { buildRows } from '../data'
createRoot(document.getElementById('root')!).render(
  <DataTable
    rows={buildRows(5)}
    columns={[
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'price', header: 'Price' },
      { key: 'status', header: 'Status' },
    ]}
  />,
)
