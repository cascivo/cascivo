import { Card, CardContent, ThemeProvider, useTheme } from '@cascivo/react'

export function ThemeProbe({ name }: { name: string }) {
  const [theme] = useTheme()
  return (
    <Card>
      <CardContent>
        <output data-probe={name}>{theme}</output>
      </CardContent>
    </Card>
  )
}

/** A provider in a different island, hydrating after the bare probe (Review Focus 1). */
export function ThemeHost() {
  return (
    <ThemeProvider defaultTheme="dark">
      <ThemeProbe name="hosted" />
    </ThemeProvider>
  )
}
