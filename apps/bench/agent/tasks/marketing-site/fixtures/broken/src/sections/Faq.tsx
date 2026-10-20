import { Flex, Heading, Text } from '@cascivo/react'

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
      <Flex gap={4}>
        {QUESTIONS.map((item) => (
          <div key={item.q}>
            <Heading level={3}>{item.q}</Heading>
            <Text>{item.a}</Text>
          </div>
        ))}
      </Flex>
    </section>
  )
}
