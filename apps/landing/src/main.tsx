import { createRoot } from 'react-dom/client'
import { App } from './App'
import './landing.css'

const root = document.getElementById('app')
if (root) createRoot(root).render(<App />)
