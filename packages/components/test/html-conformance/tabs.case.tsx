import { Text } from '../../src/text/text'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/tabs/tabs'

export default (
  <Tabs defaultValue="overview">
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="details">Details</TabsTrigger>
    </TabsList>
    <TabsContent value="overview">
      <Text>First</Text>
    </TabsContent>
    <TabsContent value="details">
      <Text>Second</Text>
    </TabsContent>
  </Tabs>
)
