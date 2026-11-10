/**
 * Builds `GUIDE`, the agent-facing `.cv` cheat sheet, from CV_SPEC (names, args, aliases) plus the
 * manifest summaries. Syntax rules and examples are static; the component list is generated, so a
 * new component can never be missing from it. Kept under 6,000 chars (≈1,500 tokens); a Rust test
 * enforces that and renders every example.
 */
import type { ArgKind, CvEntry } from './cv-spec.ts'

const ARG_HINT: Record<ArgKind, string> = {
  str: '',
  num: '',
  pairs: 'a:1 b:2 …',
  nums: '1 2 3 …',
  rows: 'a,b | c,d …',
}

/** `<name>` for required args, `[name]` for optional, with a shape hint for data args. */
export function signature(e: CvEntry): string {
  const args = e.args.map((a) => {
    const hint = ARG_HINT[a.kind]
    const body = hint ? `${a.name}(${hint})` : a.name
    return a.required ? `<${body}>` : `[${body}]`
  })
  return [e.cv, ...args].join(' ')
}

/** A short clause of the manifest summary: cut at the first dash/comma/"with", then at 44 chars. */
export function shortSummary(s: string): string {
  const clause = s.split(/ [—–-] |, | with /)[0]!.replace(/\.$/, '')
  if (clause.length <= 44) return clause
  const cut = clause.slice(0, 44)
  return cut.slice(0, cut.lastIndexOf(' ')).trimEnd()
}

const SYNTAX = `# .cv — one node per line, 2-space indent = children
name [args] [key=value] [flag] ["text"]
- Strings: bare word or "quoted with spaces". A trailing "text" is the node's text.
- Props: key=value (gap=4, variant=primary). A bare word that is an enum value or a bool prop name is a flag (button Save primary).
- Data: bar Q1:12 Q2:18 | line 3 5 8 | table Name,Age | Ann,31 | Bob,42 (first row = header; props go BEFORE the rows).
- 3x card "x" repeats a node. # comment lines. Only two-space indents.
- Directives: @title "T" @lang de @brand … @brand-file brand.cv
- Aliases: cols=columns, row/col=flex, h1..h3=heading, p=text.
- @brand keys: #hex primary, accent=#hex, theme=<name>, light|dark|auto, r8 radius px, gap4, density=compact|normal|comfy, font=Inter, mono=…
- Errors print line:col and the expected signature. Run \`cascivo-html check\`.`

const EXAMPLES = `## Examples
Dashboard:
\`\`\`cv
@title "Sales"
@brand #5b5bd6 r8 gap4 dark
page-header "Sales" "Q3 overview"
cols 3
  stat Revenue "$48k" "+12%"
  stat Users 1204
  stat Churn "2.1%"
card "Trend"
  line 3 5 8 13 9 14
\`\`\`
Landing:
\`\`\`cv
@title "Acme"
center
  h1 "Ship faster"
  p "One file. No build step."
  button "Get started" primary
alert "Beta" "Invite only."
\`\`\`
Report:
\`\`\`cv
@title "Report"
h2 "Findings"
table Name,Score | Ann,31 | Bob,42
bar Mon:4 Tue:7 Wed:3
accordion
  section "Method"
    text "Survey of 200 users."
\`\`\``

export function genGuide(rows: { entry: CvEntry; summary: string }[]): string {
  const aliases = (e: CvEntry) => (e.aliases.length ? ` (${e.aliases.join(', ')})` : '')
  const list = rows
    .map(({ entry, summary }) => `${signature(entry)}${aliases(entry)} – ${shortSummary(summary)}`)
    .join('\n')
  return `${SYNTAX}\n\n## Components (cascivo-html guide <name> for all props)\n${list}\n\n${EXAMPLES}\n`
}
