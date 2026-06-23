// Side-effect barrel: importing this registers every built-in grammar, so the
// React surfaces resolve `language="…"` out of the box. Engine-only consumers
// who want a minimal bundle import individual grammar modules by path instead.
import './plaintext.ts'
import './json.ts'
import './javascript.ts'
import './typescript.ts'
import './css.ts'
import './html.ts'
import './markdown.ts'
import './bash.ts'
