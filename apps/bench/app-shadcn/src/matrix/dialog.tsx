import { createRoot } from 'react-dom/client'
import '../index.css'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
createRoot(document.getElementById('root')!).render(
  <Dialog open={true}>
    <DialogContent>
      <DialogTitle>Test</DialogTitle>
    </DialogContent>
  </Dialog>,
)
