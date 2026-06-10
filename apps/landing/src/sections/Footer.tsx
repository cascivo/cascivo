import { Separator } from '@cascade-ui/components/separator'

export function Footer() {
  return (
    <footer className="footer">
      <Separator />
      <div className="footer-inner">
        <div className="footer-brand">
          <span>cascade</span> ui
        </div>
        <nav className="footer-links" aria-label="Footer">
          <a href="https://github.com/cascade-ui/cascade">GitHub</a>
          <a href="/docs">Docs</a>
          <a href="/storybook">Storybook</a>
        </nav>
        <div className="footer-note">MIT licensed. Built with cascade.</div>
      </div>
    </footer>
  )
}
