import { createRoot } from 'react-dom/client'
import '@cascivo/themes/light'
import { Select } from '@cascivo/react'
createRoot(document.getElementById('root')!).render(
  <Select label="Pick" options={[{ value: 'a', label: 'A' }]} />,
)
