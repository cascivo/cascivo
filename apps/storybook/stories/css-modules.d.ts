// Cascade components import CSS Modules from source; declare them for tsc.
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}
