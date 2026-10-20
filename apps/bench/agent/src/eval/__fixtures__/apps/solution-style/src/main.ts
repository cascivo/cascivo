// Builds (Vite strips types without checking them) but fails `tsc --noEmit`.
const count: number = 'three'

document.body.append(String(count))
