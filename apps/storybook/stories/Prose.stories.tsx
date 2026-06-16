import type { Meta, StoryObj } from '@storybook/react-vite'
import { Prose } from '@cascivo/components/prose'

const meta: Meta<typeof Prose> = {
  title: 'Display/Prose',
  component: Prose,
}
export default meta
type Story = StoryObj<typeof Prose>

export const Primary: Story = {}

export const Article: Story = {
  render: () => (
    <Prose style={{ maxWidth: 640 }}>
      <h1>Getting started</h1>
      <p>
        cascade components are <a href="#owned">owned code</a> — run{' '}
        <code>npx cascivo add button</code> and the source is yours.
      </p>
      <h2>Principles</h2>
      <ul>
        <li>Modern CSS only</li>
        <li>
          Signal-driven — <code>useSignal</code>, never <code>useState</code>
        </li>
      </ul>
      <blockquote>Proof, not promises.</blockquote>
      <h3>Token levels</h3>
      <table>
        <thead>
          <tr>
            <th>Level</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Semantic</td>
            <td>--cascivo-color-accent</td>
          </tr>
        </tbody>
      </table>
    </Prose>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <Prose>
      <h2>Heading</h2>
      <p>
        Paragraph with a <a href="#x">link</a>.
      </p>
    </Prose>
  ),
  parameters: { a11y: { test: 'error' } },
}
