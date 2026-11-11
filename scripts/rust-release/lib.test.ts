import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  type CrateInfo,
  bumpVersion,
  changelogSection,
  dependencyOrder,
  indexPath,
  isVersionOnlyCargoChange,
  needsRustChangeset,
  parseChangeset,
  parseIndexVersions,
  planReleases,
  prependChangelog,
  publishPlan,
  readableName,
  renderChangelogEntry,
  rewriteDependencyVersions,
  rewriteLockVersions,
  rewritePackageVersion,
  serializeChangeset,
} from './lib.ts'

const crates: CrateInfo[] = [
  { name: 'cascivo-html', version: '0.1.0', dependsOn: [] },
  { name: 'cascivo-html-cli', version: '0.1.0', dependsOn: ['cascivo-html'] },
]
const fixed = { fixed: [['cascivo-html', 'cascivo-html-cli']] }

describe('parseChangeset', () => {
  it('parses quoted and bare names and a multi-line summary', () => {
    const cs = parseChangeset(
      'a.md',
      '---\n"cascivo-html": minor\ncascivo-html-cli: patch\n---\n\nLine one.\n\nLine two.\n',
    )
    assert.deepEqual(cs.releases, [
      { crate: 'cascivo-html', bump: 'minor' },
      { crate: 'cascivo-html-cli', bump: 'patch' },
    ])
    assert.equal(cs.summary, 'Line one.\n\nLine two.')
  })
  it('rejects bad bump, missing frontmatter, empty summary, duplicates', () => {
    assert.throws(() => parseChangeset('a.md', '---\n"x": huge\n---\nhi'), /not major/)
    assert.throws(() => parseChangeset('a.md', 'no frontmatter'), /opening/)
    assert.throws(() => parseChangeset('a.md', '---\n"x": patch\n'), /closing/)
    assert.throws(() => parseChangeset('a.md', '---\n"x": patch\n---\n\n'), /empty summary/)
    assert.throws(() => parseChangeset('a.md', '---\n"x": patch\n"x": minor\n---\nhi'), /twice/)
  })
  it('allows an empty-frontmatter changeset (releases nothing)', () => {
    assert.deepEqual(parseChangeset('a.md', '---\n---\n').releases, [])
  })
  it('round-trips through serialize', () => {
    const text = serializeChangeset([{ crate: 'cascivo-html', bump: 'major' }], 'Break it.')
    assert.deepEqual(parseChangeset('a.md', text).releases, [
      { crate: 'cascivo-html', bump: 'major' },
    ])
  })
})

describe('bump math', () => {
  it('bumps semver, a major on 0.x goes to 1.0.0', () => {
    assert.equal(bumpVersion('0.1.4', 'patch'), '0.1.5')
    assert.equal(bumpVersion('0.1.4', 'minor'), '0.2.0')
    assert.equal(bumpVersion('0.1.4', 'major'), '1.0.0')
    assert.throws(() => bumpVersion('1.0.0-rc.1', 'patch'), /unsupported/)
  })
  it('takes the highest bump per crate across changesets', () => {
    const a = parseChangeset('a.md', '---\n"cascivo-html": patch\n---\nx')
    const b = parseChangeset('b.md', '---\n"cascivo-html": minor\n---\ny')
    const r = planReleases([a, b], crates, { fixed: [] })
    assert.deepEqual(
      r.map((x) => [x.crate, x.to, x.changesets.length]),
      [
        ['cascivo-html', '0.2.0', 2],
        ['cascivo-html-cli', '0.1.1', 0],
      ],
    )
  })
})

describe('fixed groups and dependents', () => {
  it('gives every group member the same version', () => {
    const a = parseChangeset('a.md', '---\n"cascivo-html": minor\n---\nx')
    const r = planReleases([a], crates, fixed)
    assert.deepEqual(
      r.map((x) => [x.crate, x.to, x.bump]),
      [
        ['cascivo-html', '0.2.0', 'minor'],
        ['cascivo-html-cli', '0.2.0', 'minor'],
      ],
    )
  })
  it('uses the highest current version in the group as the base', () => {
    const skewed = [{ ...crates[0]!, version: '0.3.0' }, crates[1]!]
    const a = parseChangeset('a.md', '---\n"cascivo-html-cli": patch\n---\nx')
    assert.deepEqual(
      planReleases([a], skewed, fixed).map((x) => x.to),
      ['0.3.1', '0.3.1'],
    )
  })
  it('patch-bumps an unbumped dependent outside any group', () => {
    const a = parseChangeset('a.md', '---\n"cascivo-html": minor\n---\nx')
    const r = planReleases([a], crates, { fixed: [] })
    assert.equal(r.find((x) => x.crate === 'cascivo-html-cli')?.to, '0.1.1')
  })
  it('rejects unknown crates', () => {
    const a = parseChangeset('a.md', '---\n"nope": patch\n---\nx')
    assert.throws(() => planReleases([a], crates, fixed), /unknown crate/)
    assert.throws(() => planReleases([], crates, { fixed: [['nope']] }), /unknown crate/)
  })
  it('plans nothing without changesets', () => {
    assert.deepEqual(planReleases([], crates, fixed), [])
  })
})

describe('Cargo.toml rewrite', () => {
  const toml = [
    '[package]',
    'name = "cascivo-html-cli"',
    'version = "0.1.0"   # keep me',
    'edition.workspace = true',
    '',
    '[dependencies]',
    'cascivo-html = { path = "../cascivo-html",   version = "0.1.0" } # lib',
    'ureq = { version = "3", optional = true }',
    '',
    '[dependencies.other]',
    'version = "1"',
    '',
    '[dev-dependencies.cascivo-html]',
    'path = "../cascivo-html"',
    'version = "0.1.0"',
    '',
  ].join('\n')

  it('rewrites only [package] version, preserving comments and spacing', () => {
    const out = rewritePackageVersion(toml, '0.2.0')
    assert.match(out, /^version = "0\.2\.0"   # keep me$/m)
    assert.equal(out.replace('0.2.0', '0.1.0'), toml)
  })
  it('does not touch [workspace.package]', () => {
    const ws = '[workspace.package]\nversion = "9.9.9"\n[package]\nname = "a"\nversion = "0.1.0"\n'
    assert.equal(
      rewritePackageVersion(ws, '0.2.0'),
      '[workspace.package]\nversion = "9.9.9"\n[package]\nname = "a"\nversion = "0.2.0"\n',
    )
  })
  it('throws when there is no [package] version', () => {
    assert.throws(
      () => rewritePackageVersion('[package]\nversion.workspace = true\n', '1.0.0'),
      /no \[package\]/,
    )
  })
  it('rewrites inline and table-form dependency requirements, only for released crates', () => {
    const out = rewriteDependencyVersions(toml, new Map([['cascivo-html', '0.2.0']]))
    assert.match(
      out,
      /cascivo-html = \{ path = "\.\.\/cascivo-html",   version = "0\.2\.0" \} # lib/,
    )
    assert.match(
      out,
      /\[dev-dependencies\.cascivo-html\]\npath = "\.\.\/cascivo-html"\nversion = "0\.2\.0"/,
    )
    assert.match(out, /ureq = \{ version = "3"/)
    assert.match(out, /\[dependencies\.other\]\nversion = "1"/)
    assert.match(out, /^version = "0\.1\.0"   # keep me$/m)
  })
  it('bumps workspace entries in Cargo.lock but not registry ones', () => {
    const lock =
      '[[package]]\nname = "cascivo-html"\nversion = "0.1.0"\n\n[[package]]\nname = "cascivo-html"\nversion = "5.0.0"\nsource = "registry+https://github.com/rust-lang/crates.io-index"\n'
    const out = rewriteLockVersions(lock, new Map([['cascivo-html', '0.2.0']]))
    assert.match(out, /version = "0\.2\.0"\n\n/)
    assert.match(out, /version = "5\.0\.0"/)
  })
})

describe('changelog', () => {
  const a = parseChangeset('a.md', '---\n"cascivo-html": minor\n---\nAdd thing.\n\nMore detail.')
  const b = parseChangeset('b.md', '---\n"cascivo-html": patch\n---\nFix bug.')
  const c = parseChangeset('c.md', '---\n"cascivo-html": major\n---\nBreak API.')
  const [html, cli] = planReleases([b, a, c], crates, fixed)

  it('groups Major/Minor/Patch and indents continuation lines', () => {
    assert.equal(
      renderChangelogEntry(html!, fixed.fixed[0]!),
      '## 1.0.0\n\n### Major Changes\n\n- Break API.\n\n### Minor Changes\n\n- Add thing.\n\n  More detail.\n\n### Patch Changes\n\n- Fix bug.\n',
    )
  })
  it('notes lockstep releases for group members no changeset names', () => {
    assert.match(
      renderChangelogEntry(cli!, fixed.fixed[0]!),
      /Released in lockstep with cascivo-html/,
    )
  })
  it('creates and prepends under the title; extracts a section', () => {
    const first = prependChangelog(null, 'cascivo-html', '## 0.2.0\n\n- x\n')
    assert.equal(first, '# cascivo-html\n\n## 0.2.0\n\n- x\n')
    const second = prependChangelog(first, 'cascivo-html', '## 0.3.0\n\n- y\n')
    assert.equal(second, '# cascivo-html\n\n## 0.3.0\n\n- y\n\n## 0.2.0\n\n- x\n')
    assert.equal(changelogSection(second, '0.2.0'), '- x')
    assert.equal(changelogSection(second, '0.3.0'), '- y')
    assert.equal(changelogSection(second, '9.9.9'), null)
  })
})

describe('publish plan', () => {
  it('orders dependencies first, deterministically, and rejects cycles', () => {
    assert.deepEqual(dependencyOrder([...crates].reverse()), ['cascivo-html', 'cascivo-html-cli'])
    assert.deepEqual(
      dependencyOrder([
        { name: 'b', version: '1.0.0', dependsOn: [] },
        { name: 'a', version: '1.0.0', dependsOn: [] },
      ]),
      ['a', 'b'],
    )
    assert.throws(
      () =>
        dependencyOrder([
          { name: 'a', version: '1.0.0', dependsOn: ['b'] },
          { name: 'b', version: '1.0.0', dependsOn: ['a'] },
        ]),
      /cycle/,
    )
  })
  it('lists only versions missing from the index', () => {
    const bumped = crates.map((c) => ({ ...c, version: '0.2.0' }))
    const published = new Map([
      ['cascivo-html', ['0.1.0']],
      ['cascivo-html-cli', ['0.1.0', '0.2.0']],
    ])
    assert.deepEqual(publishPlan(bumped, published), [{ crate: 'cascivo-html', version: '0.2.0' }])
    assert.deepEqual(
      publishPlan(
        crates,
        new Map([
          ['cascivo-html', ['0.1.0']],
          ['cascivo-html-cli', ['0.1.0']],
        ]),
      ),
      [],
    )
    assert.equal(publishPlan(crates, new Map()).length, 2)
  })
  it('computes sparse-index paths and parses entries (yanked counts as published)', () => {
    assert.equal(indexPath('cascivo-html'), 'ca/sc/cascivo-html')
    assert.equal(indexPath('abc'), '3/a/abc')
    assert.equal(indexPath('ab'), '2/ab')
    assert.equal(indexPath('a'), '1/a')
    assert.deepEqual(
      parseIndexVersions('{"vers":"0.1.0","yanked":false}\n{"vers":"0.1.1","yanked":true}\n'),
      ['0.1.0', '0.1.1'],
    )
  })
})

describe('PR gate', () => {
  const src = { path: 'crates/cascivo-html/src/lib.rs', status: 'M', before: 'a', after: 'b' }
  const toml = (before: string, after: string) => ({
    path: 'crates/cascivo-html/Cargo.toml',
    status: 'M',
    before,
    after,
  })
  it('flags src changes and non-version Cargo.toml changes', () => {
    assert.deepEqual(needsRustChangeset([src]).needed, [src.path])
    assert.equal(needsRustChangeset([toml('a = 1', 'a = 2')]).needed.length, 1)
  })
  it('ignores version-only Cargo.toml edits, tests and docs', () => {
    assert.equal(
      isVersionOnlyCargoChange(
        '[package]\nversion = "0.1.0"\nx = { path = "../x", version = "0.1.0" }',
        '[package]\nversion = "0.2.0"\nx = { path = "../x", version = "0.2.0" }',
      ),
      true,
    )
    assert.equal(
      needsRustChangeset([toml('[package]\nversion = "0.1.0"', '[package]\nversion = "0.2.0"')])
        .needed.length,
      0,
    )
    assert.equal(
      needsRustChangeset([
        { path: 'crates/cascivo-html/tests/x.rs', status: 'M', before: 'a', after: 'b' },
        { path: 'docs/x.md', status: 'M', before: 'a', after: 'b' },
      ]).needed.length,
      0,
    )
  })
  it('treats registry requirement and rust-version bumps as real changes', () => {
    const base =
      '[package]\nversion = "0.1.0"\nrust-version = "1.85"\n[dependencies]\nureq = { version = "3" }\ncascivo-html = { path = "../x", version = "0.1.0" }'
    assert.equal(isVersionOnlyCargoChange(base, base.replace('"3"', '"4"')), false)
    assert.equal(isVersionOnlyCargoChange(base, base.replace('"1.85"', '"1.90"')), false)
    assert.equal(isVersionOnlyCargoChange(base, base.replaceAll('"0.1.0"', '"0.2.0"')), true)
  })
  it('recognises the version PR by its changeset deletion', () => {
    const del = {
      path: '.changeset-rust/brave-owls-sing.md',
      status: 'D',
      before: 'x',
      after: null,
    }
    assert.equal(needsRustChangeset([src, del]).consumes, true)
    assert.equal(
      needsRustChangeset([src, { ...del, path: '.changeset-rust/README.md' }]).consumes,
      false,
    )
  })
})

describe('readableName', () => {
  it('is deterministic for a given picker and skips taken names', () => {
    assert.equal(
      readableName(() => 0, new Set()),
      'brave-bees-dance',
    )
    assert.equal(
      readableName(
        (() => {
          let i = 0
          return () => (i++ < 3 ? 0 : 1)
        })(),
        new Set(['brave-bees-dance']),
      ),
      'calm-cats-jump',
    )
  })
})
