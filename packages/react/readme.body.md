Every cascivo component, prebuilt as a normal installable library — for users
who just want to **use** the design system without owning the source. If you
want to customize component internals, use the copy-paste flow instead
(`npx cascivo add <component>`); both consume the same tokens and themes, and
can coexist in one project.

## Use

```tsx
// once, in your entry file — two imports get you a fully themed setup
import '@cascivo/react/styles.css' // component styles
import '@cascivo/themes/all' // tokens (once) + base typography + light & dark

// anywhere
import { Button, Card, CardContent, Toggle } from '@cascivo/react'

export function App() {
  return (
    <main data-theme="light">
      <Card>
        <CardContent>
          <Toggle label="Notifications" defaultChecked />
          <Button>Save</Button>
        </CardContent>
      </Card>
    </main>
  )
}
```

`@cascivo/themes/all` is the recommended single import: it loads `@cascivo/tokens`
**once**, applies the base typography layer (so plain markup uses the sans font,
not the browser serif default), and ships both the `light` and `dark` themes.

Prefer à-la-carte? Import only the themes you need — each self-imports the tokens
(deduped by URL, so light + dark load tokens once):

```tsx
import '@cascivo/react/styles.css'
import '@cascivo/themes/base' // base typography (font/line-height/color)
import '@cascivo/themes/light'
import '@cascivo/themes/dark'
```

Scope a theme with `data-theme="light" | "dark" | "warm"` on any container. Brand
adaptation happens by overriding `--cascivo-*` custom properties — no rebuild
needed.

### CSS layer ordering

cascivo ships its styles in cascade layers, ordered lowest → highest priority:

```
cascivo.base  <  cascivo.theme  <  cascivo.component
```

**Unlayered** CSS in your app always beats every cascivo layer regardless of
specificity, so your own (unlayered) styles win by default. To override cascivo
from within a layer, declare a layer ordered after `cascivo.component`. See
`CSS-LAYERS-PITFALL.md` for the full story and the recommended `@layer`
declaration. Token names and aliases are documented in `TOKENS.md`.

All components are client components (`'use client'` is preserved in the
bundle), so the package works in Next.js App Router projects out of the box.
