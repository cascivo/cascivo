import { Tab, Tabs, TabList, TabPanels, TabPanel } from '@carbon/react'
import { createRoot } from 'react-dom/client'
import '../index.scss'
createRoot(document.getElementById('root')!).render(
  <Tabs>
    <TabList>
      <Tab>A</Tab>
    </TabList>
    <TabPanels>
      <TabPanel>Content</TabPanel>
    </TabPanels>
  </Tabs>,
)
