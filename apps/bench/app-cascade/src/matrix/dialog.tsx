import { createRoot } from 'react-dom/client'
import '@cascade-ui/themes/light'
import { Modal } from '@cascade-ui/react'
createRoot(document.getElementById('root')!).render(<Modal open={true} title="Test" />)
