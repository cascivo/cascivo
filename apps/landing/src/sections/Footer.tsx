import { Separator } from '@cascade-ui/components/separator'

export function Footer() {
  return (
    <footer className="footer">
      <Separator />
      <div className="footer-inner">
        <div className="footer-brand">cascade</div>
        <nav className="footer-links" aria-label="Footer">
          <a href="https://github.com/urbanisierung/cascade-ui">GitHub</a>
          <a href="/docs">Docs</a>
          <a href="/storybook">Storybook</a>
          <a href="/docs/benchmarks">Benchmarks</a>
          <a href="/llms.txt" className="footer-link-mono">
            llms.txt
          </a>
          <a href="/registry.json" className="footer-link-mono">
            registry.json
          </a>
        </nav>
        <div className="footer-note">
          MIT licensed. Built with cascade — view source, it&apos;s all tokens.
        </div>
      </div>
    </footer>
  )
}
