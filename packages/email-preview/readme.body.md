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

| Export                      | Meaning                                       |
| --------------------------- | --------------------------------------------- |
| `export default`            | The component to render. Required.            |
| `export const subject`      | The subject line. Optional.                   |
| `export const previewProps` | Props to render the component with. Optional. |

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

## Conformance findings

The [Can I email](https://www.caniemail.com) matrix is ~483 KB of test data and is not
bundled, so hand it over once:

```sh
curl -o caniemail.json https://www.caniemail.com/api/data.json
npx @cascivo/email-preview ./emails --caniemail caniemail.json
```

Without it the rest of the preview works and the panel says where to get one — it will not
show a clean bill of health it has not checked.

## Options

| Option               | Effect                                             |
| -------------------- | -------------------------------------------------- |
| `--port <n>`         | Port to listen on (default 4190, or the next free) |
| `--host [addr]`      | Listen on a network address, not just localhost    |
| `--open`             | Open a browser once the server is ready            |
| `--caniemail <file>` | The support matrix, for the conformance panel      |
| `--help`             | All of the above                                   |

## The `.eml` download

The cheapest way to see an email in a _real_ client: download it and drag it into Outlook,
Apple Mail, or anything else on any device. No service, no account. It is built with
`buildMessage()` from `@cascivo/email`, so the envelope is the tested one.
