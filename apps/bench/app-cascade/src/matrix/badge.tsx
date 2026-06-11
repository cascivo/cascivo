import { createRoot } from 'react-dom/client'
import '@cascade-ui/themes/light'
import { Badge } from '@cascade-ui/react'
createRoot(document.getElementById('root')!).render(<Badge>active</Badge>)
