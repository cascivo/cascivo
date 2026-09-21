import { describe, expect, it } from 'vitest'
import { toMarkdown } from './to-markdown.ts'

describe('toMarkdown — document structure', () => {
  it('maps headings to their level', () => {
    expect(toMarkdown('<h1>Title</h1><h3>Sub</h3>')).toBe('# Title\n\n### Sub')
  })

  it('keeps paragraphs as separate blocks', () => {
    expect(toMarkdown('<p>One</p><p>Two</p>')).toBe('One\n\nTwo')
  })

  it('does not glue inline siblings into one word', () => {
    expect(toMarkdown('<p>Saved <strong>3</strong> items</p>')).toBe('Saved **3** items')
  })

  it('renders unordered and ordered lists with markers', () => {
    expect(toMarkdown('<ul><li>a</li><li>b</li></ul>')).toBe('- a\n- b')
    expect(toMarkdown('<ol start="3"><li>a</li><li>b</li></ol>')).toBe('3. a\n4. b')
  })

  it('indents a nested list under its item', () => {
    expect(toMarkdown('<ul><li>a<ul><li>b</li></ul></li></ul>')).toBe('- a\n  - b')
  })

  it('renders a table with a header separator', () => {
    const html =
      '<table><thead><tr><th>Name</th><th>Plan</th></tr></thead>' +
      '<tbody><tr><td>Ada</td><td>Pro</td></tr></tbody></table>'
    expect(toMarkdown(html)).toBe('| Name | Plan |\n| --- | --- |\n| Ada | Pro |')
  })

  it('escapes a pipe inside a cell so it cannot open a column', () => {
    expect(toMarkdown('<table><tr><td>a|b</td></tr></table>')).toBe('| a\\|b |\n| --- |')
  })

  it('quotes a blockquote and rules a separator', () => {
    expect(toMarkdown('<blockquote><p>cited</p></blockquote>')).toBe('> cited')
    expect(toMarkdown('<hr/>')).toBe('---')
  })

  it('keeps whitespace inside a code fence', () => {
    expect(toMarkdown('<pre data-language="ts"><code>a\n  b</code></pre>')).toBe(
      '```ts\na\n  b\n```',
    )
  })

  it('decodes the entities a React renderer emits', () => {
    expect(toMarkdown('<p>a &amp; b &lt;c&gt; &quot;d&quot; &#x27;e&#x27;</p>')).toBe(
      'a & b <c> "d" \'e\'',
    )
  })
})

describe('toMarkdown — links', () => {
  it('writes an inline link by default', () => {
    expect(toMarkdown('<a href="/pricing">Pricing</a>')).toBe('[Pricing](/pricing)')
  })

  it('keeps only the label when stripping', () => {
    expect(toMarkdown('<a href="/x">Pricing</a>', { links: 'strip' })).toBe('Pricing')
  })

  it('numbers footnotes and lists them at the end', () => {
    const html = '<p><a href="/a">A</a> and <a href="/b">B</a></p>'
    expect(toMarkdown(html, { links: 'footnote' })).toBe('A [1] and B [2]\n\n[1] /a\n[2] /b')
  })

  it('does not print a label that is already the URL twice', () => {
    expect(toMarkdown('<a href="https://x.dev">https://x.dev</a>')).toBe('https://x.dev')
  })
})

describe('toMarkdown — affordances and state', () => {
  it('names a button', () => {
    expect(toMarkdown('<button>Save</button>')).toBe('[button: Save]')
  })

  it('names an icon-only button from its aria-label', () => {
    expect(toMarkdown('<button aria-label="Close"><svg></svg></button>')).toBe('[button: Close]')
  })

  it('reports a disabled, loading button', () => {
    expect(toMarkdown('<button disabled data-state="loading">Save</button>')).toBe(
      '[button: Save (disabled, loading)]',
    )
  })

  it('reports an input value', () => {
    expect(toMarkdown('<input aria-label="Email" value="ada@example.com"/>')).toBe(
      '[input: Email = "ada@example.com"]',
    )
  })

  it('names the input type when it is not plain text', () => {
    expect(toMarkdown('<input type="email" aria-label="Email" value=""/>')).toBe(
      '[input email: Email = ""]',
    )
  })

  it('reports checkbox state', () => {
    expect(toMarkdown('<label><input type="checkbox" checked/>Remember me</label>')).toBe(
      '[checkbox: Remember me = checked]',
    )
  })

  it('reports the selected option of a select', () => {
    const html =
      '<select aria-label="Plan"><option value="a">Free</option><option value="b" selected>Pro</option></select>'
    expect(toMarkdown(html)).toBe('[select: Plan = Pro]')
  })

  it('reports a slider value', () => {
    expect(toMarkdown('<input type="range" aria-label="Volume" value="40"/>')).toBe(
      '[slider: Volume = 40]',
    )
  })

  it('reports a progressbar as a percentage', () => {
    expect(
      toMarkdown(
        '<div role="progressbar" aria-label="Upload" aria-valuenow="30" aria-valuemax="60"></div>',
      ),
    ).toBe('[progress: Upload = 50%]')
  })

  it('marks the selected tab', () => {
    const html =
      '<div role="tablist"><button role="tab" aria-selected="true">Overview</button><button role="tab">Usage</button></div>'
    expect(toMarkdown(html)).toBe('[tab: Overview (selected)]\n[tab: Usage]')
  })

  it('drops affordance annotations when asked, keeping the words', () => {
    const html = '<p><button>Save</button> or <input aria-label="Email" value="x"/></p>'
    expect(toMarkdown(html, { annotate: false })).toBe('Save or')
  })
})

describe('toMarkdown — what is kept and what is dropped', () => {
  it('drops scripts, styles and aria-hidden decoration', () => {
    const html =
      '<div><script>alert(1)</script><style>.a{}</style><span aria-hidden="true">•</span>Real</div>'
    expect(toMarkdown(html)).toBe('Real')
  })

  it('keeps visually-hidden content, which is where a chart puts its data table', () => {
    const html =
      '<div><svg role="img" aria-label="Revenue"></svg>' +
      '<div style="position:absolute;clip-path:inset(50%)"><table><tr><th>Q</th><th>€</th></tr><tr><td>Q1</td><td>12</td></tr></table></div></div>'
    expect(toMarkdown(html)).toBe('![Revenue]\n\n| Q | € |\n| --- | --- |\n| Q1 | 12 |')
  })

  it('drops content hidden with display:none', () => {
    expect(toMarkdown('<div style="display:none">gone</div><p>here</p>')).toBe('here')
  })

  it('expands a collapsed disclosure and says it was collapsed', () => {
    const html = '<details><summary>Shipping</summary><p>Ships in 3 days.</p></details>'
    expect(toMarkdown(html)).toBe('Shipping [collapsed]\n\nShips in 3 days.')
  })

  it('expands a dialog, and claims no state the markup does not carry', () => {
    // An open Modal renders no `open` attribute — it calls showModal(). Saying "(closed)"
    // here would be a false statement an agent cannot distinguish from a true one.
    const html = '<dialog aria-label="Confirm"><p>Delete this?</p></dialog>'
    expect(toMarkdown(html)).toBe('[dialog: Confirm]\n\nDelete this?')
    expect(toMarkdown('<dialog open aria-label="Confirm"><p>x</p></dialog>')).toBe(
      '[dialog: Confirm (open)]\n\nx',
    )
  })

  it('names a landmark only when it has an accessible name', () => {
    expect(toMarkdown('<nav aria-label="Breadcrumb"><a href="/">Home</a></nav>')).toBe(
      '[nav: Breadcrumb]\n\n[Home](/)',
    )
    expect(toMarkdown('<main><p>Body</p></main>')).toBe('Body')
  })

  it('renders an alert as a marked quote', () => {
    expect(toMarkdown('<div role="alert">Payment failed</div>')).toBe('> [alert] Payment failed')
  })

  it('drops a decorative image but keeps a described one', () => {
    expect(toMarkdown('<img src="/a.png" alt=""/>')).toBe('')
    expect(toMarkdown('<img src="/a.png" alt="Chart"/>')).toBe('![Chart](/a.png)')
  })
})

describe('toMarkdown — wrapping', () => {
  it('wraps prose at the requested width', () => {
    const html = '<p>one two three four five six</p>'
    expect(toMarkdown(html, { width: 12 })).toBe('one two\nthree four\nfive six')
  })

  it('never wraps a table row', () => {
    const html = '<table><tr><td>a very long cell value indeed</td></tr></table>'
    expect(toMarkdown(html, { width: 10 })).toBe('| a very long cell value indeed |\n| --- |')
  })
})
