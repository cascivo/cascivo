import { createRoot } from 'react-dom/client'
import '@cascivo/themes/light'
// Pre-load shared runtime so per-component incrementals reflect true marginal cost
import { useSignals } from '@cascivo/core'
import { currentLocale } from '@cascivo/i18n'
void useSignals
void currentLocale
createRoot(document.getElementById('root')!).render(<div>baseline</div>)
