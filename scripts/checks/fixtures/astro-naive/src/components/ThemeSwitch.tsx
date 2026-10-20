import { Button, applyTheme } from '@cascivo/react'

// `applyTheme`, not a ThemeProvider: a provider on the next page would re-apply the stored
// theme itself and hide whether the head script survives the swap.
export function ThemeSwitch() {
  return (
    <Button data-testid="theme-dark" onClick={() => applyTheme('dark')}>
      Dark theme
    </Button>
  )
}
