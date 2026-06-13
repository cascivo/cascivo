import { createRoot } from 'react-dom/client'
import '@cascade-ui/themes/light'
// Pre-load shared runtime so per-component incrementals reflect true marginal cost
import { useSignals } from '@cascade-ui/core'
import { currentLocale } from '@cascade-ui/i18n'
void useSignals
void currentLocale
createRoot(document.getElementById('root')!).render(<div>baseline</div>)
