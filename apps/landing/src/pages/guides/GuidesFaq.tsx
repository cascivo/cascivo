import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@cascivo/components/accordion'
import { FAQ } from './data'

export function GuidesFaq() {
  return (
    <section id="faq" className="guides-section">
      <h2>Quick questions</h2>
      <p className="guides-section-sub">
        The things people ask before they commit — each answer ends with where to go next.
      </p>
      <Accordion type="single" className="guides-faq">
        {FAQ.map((entry) => (
          <AccordionItem key={entry.id} value={entry.id}>
            <AccordionTrigger>{entry.q}</AccordionTrigger>
            <AccordionContent>
              <p className="faq-answer">{entry.a}</p>
              <a href={entry.next.href} className="faq-next">
                {entry.next.label} →
              </a>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
