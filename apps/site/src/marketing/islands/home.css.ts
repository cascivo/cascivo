// CSS-only entry for the static home page. Same order as src/main.tsx (app.css first: it
// reaches @cascivo/tokens, whose layers.css carries the one authoritative `@layer` statement).
import '../../app.css'
import '../landing.css'
import '../poster.css'
import '../poster-sections.css'

// Component CSS modules the STATIC home markup uses (the islands bring their own with their
// JS). cascivo-web prints the hashed class names from dist/.vite/css-modules.json, so the
// sheets have to ship with this entry rather than ride along with a component import.
//
// The bindings are exported on purpose: a side-effect-only CSS-module import is dropped from
// this entry's module graph, so its sheet ends up in an unrelated chunk and never appears in
// the manifest's `css`/`imports` for this entry. Using the exports keeps them in the graph.
import skipNav from '../../../../../packages/components/src/skip-nav/skip-nav.module.css'
import stat from '../../../../../packages/components/src/stat/stat.module.css'
import copyButton from '../../../../../packages/components/src/copy-button/copy-button.module.css'
import codeSnippet from '../../../../../packages/components/src/code-snippet/code-snippet.module.css'
import tag from '../../../../../packages/components/src/tag/tag.module.css'
import aspectRatio from '../../../../../packages/components/src/aspect-ratio/aspect-ratio.module.css'
import chartFrame from '../../../../../packages/charts/src/core/chart-frame.module.css'

export const homeModules = { skipNav, stat, copyButton, codeSnippet, tag, aspectRatio, chartFrame }
