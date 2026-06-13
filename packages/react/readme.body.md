Every cascade component, prebuilt as a normal installable library — for users
who just want to **use** the design system without owning the source. If you
want to customize component internals, use the copy-paste flow instead
(`npx cascade add <component>`); both consume the same tokens and themes, and
can coexist in one project.

## Use

```tsx
// once, in your entry file
import '@cascivo/react/styles.css'
import '@cascivo/themes/light'

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

Theming works exactly like the copy-paste flow: import a theme stylesheet and
scope it with `data-theme="light" | "dark" | "warm"` on any container. Brand
adaptation happens by overriding `--cascivo-*` custom properties — no rebuild
needed.

All components are client components (`'use client'` is preserved in the
bundle), so the package works in Next.js App Router projects out of the box.
