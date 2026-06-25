// Cascade components import CSS Modules from source; declare them for tsc.
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

declare module '*?raw' {
  const content: string
  export default content
}

// Vite's import.meta.glob — not available via vite/client since vite is not a direct dep.
interface ImportMeta {
  glob<T = unknown>(pattern: string, options?: { eager?: boolean; as?: string }): Record<string, T>
}
