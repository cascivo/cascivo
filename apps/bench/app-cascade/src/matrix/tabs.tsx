import { createRoot } from 'react-dom/client'
import '@cascade-ui/themes/light'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@cascade-ui/react'
createRoot(document.getElementById('root')!).render(
  <Tabs defaultValue="a">
    <TabsList>
      <TabsTrigger value="a">A</TabsTrigger>
    </TabsList>
    <TabsContent value="a">
      <div>A</div>
    </TabsContent>
  </Tabs>,
)
