import { createRoot } from 'react-dom/client'
import '@cascade-ui/themes/light'
import { Input } from '@cascade-ui/react'
createRoot(document.getElementById('root')!).render(<Input label="Name" />)
