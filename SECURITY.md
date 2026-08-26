# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in cascivo, please report it privately
rather than opening a public issue.

- Use GitHub's [private vulnerability reporting](https://github.com/cascivo/cascivo/security/advisories/new)
  ("Report a vulnerability" under the **Security** tab), or
- email the maintainer at the address listed on the npm package page for
  [`@cascivo/core`](https://www.npmjs.com/package/@cascivo/core).

Please include:

- a description of the vulnerability and its impact,
- steps to reproduce or a proof of concept, and
- affected package(s) and version(s).

We aim to acknowledge reports within a few business days and will keep you
informed as we investigate and ship a fix. Please give us a reasonable window
to address the issue before any public disclosure.

## Supported versions

Security fixes target the **latest minor of the current major** for every
`@cascivo/*` package on a `1.x` line. When a new major ships, the previous
major continues to receive security fixes for **six months**; older majors are
unsupported.

Packages still on `0.x` — the tooling packages listed in
[`docs/UPGRADING.md`](docs/UPGRADING.md#which-packages-are-covered) — ship from
`main`, and fixes target their latest published version only.

Run `cascivo doctor --drift` to see where your installed versions sit.
