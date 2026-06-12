import { Select, SelectItem } from '@carbon/react'
import { createRoot } from 'react-dom/client'
import '../index.scss'
createRoot(document.getElementById('root')!).render(
  <Select id="s" labelText="Pick">
    <SelectItem value="a" text="A" />
  </Select>,
)
