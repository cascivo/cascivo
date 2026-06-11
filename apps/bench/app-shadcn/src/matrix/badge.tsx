import { createRoot } from 'react-dom/client'
import '../index.css'
import { Badge } from '@/components/ui/badge'
createRoot(document.getElementById('root')!).render(<Badge>active</Badge>)
