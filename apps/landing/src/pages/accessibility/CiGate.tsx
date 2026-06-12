const GATE_SNIPPET = `# .github/workflows/bench.yml
- name: a11y gate
  run: pnpm --filter bench-runner bench a11y --gate

# apps/bench/runner/src/cli.ts — what --gate does
if (process.argv.includes('--gate') && (results.a11y?.cascade?.violations ?? 1) > 0) {
  throw new Error(
    \`a11y gate: cascade has \${results.a11y!.cascade!.violations} axe violations: \` +
      results.a11y!.cascade!.rules.join(', '),
  )
}`

export function CiGate() {
  return (
    <section className="section" id="gate" data-reveal="">
      <h2>The gate, verbatim</h2>
      <p className="section-sub">
        This is not a policy document — it is a CI step. The bench runner re-runs axe on every push
        and throws if cascade has a single violation; missing results count as a failure, not a
        pass. The competitor counts above are context; the cascade count is a build gate.
      </p>
      <pre className="a11y-gate-code" tabIndex={0}>
        <code>{GATE_SNIPPET}</code>
      </pre>
    </section>
  )
}
