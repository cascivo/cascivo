---
'@cascivo/react': minor
---

Re-export the router-link API (`setLinkComponent`, `getLinkComponent`, and the
`LinkComponent` type) from `@cascivo/react`. Prebuilt-package (Path B) users can now
register their framework's router `<Link>` without adding `@cascivo/core` as a direct
dependency — importing it directly was a phantom-dependency error under pnpm, since
`@cascivo/core` is only a transitive dep. Copied-source (Path A) projects can still
import it from `@cascivo/core`; both resolve the same module singleton.
