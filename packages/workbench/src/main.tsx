import { createRoot } from 'react-dom/client'
import 'virtual:cascivo-workbench-styles'
import { App } from './App.tsx'
import './styles.css'

createRoot(document.querySelector('#root')!).render(<App />)
