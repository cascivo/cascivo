import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Heading,
  Text,
} from '@cascivo/react'

const QUESTIONS = [
  {
    q: 'Is there a free plan?',
    a: 'Yes. The Hobby plan is free forever for one project and personal use.',
  },
  {
    q: 'Which frameworks do you support?',
    a: 'Anything that builds to static files or a Node server, detected automatically.',
  },
  {
    q: 'Can I self-host Shipyard?',
    a: 'Self-hosting is available on the Team plan with a dedicated runner.',
  },
]

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title">
      <Heading level={2} id="faq-title">
        Frequently asked questions
      </Heading>
      <Accordion type="single">
        {QUESTIONS.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>
              <Text>{item.a}</Text>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
