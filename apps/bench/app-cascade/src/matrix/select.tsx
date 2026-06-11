import { createRoot } from 'react-dom/client'
import '@cascade-ui/themes/light'
import { Select } from '@cascade-ui/react'
createRoot(document.getElementById('root')!).render(
  <Select label="Pick" options={[{ value: 'a', label: 'A' }]} />,
)
