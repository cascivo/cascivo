import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../src/accordion/accordion'
import { Text } from '../../src/text/text'

export default (
  <Accordion>
    <AccordionItem value="1">
      <AccordionTrigger>{'<i>&'}</AccordionTrigger>
      <AccordionContent>
        <Text>{'<b>x</b>'}</Text>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)
