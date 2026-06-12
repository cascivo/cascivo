import { TextInput } from '@carbon/react'
import { createRoot } from 'react-dom/client'
import '../index.scss'
createRoot(document.getElementById('root')!).render(<TextInput id="n" labelText="Name" />)
