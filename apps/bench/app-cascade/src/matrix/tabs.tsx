import { createRoot } from 'react-dom/client'
import '@cascade-ui/themes/light'
import { Tabs } from '@cascade-ui/react'
createRoot(document.getElementById('root')!).render(
  <Tabs tabs={[{ id: 'a', label: 'A', content: <div>A</div> }]} />,
)
