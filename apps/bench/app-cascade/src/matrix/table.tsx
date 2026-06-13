import { createRoot } from 'react-dom/client'
import '@cascivo/themes/light'
import { DataTable } from '@cascivo/react'
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
