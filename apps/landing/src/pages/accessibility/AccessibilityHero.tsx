import { Stat } from '@cascade-ui/components/stat'
import { AXE, A11Y_COVERED, REGISTRY_TOTAL } from './data'

export function AccessibilityHero() {
  return (
    <section className="proof-hero" aria-label="Accessibility summary">
      <h1>
        Accessibility is a <span className="proof-hero-accent">build gate</span>, not a bullet
        point.
      </h1>
      <p className="proof-hero-sub">
        Every number on this page is generated at build time — from the component manifests in
        registry.json and from the bench suite&apos;s axe runs against cascade, shadcn/ui, and
        Carbon. Nothing below is hand-written.
      </p>
      <div className="proof-hero-stats">
        {AXE && (
          <>
            <Stat
              label="cascade — axe violations"
              value={AXE.cascade.violations}
              helpText="WCAG 2.1 AA · four app states"
            />
            <Stat
              label="shadcn/ui — axe violations"
              value={AXE.shadcn.violations}
              helpText="same run, same states"
            />
            <Stat
              label="Carbon — axe violations"
              value={AXE.carbon.violations}
              helpText="same run, same states"
            />
          </>
        )}
        <Stat
          label="entries with a11y metadata"
          value={`${A11Y_COVERED}/${REGISTRY_TOTAL}`}
          helpText="role · WCAG level · keyboard, from every component.meta.ts"
        />
        <Stat
          label="conformance target"
          value="WCAG 2.1 AA"
          helpText="CI fails on a single axe violation"
        />
      </div>
    </section>
  )
}
