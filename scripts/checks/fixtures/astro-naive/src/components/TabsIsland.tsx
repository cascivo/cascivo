import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cascivo/react'

// Composed here, inside one island: the parts read their root's context, which does not
// cross an Astro island boundary, so `<TabsTrigger>` written in a `.astro` file throws.
export function TabsIsland() {
  return (
    <Tabs defaultValue="first">
      <TabsList>
        <TabsTrigger value="first">First tab</TabsTrigger>
        <TabsTrigger value="second">Second tab</TabsTrigger>
      </TabsList>
      <TabsContent value="first">First panel</TabsContent>
      <TabsContent value="second">Second panel</TabsContent>
    </Tabs>
  )
}
