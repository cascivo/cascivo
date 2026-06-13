import { createRoot } from 'react-dom/client'
import '@cascivo/themes/light'
import { Checkbox } from '@cascivo/react'
createRoot(document.getElementById('root')!).render(<Checkbox label="Option" />)
