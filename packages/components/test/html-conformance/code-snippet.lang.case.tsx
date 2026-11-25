import { CodeSnippet } from '../../src/code-snippet/code-snippet'

export default (
  <CodeSnippet
    code={'const a = "x" // hi\nlet b = 1'}
    variant="multi"
    language="js"
    terminal
    title="demo"
    showCopyButton={false}
  />
)
