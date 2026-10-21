// The import has no file behind it, so `vite build` fails to resolve it.
import { missing } from './missing.ts'

document.body.append(String(missing))
