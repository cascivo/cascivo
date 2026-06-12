import { Checkbox } from '@carbon/react'
import { createRoot } from 'react-dom/client'
import '../index.scss'
createRoot(document.getElementById('root')!).render(<Checkbox id="c" labelText="Option" />)
