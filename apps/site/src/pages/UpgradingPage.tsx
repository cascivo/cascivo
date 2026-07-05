import { CodeBlock } from './components/CodeBlock'

const CHECK = `$ cascivo update --check
button: 2 file(s) changed upstream (0.3.8 → 0.4.0)
1 component(s) outdated.`

const UPDATE = `$ cascivo update button
  ✓ button.tsx (clean)          # your edits preserved, upstream changes merged in
  · button.module.css (unchanged)
Apply 1 change(s) to button? (y/N): y
Updated button.`

const CONFLICT = `$ cascivo update button
  ⚠ button.tsx (conflict)       # you and upstream changed the same lines
Apply 1 change(s) to button? (y/N): y
Updated button.
1 file(s) have conflict markers — resolve them manually.`

export function UpgradingPage() {
  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Upgrading</div>
        <h1>Upgrades that survive your edits</h1>
        <p class="doc-lede">
          The copy-in model has one hard problem: once you own and edit a component, how do you get
          upstream fixes without clobbering your changes? cascivo answers it with a versioned
          registry, a lockfile, and a real three-way merge — so <code>cascivo update</code> behaves
          like a package manager, not a re-download.
        </p>
      </header>

      <section class="doc-section">
        <h2>Why this is usually the hard part</h2>
        <p>
          When you copy a component into your repo, it stops tracking upstream. The typical fix is a
          two-way diff against the latest source — which can&rsquo;t tell <em>your</em> edits from{' '}
          <em>the maintainer&rsquo;s</em>, so it either overwrites your work or floods you with
          noise. The usual advice becomes &ldquo;wrap, don&rsquo;t edit,&rdquo; which quietly
          negates the ownership the model promised.
        </p>
      </section>

      <section class="doc-section">
        <h2>How cascivo does it</h2>
        <p>Three pieces make a real merge possible:</p>
        <ul class="a11y-list">
          <li>
            <strong>A versioned registry.</strong> Every component is published at a pinned version
            (<code>r/&lt;name&gt;@&lt;version&gt;.json</code>), so the <em>base</em> you installed
            is always fetchable — not just today&rsquo;s <code>main</code>.
          </li>
          <li>
            <strong>A lockfile.</strong> <code>cascivo.lock</code> records each component&rsquo;s
            name, installed version, and per-file content hashes — the memory an update needs.
          </li>
          <li>
            <strong>A three-way merge.</strong> <code>cascivo update</code> merges{' '}
            <em>base → your copy → upstream</em>, so upstream changes apply <em>around</em> your
            edits. Conflict markers appear only where you and the maintainer changed the same lines.
          </li>
        </ul>
      </section>

      <section class="doc-section">
        <h2>See what changed</h2>
        <p>
          <code>cascivo update --check</code> compares your locked content hashes against the
          registry and lists what drifted — nothing is written:
        </p>
        <CodeBlock code={CHECK} lang="bash" />
      </section>

      <section class="doc-section">
        <h2>Update, keeping your edits</h2>
        <p>
          <code>cascivo update &lt;component&gt;</code> fetches the base version you installed and
          the latest, three-way merges them into your copy, and previews the result before writing:
        </p>
        <CodeBlock code={UPDATE} lang="bash" />
        <p>
          Where you and upstream touched the same lines, the file is written with standard conflict
          markers to resolve by hand — the merge never silently drops either side:
        </p>
        <CodeBlock code={CONFLICT} lang="bash" />
      </section>

      <section class="doc-section">
        <h2>Prefer no merge at all?</h2>
        <p>
          Install the prebuilt{' '}
          <a href="/docs/getting-started">
            <code>@cascivo/react</code>
          </a>{' '}
          package instead and get updates the ordinary way — <code>npm update</code>, semver, a
          lockfile you already have. The <a href="/docs/changelog">changelog</a> lists every major
          and minor release so you can see what an upgrade brings. Own the source when you want to
          edit it; depend on the package when you don&rsquo;t.
        </p>
      </section>
    </article>
  )
}
