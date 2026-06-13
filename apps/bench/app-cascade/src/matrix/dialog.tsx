import { createRoot } from 'react-dom/client'
import '@cascivo/themes/light'
import { Modal } from '@cascivo/react'
createRoot(document.getElementById('root')!).render(<Modal open={true} title="Test" />)
