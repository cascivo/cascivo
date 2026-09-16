Preview cascivo email templates in a browser: every shipped theme, a viewport switcher,
per-client simulation, a live encoded-byte gauge with Gmail's clip thresholds drawn on it,
the same conformance findings CI reports, and an `.eml` download.

> **Docs offline?** The full cascivo reference ships as an npm package — `npx -y @cascivo/docs`, no website needed.

## Run it

```sh
npx @cascivo/email-preview ./emails
```

No install, no config file. Run it with no directory to browse the templates that ship with
`@cascivo/email`.

## What counts as a template

Every `.tsx` or `.jsx` file in the directory, recursively:

| Export                      | Meaning                                                   |
| --------------------------- | --------------------------------------------------------- |
| `export default`            | The component to render. Required.                        |
| `export const subject`      | The subject line. Optional.                               |
| `export const previewProps` | Props to render the component with. Optional.             |
| `export const theme`        | An `EmailTheme` name or a `Palette`. Optional.            |
| `export const allow`        | Slug → reason, waived in the conformance panel. Optional. |

Files matching `.test.`, `.spec.`, `.stories.` or a leading `_` are skipped. It is React
Email's convention, so a directory ported from there needs no changes.

```tsx
// emails/issue.tsx
import { Body, Container, Head, Heading, Html, Preview, Section } from '@cascivo/email'

export const subject = 'weeklyfoo #42'
export const previewProps = { name: 'Adam' }

export default function Issue({ name }: { name: string }) {
  return (
    <Html>
      <Head title="weeklyfoo #42" />
      <Body>
        <Preview>This week in software engineering</Preview>
        <Container>
          <Section padding={24}>
            <Heading level={1}>Hello {name}</Heading>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

Your templates are served through Vite, so edits hot-reload.

## Your brand, not ours

`renderEmail`'s `theme` takes an `EmailTheme` name **or** a `Palette`, and a `Palette` is how
the token docs say to rebrand. Say so on the template and the preview renders it that way by
default:

```tsx
// emails/issue.tsx
import { PALETTES } from '@cascivo/email'

export const theme = {
  ...PALETTES.light,
  '--cascivo-color-accent': '#b4381e',
  '--cascivo-email-font-sans': '-apple-system, Arial, sans-serif',
}
```

This is worth doing even with only one brand. Without it every render is somebody else's
email, and the byte gauge — the most useful number in the app — is wrong by whatever your
palette costs or saves. A font stack is repeated inline on every text element, so its length
is a real fraction of the message: one measured newsletter differed by 10%.

The dropdown still works. The template's own palette is the first entry and the selected one,
with the shipped twelve below it for comparison, and switching template returns to that
template's palette — so a directory of differently-branded templates each looks right without
anyone remembering which entry goes with which design.

For a palette shared across a directory, `--theme` takes a module whose default export is a
`Palette` or a record of named ones, and adds them to the dropdown:

```sh
npx @cascivo/email-preview ./emails --theme ./emails/brand.ts
```

## Conformance findings

The [Can I email](https://www.caniemail.com) matrix is ~483 KB of test data and is not
bundled, so hand it over once:

```sh
curl -o caniemail.json https://www.caniemail.com/api/data.json
npx @cascivo/email-preview ./emails --caniemail caniemail.json
```

Without it the rest of the preview works and the panel says where to get one — it will not
show a clean bill of health it has not checked.

If your CI waives a slug, tell the preview the same thing or it reports a finding your own
lint does not:

```sh
npx @cascivo/email-preview ./emails --allow ./emails/allow.json   # { "slug": "reason" }
```

`export const allow` on a template does the same for that template alone.

## Options

| Option               | Effect                                                   |
| -------------------- | -------------------------------------------------------- |
| `--port <n>`         | Port to listen on (default 4190, or the next free)       |
| `--host [addr]`      | Listen on a network address, not just localhost          |
| `--open`             | Open a browser once the server is ready                  |
| `--caniemail <file>` | The support matrix, for the conformance panel            |
| `--theme <file>`     | A `Palette`, or a record of named ones, for the dropdown |
| `--allow <file>`     | Slug → reason JSON, merged into the panel's allowlist    |
| `--help`             | All of the above                                         |

## The `.eml` download

The cheapest way to see an email in a _real_ client: download it and drag it into Outlook,
Apple Mail, or anything else on any device. No service, no account. It is built with
`buildMessage()` from `@cascivo/email`, so the envelope is the tested one.
