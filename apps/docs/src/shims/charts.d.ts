// Shim for @cascade-ui/charts in the Preact docs app.
// The Vite config aliases react→preact/compat, so React components from the
// charts package render correctly. This shim re-exports the TypeScript types
// so the Preact (jsxImportSource: preact) docs tsconfig can resolve them.
export * from '@cascade-ui/charts/src/index'
