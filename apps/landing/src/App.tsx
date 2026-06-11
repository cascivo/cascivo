import { Hero } from './sections/Hero'
import { Features } from './sections/Features'
import { ComponentGrid } from './sections/ComponentGrid'
import { JsonPlayground } from './sections/JsonPlayground'
import { ThemeDemo } from './sections/ThemeDemo'
import { QuickStart } from './sections/QuickStart'
import { Footer } from './sections/Footer'

export function App() {
  return (
    <>
      <Hero />
      <Features />
      <ComponentGrid />
      <JsonPlayground />
      <ThemeDemo />
      <QuickStart />
      <Footer />
    </>
  )
}
