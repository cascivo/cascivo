/**
 * `clientJs: 'enhancement'` means something falsifiable — so falsify it.
 *
 * `client-js-parity.test.ts` machine-checks `'none'` in both directions. It cannot check
 * `'enhancement'`, and that is the direction where a wrong label does damage: `'required'`
 * written where `'enhancement'` was true costs an adopter one needless hydration, while
 * `'enhancement'` written where `'required'` was true tells them (and every agent reading
 * `registry.json`) "this works with JavaScript disabled" — and they ship something that does
 * not. When the catalog was fully declared on 2026-08-14, 72 manifests made that claim on an
 * author's judgment with nothing testing it.
 *
 * This renders every one of them with `renderToString` — no hydration, no browser — and
 * asserts the server HTML contains something a person can actually perceive or use. That is
 * the claim, stated as an assertion instead of an opinion.
 *
 * **Perceivable** means visible text, or one of the elements that carries meaning on its own
 * with no script: an image, an SVG, a form control, a link, a table. The second half matters
 * — `Avatar`, `Carousel` and `Image` legitimately render zero text, and a text-only rule
 * would have called all three broken.
 *
 * **Coverage is asserted both ways.** Every `'enhancement'` manifest must have a fixture, and
 * every fixture must match a live manifest. Without the first, adding a component silently
 * shrinks what this file proves; without the second, a renamed or re-labelled component
 * leaves a fixture behind that tests nothing. A guard that quietly covers a subset is the
 * failure mode this whole exercise exists to fix.
 *
 * Fixtures are hand-written rather than compiled out of `meta.examples`, deliberately: an
 * example is documentation and changes for documentation reasons, while these need to stay
 * the minimal props that make the component render its real content.
 *
 * Run: `vp run @cascivo/react#test` (and via `pnpm test`).
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LineChart } from '../../charts/src/index'
import { AppShell as AppShellBlock } from '../../components/src/blocks/app-shell/app-shell'
import { AuthLogin } from '../../components/src/blocks/auth-login/auth-login'
import { AuthSignup } from '../../components/src/blocks/auth-signup/auth-signup'
import { DashboardOverview } from '../../components/src/blocks/dashboard-overview/dashboard-overview'
import { MarketingFeatures } from '../../components/src/blocks/marketing-features/marketing-features'
import { SettingsProfile } from '../../components/src/blocks/settings-profile/settings-profile'
import { Highlight } from '../../editor/src/index'
import { FlowEdge } from '../../flow/src/flows/flow-edge/flow-edge'
import { AppFrame } from '../../layouts/src/app-shell/app-shell'
import { ConsoleApp } from '../../layouts/src/blocks/console-app/console-app'
import { EmptyDashboard } from '../../layouts/src/blocks/empty-dashboard/empty-dashboard'
import { LoginPage } from '../../layouts/src/blocks/login-page/login-page'
import { NotificationCenter } from '../../layouts/src/blocks/notification-center/notification-center'
import { SettingsFormPage } from '../../layouts/src/blocks/settings-form-page/settings-form-page'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AppShell,
  Avatar,
  Breadcrumb,
  Button,
  ButtonGroup,
  Carousel,
  Checkbox,
  CheckboxCard,
  CodeSnippet,
  Collapsible,
  ContainedList,
  ContainedListItem,
  Dock,
  Header,
  Image,
  Input,
  NavigationMenu,
  Notification,
  NumberInput,
  OtpInput,
  PasswordInput,
  QrCode,
  RadioCard,
  RadioCardGroup,
  RelativeTime,
  ScrollArea,
  Search,
  Select,
  SkipNavLink,
  SkipNavTarget,
  Spinner,
  Steps,
  StructuredList,
  Switcher,
  Tag,
  Textarea,
  TimePicker,
  Toc,
  Toggle,
} from './index'

/**
 * Walk up to the workspace root. Not `import.meta.url` — under Vitest that is a dev-server
 * URL, not a `file:` one — and not a hardcoded `../../..`, which silently points somewhere
 * harmless if this file moves. Throwing beats scanning an empty directory and reporting
 * full coverage of nothing.
 */
function findRepoRoot(): string {
  let dir = process.cwd()
  while (!existsSync(join(dir, 'pnpm-workspace.yaml'))) {
    const parent = dirname(dir)
    if (parent === dir) throw new Error('workspace root not found above ' + process.cwd())
    dir = parent
  }
  return dir
}

const REPO_ROOT = findRepoRoot()
const PACKAGES = join(REPO_ROOT, 'packages')

/** Every chart takes the same shape, and the claim under test is identical for all of them. */
const SERIES = [
  {
    id: 'a',
    label: 'Revenue',
    data: [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 15 },
    ],
  },
]
const chart = (): ReactElement => (
  <LineChart
    series={SERIES}
    x={(d: { x: number }) => d.x}
    y={(d: { y: number }) => d.y}
    title="Revenue"
  />
)

/**
 * Minimal props per component, keyed by manifest path (names collide — `app-shell` exists
 * three times across packages).
 *
 * The 21 charts share `chart()`: they are one component family behind one `ChartFrame`, which
 * is what emits the SVG and the accessible data table, so rendering one proves the property
 * the label rests on. Their individual geometry is covered by each chart's own tests.
 */
const FIXTURES: Record<string, () => ReactElement> = {
  'packages/components/src/accordion/accordion.meta.ts': () => (
    <Accordion type="single" defaultValue="a">
      <AccordionItem value="a">
        <AccordionTrigger>Section</AccordionTrigger>
        <AccordionContent>Body copy</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  'packages/components/src/alert/alert.meta.ts': () => (
    <Alert variant="info" title="Heads up">
      Your trial ends soon.
    </Alert>
  ),
  'packages/components/src/app-shell/app-shell.meta.ts': () => (
    <AppShell header={<header>Acme</header>} nav={<nav>Nav</nav>}>
      <h1>Dashboard</h1>
    </AppShell>
  ),
  'packages/components/src/avatar/avatar.meta.ts': () => <Avatar src="/jane.jpg" alt="Jane Doe" />,
  'packages/components/src/blocks/app-shell/app-shell.meta.ts': () => <AppShellBlock />,
  'packages/components/src/blocks/auth-login/auth-login.meta.ts': () => <AuthLogin />,
  'packages/components/src/blocks/auth-signup/auth-signup.meta.ts': () => <AuthSignup />,
  'packages/components/src/blocks/dashboard-overview/dashboard-overview.meta.ts': () => (
    <DashboardOverview />
  ),
  'packages/components/src/blocks/marketing-features/marketing-features.meta.ts': () => (
    <MarketingFeatures />
  ),
  'packages/components/src/blocks/settings-profile/settings-profile.meta.ts': () => (
    <SettingsProfile />
  ),
  'packages/components/src/breadcrumb/breadcrumb.meta.ts': () => (
    <Breadcrumb
      items={[
        { label: 'Home', href: '/' },
        { label: 'Docs', href: '/docs' },
      ]}
    />
  ),
  'packages/components/src/button-group/button-group.meta.ts': () => (
    <ButtonGroup aria-label="Alignment">
      <Button>Left</Button>
      <Button>Right</Button>
    </ButtonGroup>
  ),
  'packages/components/src/carousel/carousel.meta.ts': () => (
    <Carousel>
      <img src="/1.jpg" alt="First" />
      <img src="/2.jpg" alt="Second" />
    </Carousel>
  ),
  'packages/components/src/checkbox/checkbox.meta.ts': () => <Checkbox label="Accept terms" />,
  'packages/components/src/checkbox-card/checkbox-card.meta.ts': () => (
    <CheckboxCard title="Automated backups" description="Daily snapshots" defaultChecked />
  ),
  'packages/components/src/code-snippet/code-snippet.meta.ts': () => (
    <CodeSnippet code="npx cascivo add button" language="bash" />
  ),
  'packages/components/src/collapsible/collapsible.meta.ts': () => (
    <Collapsible trigger="Show details">
      <p>Hidden content revealed on toggle.</p>
    </Collapsible>
  ),
  'packages/components/src/contained-list/contained-list.meta.ts': () => (
    <ContainedList label="Members">
      <ContainedListItem>Ada Lovelace</ContainedListItem>
    </ContainedList>
  ),
  'packages/components/src/dock/dock.meta.ts': () => (
    <Dock
      activeIndex={0}
      items={[
        { label: 'Home', icon: '🏠', href: '/' },
        { label: 'Search', icon: '🔍', href: '/search' },
      ]}
    />
  ),
  'packages/components/src/header/header.meta.ts': () => (
    <Header brand="cascivo" links={[{ label: 'Docs', href: '/docs' }]} />
  ),
  'packages/components/src/image/image.meta.ts': () => (
    <Image src="/photo.jpg" alt="A photo" width={320} height={240} />
  ),
  'packages/components/src/input/input.meta.ts': () => (
    <Input label="Email" placeholder="you@example.com" />
  ),
  'packages/components/src/navigation-menu/navigation-menu.meta.ts': () => (
    <NavigationMenu
      aria-label="Main"
      items={[
        { id: 'home', label: 'Home', href: '/' },
        { id: 'docs', label: 'Docs', href: '/docs' },
      ]}
    />
  ),
  'packages/components/src/notification/notification.meta.ts': () => (
    <Notification variant="info" title="Sync complete" description="Your files are up to date." />
  ),
  'packages/components/src/number-input/number-input.meta.ts': () => (
    <NumberInput label="Quantity" defaultValue={1} min={0} max={99} />
  ),
  'packages/components/src/otp-input/otp-input.meta.ts': () => (
    <OtpInput value="" onValueChange={() => {}} />
  ),
  'packages/components/src/password-input/password-input.meta.ts': () => (
    <PasswordInput placeholder="Enter password" />
  ),
  'packages/components/src/qr-code/qr-code.meta.ts': () => <QrCode value="https://cascivo.dev" />,
  'packages/components/src/radio-card/radio-card.meta.ts': () => (
    <RadioCardGroup name="plan" defaultValue="pro" label="Plan">
      <RadioCard value="free" title="Free" description="For hobbyists" />
      <RadioCard value="pro" title="Pro" description="For professionals" />
    </RadioCardGroup>
  ),
  'packages/components/src/relative-time/relative-time.meta.ts': () => (
    <RelativeTime
      date={new Date('2026-01-01T00:00:00Z')}
      now={Date.parse('2026-01-02T00:00:00Z')}
    />
  ),
  'packages/components/src/scroll-area/scroll-area.meta.ts': () => (
    <ScrollArea height="12rem">
      <p>Long content that scrolls natively.</p>
    </ScrollArea>
  ),
  'packages/components/src/search/search.meta.ts': () => <Search onSearch={() => {}} />,
  'packages/components/src/select/select.meta.ts': () => (
    <Select label="Role" options={[{ value: 'admin', label: 'Admin' }]} />
  ),
  'packages/components/src/skip-nav/skip-nav.meta.ts': () => (
    <>
      <SkipNavLink />
      <SkipNavTarget />
    </>
  ),
  'packages/components/src/spinner/spinner.meta.ts': () => <Spinner />,
  'packages/components/src/steps/steps.meta.ts': () => (
    <Steps steps={[{ label: 'Cart' }, { label: 'Shipping' }]} activeStep={1} />
  ),
  'packages/components/src/structured-list/structured-list.meta.ts': () => (
    <StructuredList headers={['Name', 'Role']} items={[{ id: 'a', cells: ['Ada', 'Engineer'] }]} />
  ),
  'packages/components/src/switcher/switcher.meta.ts': () => (
    <Switcher
      items={[
        { label: 'Console', href: '/console', active: true },
        { label: 'Billing', href: '/billing' },
      ]}
    />
  ),
  'packages/components/src/tag/tag.meta.ts': () => <Tag>Design</Tag>,
  'packages/components/src/textarea/textarea.meta.ts': () => (
    <Textarea label="Message" placeholder="Type here" />
  ),
  'packages/components/src/time-picker/time-picker.meta.ts': () => (
    <TimePicker label="Meeting time" />
  ),
  'packages/components/src/toc/toc.meta.ts': () => (
    <Toc
      items={[
        { id: 'intro', label: 'Introduction' },
        { id: 'usage', label: 'Usage' },
      ]}
    />
  ),
  'packages/components/src/toggle/toggle.meta.ts': () => (
    <Toggle label="Notifications" defaultChecked />
  ),
  'packages/editor/src/editor/highlight/highlight.meta.ts': () => (
    <Highlight value="const x = 1" language="ts" />
  ),
  'packages/flow/src/flows/flow-edge/flow-edge.meta.ts': () => (
    <svg>
      <FlowEdge id="e1" sourceX={0} sourceY={0} targetX={100} targetY={100} />
    </svg>
  ),
  'packages/layouts/src/app-shell/app-shell.meta.ts': () => (
    <AppFrame header={<header>Acme</header>}>
      <h1>Dashboard</h1>
    </AppFrame>
  ),
  'packages/layouts/src/blocks/console-app/console-app.meta.ts': () => <ConsoleApp />,
  'packages/layouts/src/blocks/empty-dashboard/empty-dashboard.meta.ts': () => <EmptyDashboard />,
  'packages/layouts/src/blocks/login-page/login-page.meta.ts': () => <LoginPage />,
  'packages/layouts/src/blocks/notification-center/notification-center.meta.ts': () => (
    <NotificationCenter />
  ),
  'packages/layouts/src/blocks/settings-form-page/settings-form-page.meta.ts': () => (
    <SettingsFormPage />
  ),
}

/**
 * Content the fixture puts *inside* the component, which must survive to the server HTML.
 *
 * "Perceivable" alone only catches a component that renders nothing. It does not catch the
 * more likely mistake: rendering a trigger and hiding the content behind an open signal, so
 * the shell reaches the server and the payload does not. That is exactly the difference
 * `clientJs` is describing, so for every component where the content could plausibly be
 * gated, assert the content itself is there.
 *
 * `Collapsible` and `Accordion` pass because they are built on native `<details>` — the
 * content is in the markup and the browser does the toggling. Rebuild either on a signal and
 * this is the test that fails.
 */
const EXPECTED_CONTENT: Record<string, string> = {
  'packages/components/src/accordion/accordion.meta.ts': 'Body copy',
  'packages/components/src/alert/alert.meta.ts': 'Your trial ends soon.',
  'packages/components/src/carousel/carousel.meta.ts': '/2.jpg',
  'packages/components/src/code-snippet/code-snippet.meta.ts': 'npx cascivo add button',
  'packages/components/src/collapsible/collapsible.meta.ts': 'Hidden content revealed on toggle.',
  'packages/components/src/contained-list/contained-list.meta.ts': 'Ada Lovelace',
  'packages/components/src/navigation-menu/navigation-menu.meta.ts': 'Docs',
  'packages/components/src/notification/notification.meta.ts': 'Your files are up to date.',
  'packages/components/src/scroll-area/scroll-area.meta.ts': 'Long content that scrolls natively.',
  'packages/components/src/steps/steps.meta.ts': 'Shipping',
  'packages/components/src/structured-list/structured-list.meta.ts': 'Engineer',
  'packages/components/src/toc/toc.meta.ts': 'Usage',
  'packages/components/src/app-shell/app-shell.meta.ts': 'Dashboard',
  'packages/layouts/src/app-shell/app-shell.meta.ts': 'Dashboard',
}

/** Recursively collect `*.meta.ts` manifests, skipping build output. */
function collectMetas(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'dist' || entry.name === 'node_modules') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectMetas(full))
    else if (entry.name.endsWith('.meta.ts')) out.push(full)
  }
  return out
}

const enhancementManifests = collectMetas(PACKAGES)
  .filter((m) => /^\s*clientJs:\s*'enhancement'/m.test(readFileSync(m, 'utf8')))
  .map((m) => m.slice(REPO_ROOT.length + 1))
  .sort()

/** Charts share one fixture — see FIXTURES. */
const isChart = (path: string): boolean => path.startsWith('packages/charts/')

/**
 * Elements that convey something with no script running. The text check alone is not enough:
 * `Avatar`, `Image` and `Carousel` render no text and are still perfectly usable server-side.
 */
const PERCEIVABLE_ELEMENT = /<(img|svg|input|textarea|select|table|canvas|video|iframe|a)[\s>]/

/**
 * An accessible name with no text node — the third way to be perceivable, and the one that
 * caught this rule out. `Spinner` server-renders exactly `<span role="status"
 * aria-label="Loading">`: zero text, no replaced element, and yet entirely correct with JS
 * off, because the spinner itself is a CSS animation and the label is what a screen reader
 * announces. A stricter rule would have demanded `clientJs: 'required'` on a component that
 * needs no JavaScript whatsoever.
 */
const ACCESSIBLE_NAME = /\saria-label(?:ledby)?="[^"]+"/

describe("clientJs: 'enhancement' — the server HTML is actually usable", () => {
  it('covers every enhancement manifest', () => {
    const missing = enhancementManifests.filter((m) => !isChart(m) && FIXTURES[m] === undefined)
    expect(
      missing,
      `These manifests claim clientJs: 'enhancement' but nothing here renders them, so the ` +
        `claim is untested. Add a fixture:\n  ${missing.join('\n  ')}`,
    ).toEqual([])
  })

  it('has no fixture for a component that is no longer enhancement', () => {
    const live = new Set(enhancementManifests)
    const stale = Object.keys(FIXTURES).filter((m) => !live.has(m))
    expect(
      stale,
      `These fixtures no longer match a clientJs: 'enhancement' manifest — the component was ` +
        `renamed, removed, or re-labelled. Delete them:\n  ${stale.join('\n  ')}`,
    ).toEqual([])
  })

  it('finds the whole enhancement set (guards against a silent skip)', () => {
    expect(enhancementManifests.length).toBeGreaterThan(60)
    expect(enhancementManifests.filter(isChart).length).toBeGreaterThan(15)
  })

  for (const path of enhancementManifests) {
    const render = isChart(path) ? chart : FIXTURES[path]
    if (render === undefined) continue // reported by the coverage test above
    it(`${path.replace(/^packages\/|\.meta\.ts$/g, '')} renders usable server HTML`, () => {
      const html = renderToString(render())
      const text = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      const perceivable =
        text.length > 0 || PERCEIVABLE_ELEMENT.test(html) || ACCESSIBLE_NAME.test(html)
      expect(
        perceivable,
        `Server HTML carries no text, no perceivable element (img/svg/form control/link/` +
          `table) and no accessible name, so nothing reaches the user with JavaScript ` +
          `disabled and this manifest should say clientJs: 'required'.\n` +
          `Rendered ${html.length} bytes: ${html.slice(0, 200)}`,
      ).toBe(true)

      const expected = EXPECTED_CONTENT[path]
      if (expected !== undefined) {
        // Match the tag-stripped text as well as the raw HTML: a syntax highlighter splits
        // its content across <span data-tok> elements, so `CodeSnippet` really does ship
        // "npx cascivo add button" while the raw markup contains no such substring. The raw
        // check still matters for content that lives in an attribute (an image src).
        expect(
          text.includes(expected) || html.includes(expected),
          `The fixture put this content inside the component and it did not reach the server ` +
            `HTML, so it is unreachable with JavaScript disabled — that is clientJs: ` +
            `'required', not 'enhancement'.\nLooked for ${JSON.stringify(expected)} in: ${html.slice(0, 240)}`,
        ).toBe(true)
      }
    })
  }
})
