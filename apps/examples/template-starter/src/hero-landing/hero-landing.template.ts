import type { TemplateMeta } from '@cascivo/registry'

export const meta: TemplateMeta = {
  intent: 'Marketing hero landing page',
  framework: 'react-vite',
  category: 'marketing',
  screenshots: [
    {
      light:
        'https://raw.githubusercontent.com/your-org/template-starter/main/screenshots/hero-landing-light.png',
      dark: 'https://raw.githubusercontent.com/your-org/template-starter/main/screenshots/hero-landing-dark.png',
      alt: 'Hero landing page with a headline and a three-column feature grid',
    },
  ],
  demoUrl: 'https://your-org.github.io/template-starter/hero-landing',
  fileRoles: {
    'src/pages/hero-landing.tsx': 'page',
    'src/pages/hero-landing.module.css': 'asset',
    'src/fixtures/hero-landing.ts': 'fixture',
  },
  pages: [{ name: 'HeroLanding', target: 'src/pages/hero-landing.tsx' }],
}
