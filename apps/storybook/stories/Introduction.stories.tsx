import type { Meta, StoryObj } from '@storybook/react-vite'

function Introduction() {
  return (
    <article style={{ maxInlineSize: '48rem', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBlockEnd: '0.25rem' }}>cascivo</h1>
      <p style={{ color: '#666', marginBlockEnd: '2rem' }}>
        CSS-native, signal-driven, AI-first React design system.
      </p>

      <h2>Get started</h2>
      <pre
        style={{
          background: '#f4f4f4',
          padding: '1rem',
          borderRadius: '4px',
          marginBlockEnd: '2rem',
        }}
      >
        {'npx cascivo init\nnpx cascivo add button'}
      </pre>

      <h2>Links</h2>
      <ul style={{ lineHeight: 2 }}>
        <li>
          <a href="https://cascivo.com">cascivo.com</a> — landing page, live demos, and design
          showcase
        </li>
        <li>
          <a href="https://docs.cascivo.com">docs.cascivo.com</a> — component reference, props, and
          tokens
        </li>
        <li>
          <a href="https://github.com/cascivo/cascivo">github.com/cascivo/cascivo</a> — source code
        </li>
      </ul>

      <h2>Browse components</h2>
      <p>Use the sidebar to explore components by category:</p>
      <ul style={{ lineHeight: 2 }}>
        <li>
          <strong>Inputs</strong> — Button, Input, Textarea, Select, Checkbox, Toggle, Slider
        </li>
        <li>
          <strong>Display</strong> — Card, Badge, Alert, Avatar, DataTable, Code
        </li>
        <li>
          <strong>Overlay</strong> — Modal, Dropdown, Tooltip, Toast, CommandMenu
        </li>
        <li>
          <strong>Navigation</strong> — Tabs, Accordion, Breadcrumb, SideNav
        </li>
        <li>
          <strong>Charts</strong> — BarChart, LineChart, AreaChart, PieChart, and more
        </li>
        <li>
          <strong>AI</strong> — AiChat, AiLabel
        </li>
      </ul>

      <h2>Theming</h2>
      <p>
        All components respond to <code>data-theme="light|dark|warm|flat|…"</code> on any container
        element. Use the <strong>Themes</strong> toolbar to switch between all ten built-in themes.
      </p>
    </article>
  )
}

const meta: Meta = {
  title: 'Introduction',
  component: Introduction,
  parameters: { layout: 'fullscreen' },
}
export default meta

export const Welcome: StoryObj = {}
