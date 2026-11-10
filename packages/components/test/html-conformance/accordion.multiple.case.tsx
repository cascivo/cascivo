import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../src/accordion/accordion'
import { Text } from '../../src/text/text'

export default (
  <Accordion type="multiple">
    <AccordionItem value="1">
      <AccordionTrigger>One</AccordionTrigger>
      <AccordionContent>
        <Text>First</Text>
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="2">
      <AccordionTrigger>Two</AccordionTrigger>
      <AccordionContent>
        <Text>Second</Text>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)
