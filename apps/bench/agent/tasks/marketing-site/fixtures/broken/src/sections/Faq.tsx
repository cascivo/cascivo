import { Button, Flex, Heading, Text, useSignalState } from '@cascivo/react'

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
  const [open, setOpen] = useSignalState<string | null>(null)
  return (
    <section id="faq" aria-labelledby="faq-title">
      <Heading level={2} id="faq-title">
        Frequently asked questions
      </Heading>
      <Flex gap={4}>
        {QUESTIONS.map((item) => (
          <div key={item.q}>
            <Button
              variant="ghost"
              aria-expanded={open.value === item.q}
              onClick={() => setOpen(open.value === item.q ? null : item.q)}
            >
              {item.q}
            </Button>
            {/* The defect: the answer's visibility never follows the toggle. */}
            <Text hidden>{item.a}</Text>
          </div>
        ))}
      </Flex>
    </section>
  )
}
