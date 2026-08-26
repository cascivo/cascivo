import { createRoot } from 'react-dom/client'
import '@cascivo/themes/light'
// App shell + stylesheet, nothing else — the same baseline shadcn and carbon get, so the
// incrementals compare like for like. This entry used to `void`-import `useSignals` and
// `currentLocale` to "pre-load the shared runtime": rolldown elided the core import
// entirely, while @cascivo/i18n's module-level store survived and sat 6.45KB gz in the
// baseline that most components never pull in. Every cascade incremental was understated
// by that much, and the three components that touch no i18n published a NEGATIVE cost.
createRoot(document.getElementById('root')!).render(<div>baseline</div>)
