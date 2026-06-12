import { DialogPage } from './routes/DialogPage'
import { FormPage } from './routes/FormPage'
import { TablePage } from './routes/TablePage'

export function App() {
  const path = window.location.pathname
  if (path.startsWith('/form')) return <FormPage />
  if (path.startsWith('/dialog')) return <DialogPage />
  return <TablePage />
}
