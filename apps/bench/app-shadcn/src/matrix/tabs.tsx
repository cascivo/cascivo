import { createRoot } from 'react-dom/client'
import '../index.css'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
