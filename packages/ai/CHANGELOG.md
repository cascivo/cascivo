# @cascivo/ai

## 0.2.4

### Patch Changes

- 483e30a: Minor improvements
- Updated dependencies [dd05e9b]
- Updated dependencies [483e30a]
- Updated dependencies [dd05e9b]
  - @cascivo/tokens@0.4.0
  - @cascivo/core@0.3.0
  - @cascivo/i18n@0.2.4

## 0.2.3

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.
- Updated dependencies [e29ad6e]
  - @cascivo/core@0.2.6
  - @cascivo/i18n@0.2.3
  - @cascivo/tokens@0.3.8

## 0.2.2

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes
- Updated dependencies [b49e0ba]
- Updated dependencies [1d7599a]
- Updated dependencies [6ee2f91]
  - @cascivo/core@0.2.5
  - @cascivo/i18n@0.2.2
  - @cascivo/tokens@0.3.7

## 0.2.1

### Patch Changes

- fc61671: Minor improvements
- Updated dependencies [fc61671]
  - @cascivo/core@0.2.4
  - @cascivo/i18n@0.2.1
  - @cascivo/tokens@0.3.6

## 0.2.0

### Minor Changes

- 5bafdb6: AI-layer delivery (audit wave 3):

  - `@cascivo/mcp` is self-contained: `tokens.catalog.json`, `context.json`, per-component `context/*.md`, `tokens.variants.json`, and `marketplace.json` are bundled into the published package, so `get_tokens`, `get_context`, `get_variant_matrix`, `validate_component`, `list_templates`, and `get_template` all work offline via `npx -y @cascivo/mcp` (previously `list_templates`/`get_template` silently returned an empty catalog for every external user, and the token/context tools required network access).
  - The marketplace catalog loader now falls back to the hosted copy and reports an explicit error when neither is available, instead of silently returning an empty catalog.
  - `get_component` responses include `version`, `files`, and per-file `fileHashes`, letting agents detect drift between installed copies and upstream.
  - One canonical artifact-host constant per package (`CASCIVO_HOST`) replaces scattered `cascivo.com` literals.
  - `@cascivo/ai` (StreamingText, AiLabel, Terminal, AiChat) is published for the first time — it was advertised in the README but marked private. First publish requires the trusted-publisher bootstrap in docs/RELEASING.md.

### Patch Changes

- Updated dependencies [5bafdb6]
  - @cascivo/i18n@0.2.0
