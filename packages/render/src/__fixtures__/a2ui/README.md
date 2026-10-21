# A2UI fixtures

`v0_9/common_types.json` is the A2UI v0.9 common-types schema, downloaded from
<https://a2ui.org/specification/v0_9/common_types.json> on 2026-10-20. It is semantically identical to the
source; whitespace was normalised by the repo formatter (oxfmt via `vp check --fix`). It lets the catalog
tests compile the generated A2UI catalog offline.

The A2UI specification is licensed under Apache-2.0; copyright the A2UI authors.

`v0_9/basic_catalog.json` is the A2UI v0.9 basic catalog, downloaded verbatim from
<https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json> on 2026-10-21 (whitespace may have been
normalised by the repo formatter). `src/a2ui/basic-spec.test.ts` compares it with the hand table in
`src/a2ui/basic-spec.ts`.
