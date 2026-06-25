// Brand page: name story, logo lockups, palette swatches, receipts for claim 25
export function BrandPage() {
  return (
    <article class="doc-page">
      <div class="doc-head">
        <div class="doc-eyebrow">Brand</div>
        <h1>Brand</h1>
        <p class="doc-lede">
          cascivo — from <em>cascade-ui</em> to a coherent identity: one name, one domain, one token
          prefix, one npm scope.
        </p>
      </div>

      <section class="doc-section">
        <h2>Name</h2>
        <p>
          <strong>cascivo</strong> <em>/kas-ˈsee-vo/</em>. Keep the <code>casc-</code> root (the CSS
          cascade, the token cascade, the waterfall); add the Romance suffix <code>-ivo</code> (cf.{' '}
          <em>attivo</em>, <em>motivo</em>) — "active, alive, flowing." One coined word, free{' '}
          <code>.com</code>.
        </p>
        <p>
          Full derivation:{' '}
          <a href="https://github.com/cascivo/cascivo/blob/main/docs/BRAND.md">BRAND.md</a>
        </p>
      </section>

      <section class="doc-section">
        <h2>Logo</h2>
        <div class="brand-logo-grid">
          <div class="brand-logo-card" data-theme="light">
            <img src="/logo.svg" alt="cascivo logo on light" height="48" />
            <span>Light</span>
          </div>
          <div class="brand-logo-card" data-theme="dark">
            <img src="/logo.svg" alt="cascivo logo on dark" height="48" />
            <span>Dark</span>
          </div>
        </div>
        <p>
          Three descending, offset rounded bars — a cascade/waterfall whose outer contour reads as a
          "C". Theme-aware: uses <code>currentColor</code> for the wordmark and{' '}
          <code>--cascivo-brand-primary</code> for the mark fill.
        </p>
      </section>

      <section class="doc-section">
        <h2>Brand palette</h2>
        <div class="brand-swatches">
          <div class="swatch" style="background: oklch(0.55 0.15 240)">
            <span class="swatch-name">Primary</span>
            <code>oklch(0.55 0.15 240)</code>
          </div>
          <div class="swatch" style="background: oklch(0.72 0.13 195)">
            <span class="swatch-name">Accent</span>
            <code>oklch(0.72 0.13 195)</code>
          </div>
          <div class="swatch" style="background: oklch(0.22 0.03 250); color: white">
            <span class="swatch-name">Ink</span>
            <code>oklch(0.22 0.03 250)</code>
          </div>
          <div
            class="swatch"
            style="background: oklch(0.99 0.005 250); border: 1px solid var(--cascivo-color-border)"
          >
            <span class="swatch-name">Paper</span>
            <code>oklch(0.99 0.005 250)</code>
          </div>
        </div>
        <p>
          Brand tokens are for landing/docs/OG only — never used in component CSS. Full spec:{' '}
          <a href="https://github.com/cascivo/cascivo/blob/main/docs/specs/brand-color.md">
            brand-color.md
          </a>
        </p>
      </section>

      <section class="doc-section">
        <h2>CSS tokens + packages</h2>
        <ul>
          <li>
            Token prefix: <code>--cascivo-*</code>
          </li>
          <li>
            npm scope: <code>@cascivo/*</code>
          </li>
          <li>
            CLI: <code>cascivo</code> (unscoped npm package, <code>npx cascivo init</code>)
          </li>
          <li>
            Domain: <code>cascivo.com</code>
          </li>
        </ul>
      </section>

      <section class="doc-section">
        <h2>Mobile-first</h2>
        <p>
          The landing and docs are rebuilt mobile-first: fluid type scale, off-canvas navigation
          with focus trap, container queries, and deliberate mobile treatments for heavy demos.
          Verified at 320, 375, 390, and 414px with zero horizontal overflow.
        </p>
        <p>
          Playwright specs: <code>apps/site/test/mobile.spec.ts</code>
        </p>
      </section>
    </article>
  )
}
