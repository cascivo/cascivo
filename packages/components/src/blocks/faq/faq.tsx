'use client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../accordion/accordion'
import styles from './faq.module.css'

type QA = { question: string; answer: string }

const FAQS: QA[] = [
  {
    question: 'Do I own the code I add?',
    answer:
      'Yes. Components are copy-pasted into your project — you own every line and can edit it freely. There is no runtime dependency on a component library.',
  },
  {
    question: 'Does it work with my framework?',
    answer:
      'Components are React (18+) and RSC-compatible. The signals layer works in any React app; the docs are built with Preact via preact/compat.',
  },
  {
    question: 'How is theming handled?',
    answer:
      'Themes are pure CSS applied via a data-theme attribute on any container. Twelve first-party themes ship, and you can override the semantic token layer for your brand.',
  },
  {
    question: 'Can I change my plan later?',
    answer:
      'Yes — upgrade, downgrade, or cancel at any time. Changes take effect on your next billing cycle.',
  },
  {
    question: 'Is there an AI integration?',
    answer:
      'Every component ships a machine-readable manifest that powers an MCP server, Claude Code skills, and auto-generated docs.',
  },
]

export function Faq() {
  return (
    <section className={styles['root']} aria-label="Frequently asked questions">
      <div className={styles['header']}>
        <h2 className={styles['heading']}>Frequently asked questions</h2>
        <p className={styles['subtitle']}>
          Everything you need to know about the product and billing.
        </p>
      </div>
      <div className={styles['list']}>
        <Accordion type="single">
          {FAQS.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
