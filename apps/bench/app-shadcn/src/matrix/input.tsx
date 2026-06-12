import { createRoot } from 'react-dom/client'
import '../index.css'
import { Input } from '@/components/ui/input'
createRoot(document.getElementById('root')!).render(<Input placeholder="Name" />)
