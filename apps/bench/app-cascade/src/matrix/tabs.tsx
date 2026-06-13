import { createRoot } from 'react-dom/client'
import '@cascivo/themes/light'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@cascivo/react'
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
