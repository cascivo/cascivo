import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

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
    <section id="faq" className="flex flex-col gap-8">
      <h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
      <Accordion type="single" collapsible>
        {QUESTIONS.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
