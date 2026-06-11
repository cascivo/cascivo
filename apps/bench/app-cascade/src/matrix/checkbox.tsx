import { createRoot } from 'react-dom/client'
import '@cascade-ui/themes/light'
import { Checkbox } from '@cascade-ui/react'
createRoot(document.getElementById('root')!).render(<Checkbox label="Option" />)
