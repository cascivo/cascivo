import type { ComponentChildren } from 'preact'
import { useComputed, useSignal, useSignals } from '@cascivo/core'
import { ToggleGroup } from '@cascivo/components/toggle-group'
import {
  EMAIL_PREVIEW_THEMES,
  EMAIL_PRIMITIVES,
  type EmailPrimitive,
  type EmailPrimitivePreview,
} from '../marketing/email-previews.generated'
import { CodeBlock } from './components/CodeBlock'

/*
 * The primitive reference for `@cascivo/email` — React Email's `/components` page, for this
 * package.
 *
 * Everything on it is generated: the frames are real `@cascivo/email` documents rendered at
 * build time (`packages/email/scripts/generate-primitives.ts`), and the snippet under each
 * one is printed from the very element tree that produced it, so a documented call cannot
 * describe something the picture above it did not render. The props tables come off the
 * TypeScript interfaces.
 *
 * Each frame is an `<iframe srcdoc>` for the same reason `/docs/email` uses one: an email is
 * a whole document with its own `<body>`, and this site's stylesheet must not reach into it.
 * A preview that inherited the docs CSS would be showing something no recipient will ever
 * see, which is the one thing a preview must not do.
 */

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const THEME_ITEMS = EMAIL_PREVIEW_THEMES.map((t) => ({ value: t, label: titleCase(t) }))

const GROUPS = [...new Set(EMAIL_PRIMITIVES.map((p) => p.group))]

const IMPORT = `import {
  Alert, Badge, Body, Button, Card, Column, Container,
  Footer, Head, Heading, Hr, Html, Img, Link, List,
  Markdown, Preview, Row, Section, Spacer, Style, Text,
} from '@cascivo/email'`

/**
 * Render the backticked spans of a generated description as real code.
 *
 * The descriptions are written once and published to two surfaces — this page and
 * `docs/EMAIL-PRIMITIVES.md` — so they are authored in markdown's inline-code syntax and
 * each surface renders it. Splitting on the backtick is the whole grammar involved.
 */
function prose(text: string): ComponentChildren {
  return text.split('`').map((part, i) => (i % 2 === 1 ? <code key={i}>{part}</code> : part))
}

function Frame({ preview, theme }: { preview: EmailPrimitivePreview; theme: string }) {
  useSignals()
  // The frame is sized from the document it holds: these examples run from a single badge
  // row to a five-block Markdown render, and one height that fits the tallest leaves the
  // short ones sitting in a panel of dead space. An `srcdoc` document is same-origin, so
  // measuring it on load costs nothing, and it re-fires when the theme swaps the document.
  const height = useSignal(0)
  return (
    <iframe
      class="doc-primitive-frame"
      title={`${preview.title} — rendered email`}
      srcDoc={preview.html[theme]}
      loading="lazy"
      {...(height.value > 0 ? { style: { blockSize: `${height.value}px` } } : {})}
      onLoad={(e) => {
        const doc = e.currentTarget.contentDocument
        if (!doc) return
        // `<body>`, not `documentElement`: the root element fills the frame's viewport, so
        // its `scrollHeight` never reads below the frame's current height and a short
        // example — a badge row, a rule — can only ever grow into the CSS floor and stay
        // there. `<body>` carries the content, and `Body` zeroes its margin.
        height.value = doc.body?.scrollHeight || doc.documentElement.scrollHeight
      }}
    />
  )
}

/**
 * The props table, local rather than the shared `PropsTable`.
 *
 * These descriptions come straight off TSDoc, where inline code is written in backticks —
 * `prose` turns those into real `<code>`. The shared table renders its description as plain
 * text, which is right for manifest prose and would print the backticks literally here.
 */
function EmailProps({ primitive }: { primitive: EmailPrimitive }) {
  return (
    <div class="table-wrap">
      <table class="props-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {primitive.props.map((prop) => (
            <tr key={prop.name}>
              <td>
                <code>{prop.name}</code>
              </td>
              <td>
                <code class="type">{prop.type}</code>
              </td>
              <td>{prop.default ? <code>{prop.default}</code> : <span class="muted">—</span>}</td>
              <td>{prop.required ? 'Yes' : <span class="muted">No</span>}</td>
              <td>{prop.description ? prose(prop.description) : <span class="muted">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Primitive({ primitive, theme }: { primitive: EmailPrimitive; theme: string }) {
  return (
    <section class="doc-section doc-primitive" id={primitive.name.toLowerCase()}>
      <h3>
        <code>{`<${primitive.name}>`}</code>
      </h3>
      <p>{prose(primitive.description)}</p>

      {primitive.previews.map((preview) => (
        <div class="doc-primitive-example" key={preview.title}>
          <h4>{preview.title}</h4>
          {preview.description ? <p>{prose(preview.description)}</p> : null}
          <Frame preview={preview} theme={theme} />
          <CodeBlock code={preview.code} />
        </div>
      ))}

      <h4>Props</h4>
      <EmailProps primitive={primitive} />
    </section>
  )
}

export function EmailComponentsPage() {
  useSignals()
  const theme = useSignal<string>('light')
  const primitives = useComputed(() => EMAIL_PRIMITIVES)

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Transactional email</div>
        <h1>Email components</h1>
        <p class="doc-lede">
          Every primitive <code>@cascivo/email</code> exports, previewed as a real email document.
          These are <strong>not</strong> the <code>@cascivo/react</code> components — HTML email is
          a separate render target with no flexbox, no grid, no custom properties and no client
          JavaScript. Layout is tables and styling is inline, because Outlook Windows still renders
          through Microsoft Word.
        </p>
      </header>

      <section class="doc-section">
        <CodeBlock code={IMPORT} />
        <p>
          Each frame below is the HTML an adopter would send, rendered at build time and shown in an
          isolated iframe — not a screenshot and not a styled div pretending. The snippet under it
          is printed from the same element tree that produced the frame.
        </p>
        <ToggleGroup
          className="doc-email-chips"
          type="single"
          items={THEME_ITEMS}
          value={theme.value}
          onValueChange={(next) => {
            if (typeof next === 'string') theme.value = next
          }}
          aria-label="Preview theme"
        />
        <p class="doc-note">
          Four of the twelve themes, because every frame is a whole document and the page would
          otherwise ship a megabyte of them. All twelve switch across three complete templates on{' '}
          <a href="/docs/email">the email overview</a>.
        </p>
        {/* Stated once rather than as twenty-two identical rows: every props table below would
            otherwise repeat the same two entries, and a row that says nothing still gets read. */}
        <p class="doc-note">
          Every primitive below also takes <code>children</code> (its content) and{' '}
          <code>style</code> — inline declarations merged over the primitive&rsquo;s own, in
          camelCase, with lengths written in <code>px</code>.
        </p>
        <nav class="doc-primitive-index" aria-label="Primitives">
          {GROUPS.map((group) => (
            <div key={group}>
              <strong>{group}</strong>
              <ul>
                {primitives.value
                  .filter((p) => p.group === group)
                  .map((p) => (
                    <li key={p.name}>
                      <a href={`#${p.name.toLowerCase()}`}>{p.name}</a>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>
      </section>

      {GROUPS.map((group) => (
        <section class="doc-section" key={group}>
          <h2>{group}</h2>
          {primitives.value
            .filter((p) => p.group === group)
            .map((p) => (
              <Primitive key={p.name} primitive={p} theme={theme.value} />
            ))}
        </section>
      ))}

      <section class="doc-section">
        <h2>Next</h2>
        <ul>
          <li>
            <a href="/docs/email">The email overview</a> — sending, byte budgets, the conformance
            lint, and all twelve themes on complete templates.
          </li>
          <li>
            <a href="/docs/recipe-email.md">The full recipe</a> — writing a template, previewing it
            locally, and what to check before you send.
          </li>
          <li>
            <a href="/docs/email-primitives.md">This page as markdown</a> — the same reference in
            one file, for an agent or a <code>curl</code>.
          </li>
          <li>
            <a href="/docs/email-client-support.md">Client support</a> — what the conformance lint
            enforces, and why each primitive is shaped the way it is.
          </li>
        </ul>
      </section>
    </article>
  )
}
