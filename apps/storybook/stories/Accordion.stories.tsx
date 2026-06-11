import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@cascade-ui/components/accordion'

const meta: Meta<typeof Accordion> = {
  title: 'Navigation/Accordion',
  component: Accordion,
}
export default meta
type Story = StoryObj<typeof Accordion>

const faq = (
  <>
    <AccordionItem value="what">
      <AccordionTrigger>What is cascade?</AccordionTrigger>
      <AccordionContent>
        A CSS-native, signal-driven, AI-first React design system.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="how">
      <AccordionTrigger>How do I install it?</AccordionTrigger>
      <AccordionContent>Run npx cascade add &lt;component&gt; to copy it in.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="why">
      <AccordionTrigger>Why signals?</AccordionTrigger>
      <AccordionContent>
        Fine-grained reactivity means zero unnecessary re-renders.
      </AccordionContent>
    </AccordionItem>
  </>
)

export const Single: Story = {
  render: () => (
    <Accordion type="single" defaultValue="what">
      {faq}
    </Accordion>
  ),
}

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['what', 'how']}>
      {faq}
    </Accordion>
  ),
}

export const AllCollapsed: Story = {
  render: () => <Accordion type="single">{faq}</Accordion>,
}

export const Accessibility: Story = {
  render: () => (
    <Accordion type="single" defaultValue="what">
      {faq}
    </Accordion>
  ),
  parameters: { a11y: { test: 'error' } },
}
